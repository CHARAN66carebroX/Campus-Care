import { Router } from 'express';
import crypto from 'crypto';
import { platformAuth } from '../middleware/platformAuth.js';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';

const router = Router();

router.use(platformAuth);

router.get('/pending-college-admins', async (_req, res) => {
  try {
    const list = await User.find({ role: 'college_admin', approved: false })
      .populate('college', 'name city')
      .select('-password');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/approve-college-admin/:id', async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u || u.role !== 'college_admin') return res.status(404).json({ message: 'Not found' });
    u.approved = true;
    await u.save();
    res.json(u);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/colleges', async (_req, res) => {
  try {
    const cols = await College.find().sort({ city: 1, name: 1 });
    res.json(cols);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/colleges', async (req, res) => {
  try {
    const { name, city } = req.body;
    const key = crypto.randomBytes(16).toString('hex').slice(0, 24).toUpperCase();
    const college = await College.create({ name, city, registrationKey: key });
    res.status(201).json(college);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.patch('/colleges/:id', async (req, res) => {
  try {
    const { enabled } = req.body;
    const c = await College.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    if (typeof enabled === 'boolean') c.enabled = enabled;
    await c.save();
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/colleges/:id/regenerate-key', async (req, res) => {
  try {
    const c = await College.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    c.registrationKey = crypto.randomBytes(16).toString('hex').slice(0, 24).toUpperCase();
    await c.save();
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.delete('/colleges/:id', async (req, res) => {
  try {
    await College.findByIdAndDelete(req.params.id);
    await Department.deleteMany({ college: req.params.id });
    /** users remain but college ref orphan – production would soft-delete */
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/colleges/:id/departments', async (req, res) => {
  try {
    const { name } = req.body;
    const dept = await Department.create({ college: req.params.id, name });
    res.status(201).json(dept);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Duplicate department name' });
    res.status(500).json({ message: 'Failed' });
  }
});

export default router;
