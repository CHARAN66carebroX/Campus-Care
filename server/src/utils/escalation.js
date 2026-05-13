import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { sendMail } from './email.js';

const HOURS = {
  high: 24,
  medium: 72,
  low: 168,
};

function deadlineHours(priority) {
  return HOURS[priority] || HOURS.medium;
}

function collegeIdFrom(doc) {
  const c = doc.college;
  return c?._id ?? c;
}

export function registerEscalationJob(io) {
  const interval = Number(process.env.ESCALATION_CHECK_MS) || 5 * 60 * 1000;

  async function run() {
    const open = await Complaint.find({
      stage: { $ne: 'resolved' },
    }).populate('college department submitter');

    const now = Date.now();
    for (const c of open) {
      const hours = deadlineHours(c.priority);
      const anchor = new Date(c.lastStaffActionAt || c.createdAt).getTime();
      const due = anchor + hours * 3600 * 1000;
      if (now < due) continue;

      const prev = c.escalationLevel;

      if (prev === 0) {
        c.escalationLevel = 1;
        c.escalatedAt = new Date();
        c.lastStaffActionAt = new Date();
        await c.save();
        await notifyCollegeAdmins(c, io);
        await emailEscalation(c, 'college');
      } else if (prev === 1) {
        c.escalationLevel = 2;
        c.escalatedAt = new Date();
        c.lastStaffActionAt = new Date();
        await c.save();
        await notifyPlatformAdmins(c, io);
        await emailEscalation(c, 'platform');
      } else {
        continue;
      }

      if (c.escalationLevel !== prev) {
        io?.to?.(`college:${collegeIdFrom(c)}`).emit('complaint:escalated', { id: c._id, level: c.escalationLevel });
      }
    }
  }

  setInterval(() => {
    run().catch((e) => console.error('[escalation]', e));
  }, interval);
  run().catch((e) => console.error('[escalation]', e));
}

async function notifyCollegeAdmins(complaint, io) {
  const cid = collegeIdFrom(complaint);
  const admins = await User.find({ role: 'college_admin', college: cid, approved: true });
  for (const a of admins) {
    io.to(`user:${a._id}`).emit('complaint:escalated', { id: complaint._id, level: 1 });
  }
}

async function notifyPlatformAdmins(complaint, io) {
  const admins = await User.find({ role: 'platform_admin', approved: true });
  for (const a of admins) {
    io.to(`user:${a._id}`).emit('complaint:escalated', { id: complaint._id, level: 2 });
  }
}

async function emailEscalation(complaint, tier) {
  let recipients = [];
  if (tier === 'college') {
    const cid = collegeIdFrom(complaint);
    const users = await User.find({ role: 'college_admin', college: cid, approved: true });
    recipients = users.map((u) => u.email);
  } else {
    const users = await User.find({ role: 'platform_admin', approved: true });
    recipients = users.map((u) => u.email);
  }
  for (const to of recipients) {
    await sendMail({
      to,
      subject: `[Campus Care] Complaint escalated — ${complaint.title}`,
      text: `Complaint ${complaint._id} has escalated to ${tier} level. Priority: ${complaint.priority}.`,
    });
  }
}
