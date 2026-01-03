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

// 🔐 LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceFingerprint } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // 🔒 Account lock check
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ error: 'Account locked. Try later.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        await user.save();
        await AuditService.log('auth.locked', { userId: user.id });
        return res
          .status(423)
          .json({ error: 'Too many attempts. Account locked.' });
      }

      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ reset lock
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // 🛡 MFA trigger if new device
    // 🛡 Adaptive MFA: compare decrypted stored fingerprint with current device
    let isSameDevice = false;
    if (user.deviceFingerprint) {
      try {
        const storedFingerprint = decryptDeviceFingerprint(
          user.deviceFingerprint
        );
        isSameDevice = storedFingerprint === deviceFingerprint;
      } catch {
        isSameDevice = false;
      }
    }

    if (!isSameDevice) {
      await MfaService.generateOTP(user.id);

      await AuditService.log('auth.mfa_challenge', {
        userId: user.id,
        reason: 'New or untrusted device',
      });

      return res.status(200).json({
        message: 'New device detected. OTP sent.',
        mfaRequired: true,
        userId: user.id, // later: pre-auth token instead
      });
    }

    // 🎫 Tokens
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
      .json({ message: 'Logged in successfully' });

    await AuditService.log('auth.login', {
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
