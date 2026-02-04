/**
 * Plugin system types for CodeNomad v2
 */

import type { AgentAdapter } from './adapter.js';

export interface PluginManifest {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin author */
  author: string;
  /** Plugin description */
  description?: string;
  
  /** What this plugin provides */
  provides?: {
    /** Agent adapters */
    adapters?: string[];
    /** Tool renderers */
    toolRenderers?: string[];
    /** Commands */
    commands?: string[];
    /** Themes */
    themes?: string[];
  };
  
  /** Plugin dependencies */
  dependencies?: Record<string, string>;
  
  /** Entry point file */
  main: string;
}

export interface ToolRenderer {
  /** Tool type this renderer handles (e.g., 'bash', 'edit') */
  type: string;
  /** Render function that returns renderable content */
  render: (data: unknown) => unknown;
}

export interface Command {
  /** Unique command identifier */
  id: string;
  /** Command name (displayed to user) */
  name: string;
  /** Command description */
  description?: string;
  /** Command execution function */
  execute: (...args: unknown[]) => Promise<void> | void;
}

export interface PluginContext {
  /** Workspace API */
  workspace: WorkspaceAPI;
  /** Session API */
  sessions: SessionAPI;
  /** UI Extension API */
  ui: UIExtensionAPI;
  /** Storage API */
  storage: StorageAPI;
  /** Logger */
  logger: Logger;
  /** Configuration API */
  config: ConfigAPI;
  
  /** Register an adapter */
  registerAdapter(adapter: AgentAdapter): void;
  /** Register a tool renderer */
  registerToolRenderer(renderer: ToolRenderer): void;
  /** Register a command */
  registerCommand(command: Command): void;
}

export interface WorkspaceAPI {
  /** Get current workspace path */
  getCurrentPath(): string | null;
  /** Set workspace path */
  setWorkspacePath(path: string): Promise<void>;
  /** List workspace files */
  listFiles(pattern?: string): Promise<string[]>;
}

export interface SessionAPI {
  /** Get active session ID */
  getActiveSessionId(): string | null;
  /** Set active session */
  setActiveSession(id: string): void;
  /** List all sessions */
  listSessions(): Promise<unknown[]>;
}

export interface UIExtensionAPI {
  /** Show notification */
  showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  /** Show modal dialog */
  showModal(content: unknown): Promise<unknown>;
}

export interface StorageAPI {
  /** Get stored value */
  get<T>(key: string): Promise<T | null>;
  /** Set stored value */
  set<T>(key: string, value: T): Promise<void>;
  /** Delete stored value */
  delete(key: string): Promise<void>;
}

export interface Logger {
  /** Log debug message */
  debug(message: string, ...args: unknown[]): void;
  /** Log info message */
  info(message: string, ...args: unknown[]): void;
  /** Log warning */
  warn(message: string, ...args: unknown[]): void;
  /** Log error */
  error(message: string, ...args: unknown[]): void;
}

export interface ConfigAPI {
  /** Get configuration value */
  get<T>(key: string): T | undefined;
  /** Set configuration value */
  set<T>(key: string, value: T): void;
}

/**
 * Plugin class that can be extended
 */
export abstract class Plugin {
  /** Plugin manifest */
  abstract manifest: PluginManifest;
  
  /** Activate plugin */
  abstract activate(context: PluginContext): void | Promise<void>;
  
  /** Deactivate plugin */
  deactivate?(): void | Promise<void>;
}
