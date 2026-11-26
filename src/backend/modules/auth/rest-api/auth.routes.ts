import { Router } from 'express';
import { env } from '@/backend/config/env';
import { RequireAuth } from '@/backend/middleware/auth.middleware';
import { RateLimitWrites } from '@/backend/middleware/rate-limit.middleware';
import { authController } from './auth.controller';

export const authRoutes = Router();

// Tight limit on the credential endpoints (brute force, sign-up spam), counted in the database so it holds across
// every server instance. Tests sign up many accounts.
const credentials = RateLimitWrites({
  name: 'credentials',
  windowMs: 15 * 60_000,
  max: env.NODE_ENV === 'test' ? Number.MAX_SAFE_INTEGER : 20,
  shared: true,
});

authRoutes.post('/register', credentials, authController.Register);
authRoutes.post('/login', credentials, authController.Login);
authRoutes.post('/refresh', authController.Refresh);
authRoutes.post('/logout', authController.Logout);
authRoutes.get('/me', RequireAuth, authController.Me);
authRoutes.patch('/me', RequireAuth, authController.UpdateProfile);
