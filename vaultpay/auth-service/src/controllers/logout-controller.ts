import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user';
import { MfaService } from '../services/mfa-service';
import { AuditService } from '../services/audit-service';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/token-service';
import { decryptDeviceFingerprint } from '../models/user';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lock

// 🚪 LOGOUT (revoke refresh)
export async function logout(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await revokeRefreshToken(user.id);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    await AuditService.log('auth.logout', {
      userId: user.id,
      ip: req.ip,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Logout failed' });
  }
}
