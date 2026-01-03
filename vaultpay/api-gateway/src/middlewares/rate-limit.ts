import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { config } from '../config/env';
import { log, LogLevel } from '../utils/logger';

const redis = createClient({ url: config.redisUrl });
redis.connect();

export const rateLimit = (keyPrefix: string = 'rl') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).currentUser?.userId;
    const ip = req.ip;
    const key = `${keyPrefix}:${userId || 'anon'}:${ip}`;

    const { windowSec, maxRequestsPerWindow } = config.rateLimit;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      if (current > maxRequestsPerWindow) {
        const correlationId = (req as any).correlationId;
        log(LogLevel.WARN, 'Rate limit exceeded', { key, correlationId, userId, ip });

        return res.status(429).json({
          error: 'Too many requests',
        });
      }

      next();
    } catch (err) {
      // On Redis failure, fail-open but log
      log(LogLevel.ERROR, 'Rate limit error', { error: (err as Error).message });
      next();
    }
  };
};
