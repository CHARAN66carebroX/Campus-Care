import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { Complaint } from '../models/Complaint.js';
import { College } from '../models/College.js';

const router = Router();

router.get('/department', authRequired(['dept_admin']), async (req, res) => {
  try {
    const dept = req.user.department;
    const college = req.user.college;
    const base = { college, department: dept };
    const [total, underReview, inProgress, resolved, last7Days] = await Promise.all([
      Complaint.countDocuments(base),
      Complaint.countDocuments({ ...base, stage: 'under_review' }),
      Complaint.countDocuments({ ...base, stage: 'in_progress' }),
      Complaint.countDocuments({ ...base, stage: 'resolved' }),
      Complaint.countDocuments({
        ...base,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      }),
    ]);

    const byCategory = await Complaint.aggregate([
      { $match: base },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const bySentiment = await Complaint.aggregate([
      { $match: base },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);

    const resolvedList = await Complaint.find({
      ...base,
      stage: 'resolved',
      resolvedAt: { $exists: true },
    }).select('createdAt resolvedAt');

    let avgHours = null;
    if (resolvedList.length) {
      const sum = resolvedList.reduce((acc, c) => {
        return acc + (new Date(c.resolvedAt) - new Date(c.createdAt)) / 3600000;
      }, 0);
      avgHours = Math.round((sum / resolvedList.length) * 10) / 10;
    }

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const cnt = await Complaint.countDocuments({
        ...base,
        createdAt: { $gte: day, $lt: next },
      });
      trend.push({ date: day.toISOString().slice(0, 10), count: cnt });
    }

    res.json({
      total,
      pending: underReview + inProgress,
      underReview,
      inProgress,
      resolved,
      last7Days,
      avgResolutionHours: avgHours,
      byCategory,
      bySentiment,
      trend,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/college', authRequired(['college_admin']), async (req, res) => {
  try {
    const college = req.user.college;
    const base = { college };
    const [total, pending, resolved, escalated] = await Promise.all([
      Complaint.countDocuments(base),
      Complaint.countDocuments({ ...base, stage: { $ne: 'resolved' } }),
      Complaint.countDocuments({ ...base, stage: 'resolved' }),
      Complaint.countDocuments({ ...base, escalationLevel: { $gte: 1 } }),
    ]);
    res.json({ total, pending, resolved, escalated });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

router.get('/platform', authRequired(['platform_admin']), async (_req, res) => {
  try {
    const [totalColleges, totalComplaints, openComplaints] = await Promise.all([
      College.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ stage: { $ne: 'resolved' } }),
    ]);
    const collegeColl = College.collection.name;
    const byCollege = await Complaint.aggregate([
      {
        $group: {
          _id: '$college',
          count: { $sum: 1 },
          open: { $sum: { $cond: [{ $ne: ['$stage', 'resolved'] }, 1, 0] } },
        },
      },
      { $lookup: { from: collegeColl, localField: '_id', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $project: { name: '$c.name', count: 1, open: 1 } },
    ]);
    res.json({ totalColleges, totalComplaints, openComplaints, byCollege });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

export default router;
