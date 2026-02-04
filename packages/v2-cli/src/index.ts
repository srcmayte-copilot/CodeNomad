#!/usr/bin/env node

/**
 * CodeNomad v2 CLI
 * 
 * Command-line interface for managing CodeNomad server and workspaces
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from '@codenomad/server';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('codenomad')
  .description('CodeNomad v2 - Agent-agnostic AI workspace platform')
  .version(packageJson.version);

/**
 * Start server command
 */
program
  .command('start')
  .description('Start the CodeNomad server')
  .option('-p, --port <port>', 'Server port', '3100')
  .option('-h, --host <host>', 'Server host', '127.0.0.1')
  .option('--db-path <path>', 'Database file path', './data/codenomad.db')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .action(async (options) => {
    console.log(chalk.blue.bold('🚀 CodeNomad v2 Server\n'));
    
    // Set environment variables from options
    process.env.PORT = options.port;
    process.env.HOST = options.host;
    process.env.DB_PATH = options.dbPath;
    process.env.LOG_LEVEL = options.logLevel;
    
    try {
      await startServer();
    } catch (error: any) {
      console.error(chalk.red('Failed to start server:'), error.message);
      process.exit(1);
    }
  });

/**
 * Info command
 */
program
  .command('info')
  .description('Display CodeNomad version and system information')
  .action(() => {
    console.log(chalk.blue.bold('CodeNomad v2 Information\n'));
    console.log(`${chalk.bold('Version:')} ${packageJson.version}`);
    console.log(`${chalk.bold('Description:')} ${packageJson.description}`);
    console.log(`${chalk.bold('Node.js:')} ${process.version}`);
    console.log(`${chalk.bold('Platform:')} ${process.platform} ${process.arch}`);
  });

program.parse();
