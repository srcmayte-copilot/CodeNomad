/**
 * Workspace types for CodeNomad v2
 */

export interface Workspace {
  /** Unique workspace identifier */
  id: string;
  /** Workspace name */
  name: string;
  /** Absolute path to workspace directory */
  path: string;
  /** Workspace creation timestamp */
  createdAt: Date;
  /** Last accessed timestamp */
  lastAccessedAt: Date;
  /** Workspace metadata */
  metadata?: Record<string, unknown>;
}

export interface WorkspaceConfig {
  /** Default adapter to use */
  defaultAdapter?: string;
  /** Workspace-specific settings */
  settings?: Record<string, unknown>;
}
