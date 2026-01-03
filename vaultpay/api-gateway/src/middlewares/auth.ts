import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

interface JwtPayload {
  userId: string;
  role: 'admin' | 'customer';
  deviceId: string;
  iat: number;
  exp: number;
}

export const requireAuth = (roles?: Array<'admin' | 'customer'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwt.verify(
        token,
        config.jwtAccessPublicKey,
        { algorithms: ['RS256'] }
      ) as JwtPayload;

      if (roles && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      (req as any).currentUser = {
        userId: payload.userId,
        role: payload.role,
        deviceId: payload.deviceId,
      };

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};
