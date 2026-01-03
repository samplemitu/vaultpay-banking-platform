import Redis from 'ioredis';
import { randomInt } from 'crypto';

const redis = new Redis(process.env.REDIS_URL!);

export class MfaService {
  static async generateOTP(userId: string) {
    const otp = randomInt(100000, 999999).toString();
    await redis.set(`otp:${userId}`, otp, 'EX', 300); // 5 min TTL
    return otp;
  }

  static async verifyOTP(userId: string, otp: string) {
    const stored = await redis.get(`otp:${userId}`);
    if (stored !== otp) throw new Error('Invalid OTP');
    await redis.del(`otp:${userId}`); // one-time use
    return true;
  }
}
