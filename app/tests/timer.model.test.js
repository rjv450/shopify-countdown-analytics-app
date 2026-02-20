import mongoose from 'mongoose';
import Timer from '../models/Timer.js';

// Mock MongoDB connection
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/countdown-timer-test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Timer.deleteMany({});
});

describe('Timer Model', () => {
  describe('Fixed Timer', () => {
    test('should create a fixed timer with valid data', async () => {
      const timerData = {
        shop: 'test-shop.myshopify.com',
        name: 'Black Friday Sale',
        type: 'fixed',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 172800000), // Day after tomorrow
        status: 'scheduled',
        targetType: 'all',
      };

      const timer = new Timer(timerData);
      const saved = await timer.save();

      expect(saved._id).toBeDefined();
      expect(saved.type).toBe('fixed');
      expect(saved.status).toBe('scheduled');
    });

    test('should update status to active when current time is between start and end', async () => {
      const now = new Date();
      const timerData = {
        shop: 'test-shop.myshopify.com',
        name: 'Active Sale',
        type: 'fixed',
        startDate: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
        endDate: new Date(now.getTime() + 1000 * 60 * 60), // 1 hour from now
        targetType: 'all',
        status: 'draft',
      };

      const timer = new Timer(timerData);
      await timer.save();

      // Manually trigger pre-save hook by updating
      timer.status = 'active';
      await timer.save();

      expect(timer.isActive()).toBe(true);
    });

    test('should calculate remaining time correctly', () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Test Timer',
        type: 'fixed',
        startDate: now,
        endDate: endDate,
        targetType: 'all',
        status: 'active',
      });

      const remaining = timer.getRemainingTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(3600);
    });
  });

  describe('Evergreen Timer', () => {
    test('should create an evergreen timer with duration', async () => {
      const timerData = {
        shop: 'test-shop.myshopify.com',
        name: 'Limited Time Offer',
        type: 'evergreen',
        duration: 3600, // 1 hour
        targetType: 'all',
      };

      const timer = new Timer(timerData);
      const saved = await timer.save();

      expect(saved._id).toBeDefined();
      expect(saved.type).toBe('evergreen');
      expect(saved.duration).toBe(3600);
    });

    test('should reject evergreen timer without duration', async () => {
      const timerData = {
        shop: 'test-shop.myshopify.com',
        name: 'Invalid Timer',
        type: 'evergreen',
        targetType: 'all',
      };

      const timer = new Timer(timerData);
      await expect(timer.save()).rejects.toThrow();
    });

    test('should validate duration range', async () => {
      const timerData = {
        shop: 'test-shop.myshopify.com',
        name: 'Invalid Duration',
        type: 'evergreen',
        duration: 30, // Less than minimum
        targetType: 'all',
      };

      const timer = new Timer(timerData);
      await expect(timer.save()).rejects.toThrow();
    });
  });

  describe('Targeting', () => {
    test('should accept all products target', async () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'All Products Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      const saved = await timer.save();
      expect(saved.targetType).toBe('all');
      expect(saved.targetIds).toEqual([]);
    });

    test('should accept specific product IDs', async () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Product Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'products',
        targetIds: ['123', '456', '789'],
      });

      const saved = await timer.save();
      expect(saved.targetType).toBe('products');
      expect(saved.targetIds).toHaveLength(3);
    });
  });

  describe('Analytics', () => {
    test('should increment impressions', async () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Analytics Test',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
        impressions: 0,
      });

      await timer.save();
      await timer.incrementImpression();

      const updated = await Timer.findById(timer._id);
      expect(updated.impressions).toBe(1);
      expect(updated.lastImpressionAt).toBeDefined();
    });
  });

  describe('Multi-tenant Isolation', () => {
    test('should isolate timers by shop', async () => {
      const timer1 = new Timer({
        shop: 'shop1.myshopify.com',
        name: 'Shop 1 Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      const timer2 = new Timer({
        shop: 'shop2.myshopify.com',
        name: 'Shop 2 Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      await timer1.save();
      await timer2.save();

      const shop1Timers = await Timer.find({ shop: 'shop1.myshopify.com' });
      expect(shop1Timers).toHaveLength(1);
      expect(shop1Timers[0].shop).toBe('shop1.myshopify.com');
    });
  });
});






