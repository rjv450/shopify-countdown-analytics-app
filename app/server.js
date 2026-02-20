import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import config, { validateEnv } from './config/env.js';
import timerRoutes from './routes/timers.js';
import publicRoutes from './routes/public.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import timerScheduler from './services/timerScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
validateEnv();

const app = express();
const PORT = config.server.port;

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: config.shopify.apiKey,
  apiSecretKey: config.shopify.apiSecret,
  scopes: config.shopify.scopes,
  hostName: config.shopify.appUrl.replace(/https?:\/\//, '') || 'localhost',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

// Trust proxy (required when behind ngrok or other proxies)
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for public API
  credentials: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    scheduler: timerScheduler.getStatus()
  });
});

// API Routes
app.use('/api/timers', timerRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve frontend static files
const frontendDistPath = join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Serve frontend for all non-API routes (React Router)
app.get('*', (req, res, next) => {
  // Don't serve frontend for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(join(frontendDistPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

// Connect to MongoDB
if (config.server.nodeEnv !== 'test') {
  mongoose
    .connect(config.mongodb.uri)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📝 Environment: ${config.server.nodeEnv}`);
        if (config.server.nodeEnv === 'development') {
          console.log(`🔗 API URL: http://localhost:${PORT}`);
        }

        // Start timer status scheduler
        timerScheduler.start();
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use.`);
          console.error('   Please stop the process using this port or change PORT in .env');
          console.error(`   To find the process: netstat -ano | findstr :${PORT}`);
          process.exit(1);
        } else {
          console.error('❌ Server error:', error);
          process.exit(1);
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        timerScheduler.stop();
        server.close(() => {
          console.log('Server closed');
          mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
          });
        });
      });

      process.on('SIGINT', () => {
        console.log('\nSIGINT received, shutting down gracefully...');
        timerScheduler.stop();
        server.close(() => {
          console.log('Server closed');
          mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
          });
        });
      });
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    });
}

export default app;

