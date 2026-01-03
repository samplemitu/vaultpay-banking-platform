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

// ✅ VERIFY OTP (MFA step for new device)
export async function verifyOtp(req: Request, res: Response) {
  try {
    const { userId, otp, deviceFingerprint } = req.body;

    if (!userId || !otp || !deviceFingerprint) {
      return res
        .status(400)
        .json({ error: 'userId, otp, and deviceFingerprint are required' });
    }

    // 1. Verify OTP
    try {
      await MfaService.verifyOTP(userId, otp);
    } catch {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // 2. Load user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 3. Trust this device from now on
    user.deviceFingerprint = deviceFingerprint; // setter will encrypt
    await user.save();

    // 4. Issue tokens
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });
    const refreshToken = await generateRefreshToken(user.id);

    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000,
      })
      .json({ message: 'MFA verified, logged in successfully' });

    await AuditService.log('auth.mfa_success', {
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}
