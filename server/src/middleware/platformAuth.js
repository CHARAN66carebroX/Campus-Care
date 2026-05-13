import jwt from 'jsonwebtoken';

export function platformAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing platform token' });
    const payload = jwt.verify(token, process.env.JWT_PLATFORM_SECRET);
    if (payload.typ !== 'platform' || payload.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Platform token required' });
    }
    req.platformPayload = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid platform token' });
  }
}
