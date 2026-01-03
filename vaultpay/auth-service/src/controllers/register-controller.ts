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

// 👤 REGISTER
export async function register(req: Request, res: Response) {
  try {
    const { email, password, role, deviceFingerprint } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (!password || password.length < 12) {
      return res.status(400).json({ error: 'Password must be 12+ chars' });
    }

    if (!deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hash,
      role,
      deviceFingerprint,
    });

    await user.save();

    await AuditService.log('user.registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}
