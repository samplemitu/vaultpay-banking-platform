import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token-service';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = auth.split(' ')[1];
    const payload = await verifyAccessToken(token);

    (req as any).user = {
      id: payload.id,
      role: payload.role,
      jti: payload.jti,
      exp: payload.exp, // needed for token blacklist TTL
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
