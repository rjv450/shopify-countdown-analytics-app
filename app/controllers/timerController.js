import timerRepository from '../repositories/timerRepository.js';

class TimerController {
  /**
   * Get all timers for a shop
   */
  async getAllTimers(req, res, next) {
    try {
      if (!req.shop) {
        return res.status(400).json({ error: 'Shop domain is required' });
      }
      
      const timers = await timerRepository.findAllByShop(req.shop);
      // Convert Mongoose documents to plain objects
      const timersArray = timers.map(timer => timer.toObject ? timer.toObject() : timer);
      res.json({ timers: timersArray });
    } catch (error) {
      console.error('Error in getAllTimers:', error);
      next(error);
    }
  }

  /**
   * Get a specific timer
   */
  async getTimer(req, res, next) {
    try {
      const { id } = req.params;
      const timer = await timerRepository.findByIdAndShop(id, req.shop);

      if (!timer) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.json({ timer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new timer
   */
  async createTimer(req, res, next) {
    try {
      const timerData = {
        ...req.body,
        shop: req.shop,
      };

      const timer = await timerRepository.create(timerData);
      res.status(201).json({ timer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a timer
   */
  async updateTimer(req, res, next) {
    try {
      const { id } = req.params;
      const timer = await timerRepository.update(id, req.shop, req.body);

      if (!timer) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.json({ timer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a timer
   */
  async deleteTimer(req, res, next) {
    try {
      const { id } = req.params;
      const timer = await timerRepository.delete(id, req.shop);

      if (!timer) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      res.json({ message: 'Timer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new TimerController();


