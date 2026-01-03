import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const headerKey = 'x-correlation-id';
  const incomingId = req.headers[headerKey] as string | undefined;
  const correlationId = incomingId || randomUUID();

  // attach to req + response header
  (req as any).correlationId = correlationId;
  res.setHeader(headerKey, correlationId);

  next();
};
