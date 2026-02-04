/**
 * Workspace service for managing workspaces
 */

import type Database from 'better-sqlite3';
import type { Workspace } from '@codenomad/core';
import { randomUUID } from 'crypto';

export class WorkspaceService {
  constructor(private db: Database.Database) {}
  
  create(name: string, path: string): Workspace {
    const workspace: Workspace = {
      id: randomUUID(),
      name,
      path,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };
    
    const stmt = this.db.prepare(`
      INSERT INTO workspaces (id, name, path, created_at, last_accessed_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      workspace.id,
      workspace.name,
      workspace.path,
      workspace.createdAt.getTime(),
      workspace.lastAccessedAt.getTime(),
      null
    );
    
    return workspace;
  }
  
  getById(id: string): Workspace | null {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return this.rowToWorkspace(row);
  }
  
  getByPath(path: string): Workspace | null {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE path = ?');
    const row = stmt.get(path) as any;
    
    if (!row) return null;
    
    return this.rowToWorkspace(row);
  }
  
  list(): Workspace[] {
    const stmt = this.db.prepare('SELECT * FROM workspaces ORDER BY last_accessed_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.rowToWorkspace(row));
  }
  
  updateLastAccessed(id: string): void {
    const stmt = this.db.prepare('UPDATE workspaces SET last_accessed_at = ? WHERE id = ?');
    stmt.run(Date.now(), id);
  }
  
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM workspaces WHERE id = ?');
    stmt.run(id);
  }
  
  private rowToWorkspace(row: any): Workspace {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      createdAt: new Date(row.created_at),
      lastAccessedAt: new Date(row.last_accessed_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
