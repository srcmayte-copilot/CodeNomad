/**
 * CodeNomad v2 Server
 * Main entry point
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import type Database from 'better-sqlite3';
import type { AgentAdapter } from '@codenomad/core';
import { loadConfig, type ServerConfig } from './config/index.js';
import { initDatabase, closeDatabase } from './db/index.js';
import { WorkspaceService } from './services/workspace-service.js';
import { SessionService } from './services/session-service.js';
import { registerWorkspaceRoutes } from './api/workspaces.js';
import { registerSessionRoutes } from './api/sessions.js';
import { registerAdapterRoutes } from './api/adapters.js';
import { registerWebSocketHandler } from './api/websocket.js';

export interface ServerOptions {
  config?: Partial<ServerConfig>;
  adapters?: Map<string, AgentAdapter>;
}

export interface ServerInstance {
  fastify: FastifyInstance;
  config: ServerConfig;
  db: Database.Database;
  workspaceService: WorkspaceService;
  sessionService: SessionService;
  adapters: Map<string, AgentAdapter>;
}

/**
 * Create a Fastify server instance
 */
export async function createServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const config = { ...loadConfig(), ...options.config };
  const adapters = options.adapters || new Map();
  
  // Initialize database
  const db = initDatabase(config.dbPath);
  
  // Initialize services
  const workspaceService = new WorkspaceService(db);
  const sessionService = new SessionService(db);
  
  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
    },
  });
  
  // Register CORS
  await fastify.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });
  
  // Register WebSocket support
  await fastify.register(fastifyWebsocket as any);
  
  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });
  
  // Register API routes
  await registerWorkspaceRoutes(fastify, workspaceService);
  await registerSessionRoutes(fastify, sessionService);
  await registerAdapterRoutes(fastify, adapters);
  await registerWebSocketHandler(fastify, sessionService, adapters);
  
  // Cleanup on close
  fastify.addHook('onClose', async () => {
    closeDatabase(db);
  });
  
  return { fastify, config, db, workspaceService, sessionService, adapters };
}

/**
 * Start the server
 */
export async function startServer(options: ServerOptions = {}) {
  const { fastify, config } = await createServer(options);
  
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    });
    
    fastify.log.info(`Server listening on ${config.host}:${config.port}`);
    
    return fastify;
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
