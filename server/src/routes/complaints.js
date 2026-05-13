import { Router } from 'express';
import multer from 'multer';
import { authRequired } from '../middleware/auth.js';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { detectCategory } from '../utils/category.js';
import { analyzeSentiment, sentimentToPriority } from '../utils/sentiment.js';
import { configureCloudinary, uploadBuffer } from '../utils/cloudinary.js';
import { sendMail } from '../utils/email.js';
import { COMPLAINT_TEMPLATES } from './templates.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get('/', authRequired(), async (req, res) => {
  try {
    const { stage, category } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      query.submitter = req.user._id;
    } else if (req.user.role === 'dept_admin') {
      query.college = req.user.college;
      query.department = req.user.department;
    } else if (req.user.role === 'college_admin') {
      query.college = req.user.college;
    }

    if (stage) query.stage = stage;
    if (category) query.category = category;

    let listQuery = Complaint.find(query)
      .populate('college', 'name city')
      .populate('department', 'name')
      .populate('submitter', 'name email')
      .sort(req.user.role === 'platform_admin' ? { escalationLevel: -1, createdAt: -1 } : { createdAt: -1 })
      .limit(req.user.role === 'platform_admin' ? 500 : 200);

    const list = await listQuery;

    function redact(raw) {
      const o =
        typeof raw.toObject === 'function'
          ? raw.toObject({ virtuals: true })
          : typeof raw?.toJSON === 'function'
            ? raw.toJSON()
            : JSON.parse(JSON.stringify(raw));
      if (
        o.anonymous &&
        (req.user.role === 'dept_admin' ||
          req.user.role === 'college_admin' ||
          req.user.role === 'platform_admin')
      ) {
        delete o.submitter;
        o.submitterLabel = 'Anonymous student';
      }
      return o;
    }

    res.json(list.map((c) => redact(c)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

/** Student browse college complaints (masked) */
router.get('/browse', authRequired(['student']), async (req, res) => {
  try {
    const query = {
      college: req.user.college,
      anonymous: false,
    };
    const list = await Complaint.find(query)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    for (const c of list) {
      c.submitter = null;
      c.attachments = [];
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/templates', authRequired(['student']), (_req, res) => {
  res.json(COMPLAINT_TEMPLATES);
});

router.post(
  '/',
  authRequired(['student']),
  upload.array('files', 3),
  async (req, res) => {
    try {
      if (!req.user.profileComplete) return res.status(400).json({ message: 'Complete profile first' });
      let { title, description, category: catIn, anonymous, templateId } = req.body;
      if (!title?.trim() || !description?.trim()) {
        return res.status(400).json({ message: 'Title and description are required' });
      }

      /** multipart sends strings */
      anonymous = anonymous === 'true' || anonymous === true;
      const det = detectCategory(`${title} ${description}`);
      const sentiment = analyzeSentiment(`${title} ${description}`);
      let priority = sentimentToPriority(sentiment);

      let category = catIn || det.category;

      const college = req.user.college;
      const department = req.user.department;

      const attachments = [];
      const cloudConfigured = configureCloudinary();
      if (cloudConfigured && req.files?.length) {
        for (const file of req.files) {
          if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype)) {
            return res.status(400).json({ message: `Unsupported type: ${file.mimetype}` });
          }
          const up = await uploadBuffer(file.buffer, 'complaints');
          attachments.push({ url: up.secure_url, publicId: up.public_id });
        }
      }

      const comp = await Complaint.create({
        title,
        description,
        submitter: req.user._id,
        anonymous: !!anonymous,
        college,
        department,
        category,
        suggestedCategory: det.category,
        sentiment,
        priority,
        templateId,
        attachments,
        replies: [],
        lastStaffActionAt: new Date(),
      });

      await comp.populate('college department');
      const io = req.app.get('io');
      const deptStaff = await User.find({
        role: 'dept_admin',
        college,
        department,
        approved: true,
      });
      for (const u of deptStaff) {
        io.to(`user:${u._id}`).emit('complaint:new', { id: comp._id, title: comp.title });
      }
      io.to(`college:${college}`).emit('complaint:new', { id: comp._id });

      await sendMail({
        to: req.user.email,
        subject: 'Complaint submitted',
        text: `Your complaint "${comp.title}" was received.`,
      });

      res.status(201).json(comp);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to create complaint' });
    }
  }
);

router.patch('/:id', authRequired(['dept_admin', 'college_admin', 'platform_admin']), async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'dept_admin') {
      if (!c.college.equals(req.user.college) || !c.department.equals(req.user.department)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else if (req.user.role === 'college_admin') {
      if (!c.college.equals(req.user.college)) return res.status(403).json({ message: 'Forbidden' });
    }

    const { stage, priority } = req.body;
    if (stage) c.stage = stage;
    if (priority) c.priority = priority;
    if (stage && stage !== 'resolved') c.lastStaffActionAt = new Date();
    if (stage === 'resolved') {
      c.resolvedAt = new Date();
      c.lastStaffActionAt = new Date();
    }
    await c.save();

    const io = req.app.get('io');
    if (c.submitter) {
      io.to(`user:${c.submitter.toString()}`).emit('complaint:updated', { id: c._id, stage: c.stage });
    }
    const sub = await User.findById(c.submitter);
    if (sub?.email)
      await sendMail({
        to: sub.email,
        subject: 'Complaint status updated',
        text: `Your complaint "${c.title}" is now ${c.stage.replace('_', ' ')}.`,
      });

    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/:id/reply', authRequired(['dept_admin', 'college_admin']), async (req, res) => {
  try {
    const { body } = req.body;
    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'dept_admin') {
      if (!c.college.equals(req.user.college) || !c.department.equals(req.user.department))
        return res.status(403).json({ message: 'Forbidden' });
    } else if (req.user.role === 'college_admin' && !c.college.equals(req.user.college)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    c.replies.push({
      author: req.user._id,
      role: req.user.role,
      body,
      createdAt: new Date(),
    });
    c.lastStaffActionAt = new Date();
    await c.save();
    const io = req.app.get('io');
    if (c.submitter)
      io.to(`user:${c.submitter.toString()}`).emit('complaint:reply', { id: c._id });
    const sub = await User.findById(c.submitter);
    if (sub?.email)
      await sendMail({ to: sub.email, subject: 'Reply to your complaint', text: `${body}` });

    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/:id/upvote', authRequired(['student']), async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id);
    if (!c || !c.college.equals(req.user.college)) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id.toString();
    const has = (c.upvotes || []).some((u) => u.toString() === uid);
    if (has) c.upvotes.pull(req.user._id);
    else c.upvotes.push(req.user._id);
    await c.save();
    res.json({ count: c.upvotes.length, voted: !has });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/:id', authRequired(), async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id)
      .populate('college department')
      .populate('submitter', 'name email')
      .populate('replies.author', 'name');
    if (!c) return res.status(404).json({ message: 'Not found' });
    let allowed = false;
    const sid = c.submitter?._id || c.submitter;
    if (req.user.role === 'student' && sid?.equals(req.user._id)) allowed = true;
    const cid = c.college?._id || c.college;
    const did = c.department?._id || c.department;
    if (
      req.user.role === 'dept_admin' &&
      cid.equals(req.user.college) &&
      did.equals(req.user.department)
    )
      allowed = true;
    if (req.user.role === 'college_admin' && cid.equals(req.user.college)) allowed = true;
    if (req.user.role === 'platform_admin') allowed = true;
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const o = c.toObject();
    if (o.anonymous && req.user.role !== 'student') {
      delete o.submitter;
      o.submitterLabel = 'Anonymous student';
    }
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

export default router;
