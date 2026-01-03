import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

export class IdempotencyService {
  static async checkAndLock(idempotencyKey: string, ttlSeconds = 60) {
    const result = await redis.set(`idem:${idempotencyKey}`, 'locked', {
      NX: true,
      EX: ttlSeconds,
    });

    // if null → key existed → duplicate request
    return result !== null;
  }

  static async release(idempotencyKey: string) {
    await redis.del(`idem:${idempotencyKey}`);
  }
}
