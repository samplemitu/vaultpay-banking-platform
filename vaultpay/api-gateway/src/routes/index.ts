import { Router, Request, Response } from 'express';
import { ProxyService } from '../services/proxy-service';
import { requireAuth } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rate-limit';

const router = Router();

// Public auth routes (registration, login, etc.)
router.all(
  '/api/v1/auth/*',
  rateLimit('rl:public'),
  async (req: Request, res: Response) => {
    return ProxyService.proxyTo('auth', req, res);
  }
);

// Protected account routes (customer or admin)
router.all(
  '/api/v1/accounts/*',
  requireAuth(['customer', 'admin']),
  rateLimit('rl:accounts'),
  async (req: Request, res: Response) => {
    return ProxyService.proxyTo('account', req, res);
  }
);

// Protected transaction routes
router.all(
  '/api/v1/transactions/*',
  requireAuth(['customer', 'admin']),
  rateLimit('rl:transactions'),
  async (req: Request, res: Response) => {
    return ProxyService.proxyTo('transaction', req, res);
  }
);

// Fraud / Audit mostly admin
router.all(
  '/api/v1/fraud/*',
  requireAuth(['admin']),
  rateLimit('rl:fraud'),
  async (req: Request, res: Response) => {
    return ProxyService.proxyTo('fraud', req, res);
  }
);

router.all(
  '/api/v1/audit/*',
  requireAuth(['admin']),
  rateLimit('rl:audit'),
  async (req: Request, res: Response) => {
    return ProxyService.proxyTo('audit', req, res);
  }
);

export { router };
