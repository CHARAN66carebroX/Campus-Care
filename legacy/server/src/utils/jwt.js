import jwt from 'jsonwebtoken';

export function signUserToken(user, secret) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };
  if (user.college) payload.college = user.college.toString();
  if (user.department) payload.department = user.department.toString();
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function signPlatformToken(user, secret) {
  return jwt.sign(
    { sub: user._id.toString(), role: 'platform_admin', typ: 'platform' },
    secret,
    { expiresIn: '2d' }
  );
}

export function verifyUserToken(token, secret) {
  return jwt.verify(token, secret);
}

export function verifyPlatformToken(token, secret) {
  const payload = jwt.verify(token, secret);
  if (payload.typ !== 'platform' || payload.role !== 'platform_admin') {
    const err = new Error('Invalid platform token');
    err.status = 401;
    throw err;
  }
  return payload;
}
