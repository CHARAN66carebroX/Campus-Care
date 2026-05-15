import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { Otp } from '../models/Otp.js';
import { signUserToken, signPlatformToken } from '../utils/jwt.js';
import { sendMail } from '../utils/email.js';
import crypto from 'crypto';

const router = Router();

function configureGoogle() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) return;

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(null, false);
          let user = await User.findOne({ googleId: profile.id });
          if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              user.avatar = profile.photos?.[0]?.value;
              await user.save();
            }
          }
          if (!user) {
            user = await User.create({
              email,
              googleId: profile.id,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              role: 'student',
              profileComplete: false,
              approved: false,
            });
          }
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

configureGoogle();

router.post('/register/student', async (req, res) => {
  try {
    const { email, password, name, city, collegeId, departmentId } = req.body;
    if (!email || !password || !collegeId || !departmentId) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const college = await College.findOne({ _id: collegeId, enabled: true });
    if (!college) return res.status(400).json({ message: 'Invalid college' });
    const dept = await Department.findOne({ _id: departmentId, college: college._id });
    if (!dept) return res.status(400).json({ message: 'Invalid department' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const approved = !college.requiresStudentApproval;
    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      name,
      city,
      role: 'student',
      college: college._id,
      department: dept._id,
      profileComplete: true,
      approved,
    });
    await sendMail({
      to: user.email,
      subject: 'Welcome to Campus Care',
      text: approved
        ? 'Your registration is complete.'
        : 'Your account is pending department admin approval.',
    });
    const token = signUserToken(user, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        approved: user.approved,
        profileComplete: user.profileComplete,
        college: user.college,
        department: user.department,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/register/dept-admin', async (req, res) => {
  try {
    const { email, password, name, registrationKey, collegeId, departmentId } = req.body;
    if (!email || !password || !name || !registrationKey || !collegeId || !departmentId) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const college = await College.findOne({ _id: collegeId, registrationKey, enabled: true });
    if (!college) return res.status(400).json({ message: 'Invalid college or key' });
    const dept = await Department.findOne({ _id: departmentId, college: college._id });
    if (!dept) return res.status(400).json({ message: 'Invalid department' });
    const exists = await User.findOne({ email: email?.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email in use' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      name,
      role: 'dept_admin',
      college: college._id,
      department: dept._id,
      profileComplete: true,
      approved: false,
    });
    await sendMail({
      to: user.email,
      subject: 'Department admin registration',
      text: 'Your department admin account is pending college admin approval.',
    });
    const collegeAdmins = await User.find({ role: 'college_admin', college: college._id, approved: true });
    for (const a of collegeAdmins) {
      await sendMail({ to: a.email, subject: 'New dept admin pending', text: `${user.email} awaits approval.` });
    }
    res.json({ ok: true, message: 'Pending college admin approval' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/register/college-admin', async (req, res) => {
  try {
    const { email, password, name, registrationKey, collegeId } = req.body;
    if (!email || !password || !name || !registrationKey || !collegeId) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const college = await College.findOne({ _id: collegeId, registrationKey, enabled: true });
    if (!college) return res.status(400).json({ message: 'Invalid college or key' });
    const exists = await User.findOne({ email: email?.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email in use' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      name,
      role: 'college_admin',
      college: college._id,
      profileComplete: true,
      approved: false,
    });
    await sendMail({
      to: user.email,
      subject: 'College admin registration',
      text: 'Your college admin account is pending platform approval.',
    });
    const platformUsers = await User.find({ role: 'platform_admin', approved: true });
    for (const a of platformUsers) {
      await sendMail({
        to: a.email,
        subject: 'New college admin pending',
        text: `${user.email} for ${college.name} awaits approval.`,
      });
    }
    res.json({ ok: true, message: 'Pending platform approval' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.approved) return res.status(403).json({ message: 'Account pending approval' });
    if (user.role === 'platform_admin') {
      const platformToken = signPlatformToken(user, process.env.JWT_PLATFORM_SECRET);
      const token = signUserToken(user, process.env.JWT_SECRET);
      return res.json({
        platformToken,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          profileComplete: true,
          college: user.college,
          department: user.department,
        },
      });
    }
    const token = signUserToken(user, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        approved: user.approved,
        profileComplete: user.profileComplete,
        college: user.college,
        department: user.department,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.json({ ok: true }); // don't leak
    const code = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ email: user.email });
    await Otp.create({ email: user.email, code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    await sendMail({
      to: user.email,
      subject: 'Campus Care password reset',
      text: `Your OTP is ${code}. It expires in 15 minutes.`,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const otp = await Otp.findOne({ email: email?.toLowerCase(), code }).sort({ expiresAt: -1 });
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user || !password) return res.status(400).json({ message: 'Invalid request' });
    user.password = await bcrypt.hash(password, 12);
    await user.save();
    await Otp.deleteMany({ email: user.email });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

router.patch('/complete-profile', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.googleId) return res.status(400).json({ message: 'Invalid' });
    const { city, collegeId, departmentId } = req.body;
    const college = await College.findOne({ _id: collegeId, enabled: true });
    if (!college) return res.status(400).json({ message: 'Invalid college' });
    const dept = await Department.findOne({ _id: departmentId, college: college._id });
    if (!dept) return res.status(400).json({ message: 'Invalid department' });
    user.city = city;
    user.college = college._id;
    user.department = dept._id;
    user.profileComplete = true;
    user.approved = !college.requiresStudentApproval;
    await user.save();
    const refreshed = await User.findById(user._id);
    const signed = signUserToken(refreshed, process.env.JWT_SECRET);
    res.json({
      token: signed,
      user: {
        id: refreshed._id,
        email: refreshed.email,
        role: refreshed.role,
        approved: refreshed.approved,
        profileComplete: refreshed.profileComplete,
        college: refreshed.college,
        department: refreshed.department,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Profile completion failed' });
  }
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google OAuth not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google`,
  }),
  async (req, res) => {
    const user = req.user;
    const token = signUserToken(user, process.env.JWT_SECRET);
    const redirect = `${process.env.CLIENT_URL}/oauth?token=${encodeURIComponent(token)}`;
    res.redirect(redirect);
  }
);

export default router;
