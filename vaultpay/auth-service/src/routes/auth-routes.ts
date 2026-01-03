import { Router } from 'express';
import {
  login,
  register,
  logout,
  refreshTokens,
  verifyOtp,
} from '../controllers';

import { loginLimiter, refreshLimiter } from '../middlewares/rate-limit';
import { requireAuth } from '../middlewares/require-auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/verify-otp', verifyOtp);

// Authenticated routes
router.post('/logout', requireAuth, logout);

// Refresh token route
router.post('/refresh', refreshLimiter, refreshTokens);

export default router;
