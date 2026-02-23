import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import logger from './config/logger.js';
import config, { validateEnv } from './config/env.js';
import routes from './api/routes.js';
import configRoutes from './api/configRoutes.js';
import { setupSocketHandlers } from './socket/handlers.js';
import configStore from './config/ConfigStore.js';
import promptManager from './prompts/PromptManager.js';
import providerFactory from './providers/ProviderFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  logger.error('Environment validation failed', error);
  process.exit(1);
}

// Ensure required directories exist
const logsDir = path.resolve(__dirname, '../logs');
const dataDir = path.resolve(__dirname, '../data');
const agentsDir = path.join(dataDir, 'agents');
const knowledgeDir = path.join(dataDir, 'knowledge');

[logsDir, dataDir, agentsDir, knowledgeDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5555', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// API Routes
app.use('/api', routes);
app.use('/api/config', configRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Initialize configuration system
async function initializeServer() {
  try {
    // Load configuration
    await configStore.loadConfig();
    logger.info('Configuration loaded');

    // Load all prompts
    await promptManager.loadAll();
    logger.info('Prompts loaded');

    // Set up initial provider
    const providerConfig = configStore.getCurrentProvider();
    providerFactory.setCurrentProvider(providerConfig.type, providerConfig);
    logger.info('Provider initialized', { type: providerConfig.type });
  } catch (error) {
    logger.error('Failed to initialize server', { error: error.message });
  }
}

// Start server
const PORT = config.port;
httpServer.listen(PORT, async () => {
  logger.info(`🌴 Adventureland Chief of Staff server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Data directory: ${dataDir}`);

  // Initialize configuration system
  await initializeServer();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, io };
