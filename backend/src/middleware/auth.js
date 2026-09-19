import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medtech-ai-super-secure-secret-token-key-2026';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please sign in again.' });
    }
    req.user = user;
    next();
  });
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Requires one of: [${allowedRoles.join(', ')}].`
      });
    }
    next();
  };
}
