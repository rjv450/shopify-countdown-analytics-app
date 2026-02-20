import request from 'supertest';
import app from '../server.js';
import Timer from '../models/Timer.js';
import mongoose from 'mongoose';

const TEST_SHOP = 'test-shop.myshopify.com';
const TEST_PRODUCT_ID = '123';

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

describe('Public API', () => {
  describe('GET /api/public/timer', () => {
    test('should return active timer for all products', async () => {
      await Timer.create({
        shop: TEST_SHOP,
        name: 'All Products Timer',
        type: 'fixed',
        startDate: new Date(Date.now() - 3600000), // 1 hour ago
        endDate: new Date(Date.now() + 3600000), // 1 hour from now
        targetType: 'all',
        status: 'active',
      });

      const response = await request(app)
        .get('/api/public/timer')
        .query({ productId: TEST_PRODUCT_ID, shop: TEST_SHOP })
        .expect(200);

      expect(response.body.timer).toBeDefined();
      expect(response.body.timer.type).toBe('fixed');
    });

    test('should return timer for specific product', async () => {
      await Timer.create({
        shop: TEST_SHOP,
        name: 'Product Timer',
        type: 'fixed',
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'products',
        targetIds: [TEST_PRODUCT_ID],
        status: 'active',
      });

      const response = await request(app)
        .get('/api/public/timer')
        .query({ productId: TEST_PRODUCT_ID, shop: TEST_SHOP })
        .expect(200);

      expect(response.body.timer).toBeDefined();
    });

    test('should return 404 when no timer matches', async () => {
      await Timer.create({
        shop: TEST_SHOP,
        name: 'Other Product Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'products',
        targetIds: ['999'], // Different product
        status: 'active',
      });

      const response = await request(app)
        .get('/api/public/timer')
        .query({ productId: TEST_PRODUCT_ID, shop: TEST_SHOP })
        .expect(404);

      expect(response.body.error).toContain('No active timer');
    });

    test('should increment impressions', async () => {
      const timer = await Timer.create({
        shop: TEST_SHOP,
        name: 'Analytics Timer',
        type: 'fixed',
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
        status: 'active',
        impressions: 0,
      });

      await request(app)
        .get('/api/public/timer')
        .query({ productId: TEST_PRODUCT_ID, shop: TEST_SHOP })
        .expect(200);

      // Wait a bit for async impression update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await Timer.findById(timer._id);
      expect(updated.impressions).toBeGreaterThan(0);
    });

    test('should include cache headers', async () => {
      await Timer.create({
        shop: TEST_SHOP,
        name: 'Cached Timer',
        type: 'fixed',
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
        status: 'active',
      });

      const response = await request(app)
        .get('/api/public/timer')
        .query({ productId: TEST_PRODUCT_ID, shop: TEST_SHOP })
        .expect(200);

      expect(response.headers['cache-control']).toContain('max-age=300');
    });
  });
});






