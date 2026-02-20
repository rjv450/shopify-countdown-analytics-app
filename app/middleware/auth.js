import { shopifyApi } from '@shopify/shopify-api';

/**
 * Middleware to validate shop ownership
 * In a real app, this would verify the session token
 */
export const validateShop = (req, res, next) => {
  const shop = req.headers['x-shopify-shop-domain'] || req.query.shop || req.body.shop;

  if (!shop) {
    return res.status(401).json({ error: 'Shop domain is required' });
  }

  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).json({ error: 'Invalid shop domain format' });
  }

  // Attach shop to request for use in routes
  req.shop = shop;
  next();
};

/**
 * Middleware to validate session (for authenticated routes)
 * In production, this would verify the OAuth session token
 */
export const validateSession = async (req, res, next) => {
  // For development, we'll use a simplified validation
  // In production, implement proper OAuth session validation
  const shop = req.headers['x-shopify-shop-domain'] || req.query.shop;

  if (!shop) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.shop = shop;
  next();
};






