import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = Router();

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findById(payload.sub).populate('college department').lean();
    if (!u) return res.status(401).json({ message: 'Invalid token' });
    res.json(u);
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

export default router;
