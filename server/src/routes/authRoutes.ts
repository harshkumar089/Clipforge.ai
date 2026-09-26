import { Router } from 'express';
import {
  googleAuth,
  googleCallback,
  googleDevCallback,
  getMe,
  authStatus,
  logout,
  updateProfile,
  register,
  login,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// OAuth status endpoint
router.get('/status', authStatus);

// Google OAuth 2.0 / OpenID Connect endpoints
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/google/dev-callback', googleDevCallback);
router.post('/google/dev-callback', googleDevCallback);

// Session & Current User
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);
router.put('/profile', requireAuth, updateProfile);

// Legacy/Dev email & password endpoints
router.post('/register', register);
router.post('/login', login);

export default router;
