import express from 'express';
import { validateSession } from '../middleware/auth.js';
import { validate, timerSchema, timerUpdateSchema } from '../validators/timerValidator.js';
import timerController from '../controllers/timerController.js';

const router = express.Router();

// All routes require authentication
router.use(validateSession);

// GET /api/timers - List all timers for the shop
router.get('/', timerController.getAllTimers.bind(timerController));

// GET /api/timers/:id - Get a specific timer
router.get('/:id', timerController.getTimer.bind(timerController));

// POST /api/timers - Create a new timer
router.post('/', validate(timerSchema), timerController.createTimer.bind(timerController));

// PUT /api/timers/:id - Update a timer (allows partial updates)
router.put('/:id', validate(timerUpdateSchema), timerController.updateTimer.bind(timerController));

// DELETE /api/timers/:id - Delete a timer
router.delete('/:id', timerController.deleteTimer.bind(timerController));

export default router;

