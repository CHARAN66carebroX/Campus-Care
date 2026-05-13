import { Router } from 'express';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';

const router = Router();

router.get('/cities', async (_req, res) => {
  try {
    const cities = await College.distinct('city', { enabled: true });
    res.json(cities.sort());
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/colleges', async (req, res) => {
  try {
    const { city } = req.query;
    const q = { enabled: true };
    if (city) q.city = city;
    const list = await College.find(q).select('name city').sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/colleges/:id/departments', async (req, res) => {
  try {
    const depts = await Department.find({ college: req.params.id }).sort({ name: 1 });
    res.json(depts);
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

export default router;
