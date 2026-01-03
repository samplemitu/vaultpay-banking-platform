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

// 🔁 REFRESH TOKENS (rotation)
export async function refreshTokens(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });
    const newRefreshToken = await rotateRefreshToken(refreshToken);

    res
      .cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000,
      })
      .json({ message: 'Tokens refreshed' });

    await AuditService.log('auth.refresh', {
      userId: user.id,
      ip: req.ip,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
