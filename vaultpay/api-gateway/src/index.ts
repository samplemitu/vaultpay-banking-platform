import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import { config } from './config/env';
import { correlationIdMiddleware } from './middlewares/correlation-id';
import { requestLogger } from './middlewares/logger';
import { router } from './routes';
import { initJetStream } from './events/publishers/request-logged-publisher';

const start = async () => {
  console.log('Starting API Gateway...');

  // Connect JetStream (Audit logs)
  await initJetStream();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Observability first
  app.use(correlationIdMiddleware);
  app.use(requestLogger);

  // Routing
  app.use(router);

  // Unknown routes handler
  app.all('*', (req: Request, res: Response) => {
    return res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  });

  app.listen(config.port, () => {
    console.log(`API Gateway running at http://localhost:${config.port}`);
  });
};

// Boot the system
start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
