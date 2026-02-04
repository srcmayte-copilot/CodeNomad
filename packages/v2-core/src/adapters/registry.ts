/**
 * Adapter Registry for managing agent adapters
 */

import type { AgentAdapter } from '../types/adapter.js';

/**
 * Registry for managing available agent adapters
 */
export class AdapterRegistry {
  private adapters = new Map<string, AgentAdapter>();
  
  /**
   * Register a new adapter
   */
  register(adapter: AgentAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter with id '${adapter.id}' is already registered`);
    }
    this.adapters.set(adapter.id, adapter);
  }
  
  /**
   * Unregister an adapter
   */
  unregister(adapterId: string): void {
    this.adapters.delete(adapterId);
  }
  
  /**
   * Get an adapter by ID
   */
  get(adapterId: string): AgentAdapter | undefined {
    return this.adapters.get(adapterId);
  }
  
  /**
   * Get all registered adapters
   */
  getAll(): AgentAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  /**
   * Check if an adapter is registered
   */
  has(adapterId: string): boolean {
    return this.adapters.has(adapterId);
  }
  
  /**
   * Clear all adapters
   */
  clear(): void {
    this.adapters.clear();
  }
}

/**
 * Global adapter registry instance
 */
export const adapterRegistry = new AdapterRegistry();
