import express from 'express';
import { validateSession } from '../middleware/auth.js';
import analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

// All routes require authentication
router.use(validateSession);

// GET /api/analytics/timer/:id - Get analytics for a specific timer
router.get('/timer/:id', analyticsController.getTimerAnalytics.bind(analyticsController));

// GET /api/analytics/summary - Get analytics summary for all timers
router.get('/summary', analyticsController.getAnalyticsSummary.bind(analyticsController));

export default router;

