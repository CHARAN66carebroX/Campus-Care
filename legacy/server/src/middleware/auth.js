import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function authRequired(requiredRoles = null) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: 'Missing token' });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return res.status(401).json({ message: 'Invalid user' });
      if (!user.approved) return res.status(403).json({ message: 'Account pending approval' });
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user;
      req.tokenPayload = payload;
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
