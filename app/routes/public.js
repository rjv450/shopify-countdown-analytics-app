import express from 'express';
import { validateShop } from '../middleware/auth.js';
import { publicRateLimiter } from '../middleware/rateLimiter.js';
import { validateQuery, timerQuerySchema } from '../validators/publicValidator.js';
import publicController from '../controllers/publicController.js';

const router = express.Router();

// Public routes with rate limiting
router.use(publicRateLimiter);
router.use(validateShop);

// GET /api/public/timer - Get active timer for a product
router.get(
  '/timer',
  validateQuery(timerQuerySchema),
  publicController.getActiveTimer.bind(publicController)
);

export default router;

