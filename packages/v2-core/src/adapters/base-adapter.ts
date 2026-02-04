/**
 * Base adapter implementation with common functionality
 */

import type { AgentAdapter, AgentCapabilities, AgentConfig } from '../types/adapter.js';
import { EventEmitter } from 'events';

/**
 * Abstract base class for agent adapters.
 * Provides event handling and common utilities.
 */
export abstract class BaseAdapter extends EventEmitter implements Omit<AgentAdapter, 'sendMessage'> {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly capabilities: AgentCapabilities;
  
  protected config?: AgentConfig;
  protected connected = false;
  
  abstract connect(config: AgentConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract createSession(params: any): Promise<any>;
  abstract listSessions(): Promise<any[]>;
  abstract getSession(id: string): Promise<any>;
  abstract deleteSession(id: string): Promise<void>;
  abstract sendMessage(sessionId: string, message: any): AsyncIterable<any>;
  
  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Ensure adapter is connected before operation
   */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new Error(`Adapter ${this.id} is not connected. Call connect() first.`);
    }
  }
  
  /**
   * Emit a session-updated event
   */
  protected emitSessionUpdated(sessionId: string, data: unknown): void {
    this.emit('session-updated', { sessionId, data });
  }
  
  /**
   * Emit a message-updated event
   */
  protected emitMessageUpdated(messageId: string, data: unknown): void {
    this.emit('message-updated', { messageId, data });
  }
}
