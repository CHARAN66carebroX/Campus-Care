import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { Complaint } from '../models/Complaint.js';

const router = Router();

function escapeCsv(cell) {
  const s = String(cell ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n'))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

router.get('/complaints.csv', authRequired(['dept_admin']), async (req, res) => {
  try {
    const list = await Complaint.find({
      college: req.user.college,
      department: req.user.department,
    })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'id',
      'title',
      'stage',
      'priority',
      'category',
      'sentiment',
      'anonymous',
      'createdAt',
      'resolvedAt',
    ];
    const rows = [
      headers.join(','),
      ...list.map((c) =>
        [
          c._id.toString(),
          escapeCsv(c.title),
          c.stage,
          c.priority,
          c.category,
          c.sentiment,
          c.anonymous,
          c.createdAt?.toISOString(),
          c.resolvedAt?.toISOString() || '',
        ].join(',')
      ),
    ];

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="complaints.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ message: 'Export failed' });
  }
});

export default router;
