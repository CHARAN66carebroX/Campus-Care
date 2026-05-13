import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/pending', authRequired(['dept_admin', 'college_admin']), async (req, res) => {
  try {
    if (req.user.role === 'dept_admin') {
      const list = await User.find({
        role: 'student',
        college: req.user.college,
        department: req.user.department,
        approved: false,
      }).select('-password');
      return res.json(list);
    }
    /** college_admin */
    const list = await User.find({
      role: 'dept_admin',
      college: req.user.college,
      approved: false,
    })
      .select('-password')
      .populate('department', 'name');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/approve/:id', authRequired(['dept_admin', 'college_admin']), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Not found' });
    if (!target.college?.equals(req.user.college))
      return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'dept_admin') {
      if (target.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
      if (!target.department?.equals(req.user.department))
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'college_admin' && target.role !== 'dept_admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    target.approved = true;
    await target.save();
    res.json(target);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/reject/:id', authRequired(['dept_admin', 'college_admin']), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Not found' });
    if (!target.college?.equals(req.user.college))
      return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'dept_admin' && target.role === 'student' && target.department?.equals(req.user.department)) {
      await target.deleteOne();
      return res.json({ ok: true });
    }
    if (req.user.role === 'college_admin' && target.role === 'dept_admin') {
      await target.deleteOne();
      return res.json({ ok: true });
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

export default router;
