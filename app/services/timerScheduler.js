import Timer from '../models/Timer.js';
import * as schedule from 'node-schedule';

/**
 * Timer Scheduler Service
 * Automatically updates timer statuses based on current time
 * Uses node-schedule for reliable cron-like scheduling
 * Runs every 5 minutes to check and update Fixed timer statuses
 */
class TimerScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
    // Configurable interval (default: 5 minutes, can be set via SCHEDULER_INTERVAL_MINUTES env var)
    const intervalMinutes = parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '5', 10);
    this.intervalMinutes = intervalMinutes;
    // Cron pattern: runs every N minutes (e.g., '*/5 * * * *' for every 5 minutes)
    this.cronPattern = `*/${intervalMinutes} * * * *`;
  }

  /**
   * Update status for a single timer based on current time
   * Only updates Fixed timers, respects draft status
   */
  async updateTimerStatus(timer) {
    if (timer.type !== 'fixed') {
      return; // Only update Fixed timers
    }

    if (timer.status === 'draft') {
      return; // Don't auto-update draft timers
    }

    const now = new Date();
    let newStatus = timer.status;

    // Determine new status based on dates
    if (now < timer.startDate) {
      newStatus = 'scheduled';
    } else if (now > timer.endDate) {
      newStatus = 'expired';
    } else {
      // Current time is between startDate and endDate
      newStatus = 'active';
    }

    // Only update if status changed
    if (newStatus !== timer.status) {
      const oldStatus = timer.status;
      timer.status = newStatus;
      await timer.save();
      console.log(`[Scheduler] Updated timer ${timer._id} (${timer.name}) from ${oldStatus} to ${newStatus}`);
      return true; // Status was updated
    }

    return false; // Status unchanged
  }

  /**
   * Check and update all timers
   */
  async checkAndUpdateTimers() {
    try {
      const now = new Date();
      const startTime = Date.now();
      console.log(`[Scheduler] Checking timers at ${now.toISOString()}`);

      // Find all Fixed timers that are not draft
      const timers = await Timer.find({
        type: 'fixed',
        status: { $ne: 'draft' }
      });

      console.log(`[Scheduler] Found ${timers.length} timer(s) to check`);

      let updatedCount = 0;
      let errorCount = 0;
      
      for (const timer of timers) {
        try {
          const wasUpdated = await this.updateTimerStatus(timer);
          if (wasUpdated) {
            updatedCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`[Scheduler] Error updating timer ${timer._id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      
      if (updatedCount > 0) {
        console.log(`[Scheduler] ✅ Updated ${updatedCount} timer(s) in ${duration}ms`);
      } else if (errorCount > 0) {
        console.log(`[Scheduler] ⚠️  No updates, but ${errorCount} error(s) occurred`);
      } else {
        console.log(`[Scheduler] ✓ No timers needed updating (checked in ${duration}ms)`);
      }
    } catch (error) {
      console.error('[Scheduler] ❌ Fatal error checking timers:', error);
      // Don't throw - scheduler should continue running even if one check fails
    }
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn('[Scheduler] Already running');
      return;
    }

    console.log(`[Scheduler] Starting timer status scheduler (checking every ${this.intervalMinutes} minutes)`);
    console.log(`[Scheduler] Cron pattern: ${this.cronPattern}`);
    
    // Run immediately on start
    this.checkAndUpdateTimers();

    // Schedule recurring job using node-schedule
    this.job = schedule.scheduleJob(this.cronPattern, () => {
      this.checkAndUpdateTimers();
    });

    if (!this.job) {
      console.error('[Scheduler] Failed to create scheduled job');
      return;
    }

    this.isRunning = true;
    console.log('[Scheduler] ✅ Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    if (this.job) {
      schedule.cancelJob(this.job);
      this.job = null;
    }

    this.isRunning = false;
    console.log('[Scheduler] ⏹️  Stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      cronPattern: this.cronPattern,
      nextCheckIn: this.isRunning ? `Every ${this.intervalMinutes} minutes` : 'N/A'
    };
  }
}

// Export singleton instance
export default new TimerScheduler();

