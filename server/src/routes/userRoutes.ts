import { Router } from 'express';
import { getMe, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/profile', getMe);
router.patch('/profile', updateProfile);

export default router;
