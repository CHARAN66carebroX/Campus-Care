import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/** Builds Apollo context from `Authorization: Bearer <JWT>` (same token as REST `/api`). */
export async function buildGraphQLContext({ req }) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { user: null, req };
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await User.findById(payload.sub).lean();
    if (!userDoc || !userDoc.approved) return { user: null, req };
    return { user: userDoc, req };
  } catch {
    return { user: null, req };
  }
}
