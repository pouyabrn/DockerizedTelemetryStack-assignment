import express from 'express';
import cors from 'cors';
import logger from './logger.js';
import { initDatabase, closeDatabase } from './database.js';
import { startTelemetryReceiver, stopTelemetryReceiver } from './telemetry-receiver.js';
import apiRouter from './api.js';

const app = express();
const API_PORT = process.env.API_PORT || 3000;
const TELEMETRY_PORT = process.env.TELEMETRY_PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Graceful shutdown handler
async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    await stopTelemetryReceiver();
    await closeDatabase();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
async function start() {
  try {
    // Initialize database
    await initDatabase();
    
    // Start telemetry receiver on TCP port
    startTelemetryReceiver(TELEMETRY_PORT);
    
    // Start HTTP API server
    app.listen(API_PORT, () => {
      logger.info(`API server running on port ${API_PORT}`);
      logger.info(`Visit http://localhost:${API_PORT}`);
    });
    
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

