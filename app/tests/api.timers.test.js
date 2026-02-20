import request from 'supertest';
import app from '../server.js';
import Timer from '../models/Timer.js';
import mongoose from 'mongoose';

const TEST_SHOP = 'test-shop.myshopify.com';

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

describe('Timer API', () => {
  describe('POST /api/timers', () => {
    test('should create a new fixed timer', async () => {
      const timerData = {
        name: 'Test Timer',
        type: 'fixed',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
        targetType: 'all',
      };

      const response = await request(app)
        .post('/api/timers')
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .send(timerData)
        .expect(201);

      expect(response.body.timer).toBeDefined();
      expect(response.body.timer.name).toBe(timerData.name);
      expect(response.body.timer.shop).toBe(TEST_SHOP);
    });

    test('should reject timer without required fields', async () => {
      const response = await request(app)
        .post('/api/timers')
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .send({ name: 'Incomplete Timer' })
        .expect(400);

      expect(response.body.details).toBeDefined();
    });

    test('should validate shop domain', async () => {
      const response = await request(app)
        .post('/api/timers')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body.error).toContain('Authentication required');
    });
  });

  describe('GET /api/timers', () => {
    test('should list all timers for a shop', async () => {
      // Create test timers
      await Timer.create({
        shop: TEST_SHOP,
        name: 'Timer 1',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      await Timer.create({
        shop: TEST_SHOP,
        name: 'Timer 2',
        type: 'evergreen',
        duration: 3600,
        targetType: 'all',
      });

      const response = await request(app)
        .get('/api/timers')
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .expect(200);

      expect(response.body.timers).toHaveLength(2);
    });

    test('should only return timers for the specified shop', async () => {
      await Timer.create({
        shop: TEST_SHOP,
        name: 'Shop 1 Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      await Timer.create({
        shop: 'other-shop.myshopify.com',
        name: 'Shop 2 Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      const response = await request(app)
        .get('/api/timers')
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .expect(200);

      expect(response.body.timers).toHaveLength(1);
      expect(response.body.timers[0].shop).toBe(TEST_SHOP);
    });
  });

  describe('GET /api/timers/:id', () => {
    test('should get a specific timer', async () => {
      const timer = await Timer.create({
        shop: TEST_SHOP,
        name: 'Specific Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      const response = await request(app)
        .get(`/api/timers/${timer._id}`)
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .expect(200);

      expect(response.body.timer.name).toBe('Specific Timer');
    });

    test('should return 404 for non-existent timer', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/timers/${fakeId}`)
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/timers/:id', () => {
    test('should delete a timer', async () => {
      const timer = await Timer.create({
        shop: TEST_SHOP,
        name: 'To Delete',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      await request(app)
        .delete(`/api/timers/${timer._id}`)
        .set('X-Shopify-Shop-Domain', TEST_SHOP)
        .expect(200);

      const deleted = await Timer.findById(timer._id);
      expect(deleted).toBeNull();
    });
  });
});






