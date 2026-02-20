import Timer from '../models/Timer.js';

class TimerRepository {
  /**
   * Find all timers for a shop
   */
  async findAllByShop(shop, options = {}) {
    const query = { shop };
    
    if (options.status) {
      query.status = options.status;
    }
    
    if (options.statuses) {
      query.status = { $in: options.statuses };
    }

    return Timer.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find a timer by ID and shop
   */
  async findByIdAndShop(id, shop) {
    return Timer.findOne({ _id: id, shop });
  }

  /**
   * Find active timers for a shop
   */
  async findActiveByShop(shop) {
    return Timer.find({
      shop,
      status: { $in: ['active', 'scheduled'] },
    });
  }

  /**
   * Create a new timer
   */
  async create(timerData) {
    const timer = new Timer(timerData);
    return timer.save();
  }

  /**
   * Update a timer
   */
  async update(id, shop, updateData) {
    try {
      const timer = await Timer.findOne({ _id: id, shop });
      
      if (!timer) {
        return null;
      }

      // Don't allow updating shop field
      const { shop: _, ...dataToUpdate } = updateData;
      
      // Update fields
      Object.assign(timer, dataToUpdate);
      
      // Save and return updated timer
      const updated = await timer.save();
      return updated;
    } catch (error) {
      console.error('Error updating timer:', error);
      throw error;
    }
  }

  /**
   * Delete a timer
   */
  async delete(id, shop) {
    return Timer.findOneAndDelete({ _id: id, shop });
  }

  /**
   * Find timer matching targeting rules
   * Returns the highest priority timer if multiple match
   * Priority order: 1) Specific products/collections, 2) Priority field, 3) Most recent
   */
  async findMatchingTimer(shop, productId, collectionId) {
    const activeTimers = await this.findActiveByShop(shop);
    const matchingTimers = [];

    for (const timer of activeTimers) {
      // Check if timer is actually active (for fixed timers)
      if (!timer.isActive()) {
        continue;
      }

      let matches = false;
      let specificity = 0; // Higher = more specific (products > collections > all)

      // Check targeting and calculate specificity
      if (timer.targetType === 'products' && productId) {
        if (timer.targetIds.includes(productId)) {
          matches = true;
          specificity = 3; // Most specific
        }
      } else if (timer.targetType === 'collections' && collectionId) {
        if (timer.targetIds.includes(collectionId)) {
          matches = true;
          specificity = 2; // Medium specificity
        }
      } else if (timer.targetType === 'all') {
        matches = true;
        specificity = 1; // Least specific
      }

      if (matches) {
        matchingTimers.push({ timer, specificity, priority: timer.priority || 0 });
      }
    }

    if (matchingTimers.length === 0) {
      return null;
    }

    // Sort by: 1) Specificity (desc), 2) Priority (desc), 3) Created date (desc = most recent)
    matchingTimers.sort((a, b) => {
      if (a.specificity !== b.specificity) {
        return b.specificity - a.specificity; // Higher specificity first
      }
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      // Most recent first
      return new Date(b.timer.createdAt) - new Date(a.timer.createdAt);
    });

    const selectedTimer = matchingTimers[0].timer;
    
    // Log conflict warning if multiple timers match
    if (matchingTimers.length > 1) {
      console.warn(`[Timer Conflict] Multiple timers match (${matchingTimers.length}). Selected: "${selectedTimer.name}" (Priority: ${selectedTimer.priority || 0})`);
      console.warn(`[Timer Conflict] Other matching timers:`, matchingTimers.slice(1).map(t => ({
        name: t.timer.name,
        priority: t.priority,
        createdAt: t.timer.createdAt
      })));
    }

    return selectedTimer;
  }

  /**
   * Increment impression count
   */
  async incrementImpression(timerId) {
    const timer = await Timer.findById(timerId);
    if (timer) {
      return timer.incrementImpression();
    }
    return null;
  }

  /**
   * Get analytics summary for a shop
   */
  async getAnalyticsSummary(shop) {
    const timers = await this.findAllByShop(shop);
    
    return {
      totalTimers: timers.length,
      activeTimers: timers.filter((t) => t.status === 'active').length,
      totalImpressions: timers.reduce((sum, t) => sum + (t.impressions || 0), 0),
      timers: timers.map((timer) => ({
        id: timer._id.toString(),
        name: timer.name,
        impressions: timer.impressions || 0,
        status: timer.status,
        lastImpressionAt: timer.lastImpressionAt,
      })),
    };
  }
}

export default new TimerRepository();


