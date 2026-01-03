import { Request, Response, NextFunction } from 'express';
import { log, LogLevel } from '../utils/logger';
import { publishRequestLog } from '../events/publishers/request-logged-publisher';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();
  const correlationId = (req as any).correlationId;

  res.on('finish', async () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const data = {
      correlationId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: +durationMs.toFixed(2),
      ip: req.ip,
      userId: (req as any).currentUser?.userId || null,
      role: (req as any).currentUser?.role || null,
    };

    // Local logs
    log(LogLevel.INFO, 'HTTP Request', data);

    // Publish to NATS JetStream
    try {
      await publishRequestLog(data);
    } catch (e) {
      log(LogLevel.ERROR, 'Failed to publish request log', {
        error: (e as Error).message,
      });
    }
  });

  next();
};
