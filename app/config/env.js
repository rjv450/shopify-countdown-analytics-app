import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from app directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Also try root .env file
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

export const config = {
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    scopes: process.env.SCOPES?.split(',') || ['write_products', 'read_products'],
    appUrl: process.env.SHOPIFY_APP_URL || 'http://localhost:3000',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/countdown-timer',
  },
};

// Validate required environment variables
export function validateEnv() {
  const required = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'MONGODB_URI',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && config.server.nodeEnv === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missing.join(', ')}\n` +
      'Some features may not work correctly. Please check your .env file.'
    );
  }
}

export default config;






