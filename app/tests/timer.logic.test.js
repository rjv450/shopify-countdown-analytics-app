import Timer from '../models/Timer.js';

describe('Timer Business Logic', () => {
  describe('isActive() method', () => {
    test('should return false for expired timer', () => {
      const now = new Date();
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Expired Timer',
        type: 'fixed',
        startDate: new Date(now.getTime() - 7200000), // 2 hours ago
        endDate: new Date(now.getTime() - 3600000), // 1 hour ago
        targetType: 'all',
        status: 'expired',
      });

      expect(timer.isActive()).toBe(false);
    });

    test('should return false for draft timer', () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Draft Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
        status: 'draft',
      });

      expect(timer.isActive()).toBe(false);
    });

    test('should return true for active fixed timer', () => {
      const now = new Date();
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Active Timer',
        type: 'fixed',
        startDate: new Date(now.getTime() - 3600000), // 1 hour ago
        endDate: new Date(now.getTime() + 3600000), // 1 hour from now
        targetType: 'all',
        status: 'active',
      });

      expect(timer.isActive()).toBe(true);
    });

    test('should return true for active evergreen timer', () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Evergreen Timer',
        type: 'evergreen',
        duration: 3600,
        targetType: 'all',
        status: 'active',
      });

      expect(timer.isActive()).toBe(true);
    });
  });

  describe('Targeting Logic', () => {
    test('should match all products', () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'All Products',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      // Timer with targetType 'all' should match any product
      expect(timer.targetType).toBe('all');
    });

    test('should match specific product', () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Product Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'products',
        targetIds: ['123', '456'],
      });

      expect(timer.targetIds.includes('123')).toBe(true);
      expect(timer.targetIds.includes('789')).toBe(false);
    });
  });

  describe('Customization', () => {
    test('should have default customization values', () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Default Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
      });

      expect(timer.customization.backgroundColor).toBe('#ff0000');
      expect(timer.customization.textColor).toBe('#ffffff');
      expect(timer.customization.position).toBe('top');
      expect(timer.customization.message).toBe('Hurry! Sale ends in');
    });

    test('should accept custom colors', () => {
      const timer = new Timer({
        shop: 'test-shop.myshopify.com',
        name: 'Custom Timer',
        type: 'fixed',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        targetType: 'all',
        customization: {
          backgroundColor: '#0000ff',
          textColor: '#ffff00',
        },
      });

      expect(timer.customization.backgroundColor).toBe('#0000ff');
      expect(timer.customization.textColor).toBe('#ffff00');
    });
  });
});






