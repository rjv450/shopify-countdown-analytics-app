import timerRepository from '../repositories/timerRepository.js';

class PublicController {
  /**
   * Get active timer for a product
   */
  async getActiveTimer(req, res, next) {
    try {
      const { productId, collectionId } = req.query;
      const shop = req.shop;

      if (!productId && !collectionId) {
        return res.status(400).json({ error: 'productId or collectionId is required' });
      }

      const matchingTimer = await timerRepository.findMatchingTimer(
        shop,
        productId,
        collectionId
      );

      if (!matchingTimer) {
        return res.status(404).json({ error: 'No active timer found' });
      }

      // Increment impression count (async, don't wait)
      timerRepository.incrementImpression(matchingTimer._id).catch((err) => {
        console.error('Error incrementing impression:', err);
      });

      // Prepare response
      const response = {
        id: matchingTimer._id.toString(),
        type: matchingTimer.type,
        customization: matchingTimer.customization,
      };

      if (matchingTimer.type === 'fixed') {
        response.endDate = matchingTimer.endDate.toISOString();
        response.remainingSeconds = matchingTimer.getRemainingTime();
      } else {
        // Evergreen timer
        response.duration = matchingTimer.duration;
      }

      // Set cache headers (5 minutes)
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ timer: response });
    } catch (error) {
      next(error);
    }
  }
}

export default new PublicController();






