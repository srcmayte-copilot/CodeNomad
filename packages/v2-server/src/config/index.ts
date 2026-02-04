/**
 * Server configuration
 */

export interface ServerConfig {
  /** Server port */
  port: number;
  /** Server host */
  host: string;
  /** Database file path */
  dbPath: string;
  /** CORS origins */
  corsOrigins: string[];
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default server configuration
 */
export const defaultConfig: ServerConfig = {
  port: 3100,
  host: '127.0.0.1',
  dbPath: './data/codenomad.db',
  corsOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  logLevel: 'info',
};

/**
 * Load configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : defaultConfig.port,
    host: process.env.HOST || defaultConfig.host,
    dbPath: process.env.DB_PATH || defaultConfig.dbPath,
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : defaultConfig.corsOrigins,
    logLevel: (process.env.LOG_LEVEL as any) || defaultConfig.logLevel,
  };
}
