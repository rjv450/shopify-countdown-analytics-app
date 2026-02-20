import timerRepository from '../repositories/timerRepository.js';

class AnalyticsController {
  /**
   * Get analytics for a specific timer
   */
  async getTimerAnalytics(req, res, next) {
    try {
      const { id } = req.params;
      const timer = await timerRepository.findByIdAndShop(id, req.shop);

      if (!timer) {
        return res.status(404).json({ error: 'Timer not found' });
      }

      const analytics = {
        impressions: timer.impressions || 0,
        lastImpressionAt: timer.lastImpressionAt,
        createdAt: timer.createdAt,
        status: timer.status,
      };

      res.json({ analytics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get analytics summary for all timers
   */
  async getAnalyticsSummary(req, res, next) {
    try {
      const summary = await timerRepository.getAnalyticsSummary(req.shop);
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();






