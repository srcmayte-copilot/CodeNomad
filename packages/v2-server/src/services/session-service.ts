/**
 * Session service for managing AI sessions and messages
 */

import type Database from 'better-sqlite3';
import type { Session, Message, CreateSessionParams } from '@codenomad/core';
import { randomUUID } from 'crypto';

export class SessionService {
  constructor(private db: Database.Database) {}
  
  create(adapterId: string, params: CreateSessionParams): Session {
    const session: Session = {
      id: randomUUID(),
      name: params.name,
      workspacePath: params.workspacePath,
      adapterId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata,
    };
    
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, name, workspace_path, adapter_id, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      session.id,
      session.name,
      session.workspacePath,
      session.adapterId,
      session.createdAt.getTime(),
      session.updatedAt.getTime(),
      session.metadata ? JSON.stringify(session.metadata) : null
    );
    
    return session;
  }
  
  getById(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return this.rowToSession(row);
  }
  
  listByWorkspace(workspacePath: string): Session[] {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE workspace_path = ? ORDER BY updated_at DESC');
    const rows = stmt.all(workspacePath) as any[];
    
    return rows.map(row => this.rowToSession(row));
  }
  
  listByAdapter(adapterId: string): Session[] {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE adapter_id = ? ORDER BY updated_at DESC');
    const rows = stmt.all(adapterId) as any[];
    
    return rows.map(row => this.rowToSession(row));
  }
  
  update(id: string, updates: Partial<Pick<Session, 'name' | 'metadata'>>): Session | null {
    const session = this.getById(id);
    if (!session) return null;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }
    
    fields.push('updated_at = ?');
    values.push(Date.now());
    
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.getById(id);
  }
  
  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }
  
  saveMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, role, content, attachments, tool_calls, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      message.id,
      message.sessionId,
      message.role,
      message.content,
      message.attachments ? JSON.stringify(message.attachments) : null,
      message.toolCalls ? JSON.stringify(message.toolCalls) : null,
      message.timestamp.getTime(),
      message.metadata ? JSON.stringify(message.metadata) : null
    );
    
    // Update session's updated_at timestamp
    const updateStmt = this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?');
    updateStmt.run(message.timestamp.getTime(), message.sessionId);
  }
  
  getMessages(sessionId: string, limit: number = 100): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC 
      LIMIT ?
    `);
    const rows = stmt.all(sessionId, limit) as any[];
    
    return rows.map(row => this.rowToMessage(row));
  }
  
  private rowToSession(row: any): Session {
    return {
      id: row.id,
      name: row.name,
      workspacePath: row.workspace_path,
      adapterId: row.adapter_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
  
  private rowToMessage(row: any): Message {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      toolCalls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
