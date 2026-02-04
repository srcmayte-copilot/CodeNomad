/**
 * Adapter API routes
 */

import type { FastifyInstance } from 'fastify';
import type { AgentAdapter } from '@codenomad/core';

export async function registerAdapterRoutes(
  fastify: FastifyInstance,
  adapters: Map<string, AgentAdapter>
) {
  // List all adapters
  fastify.get('/api/adapters', async () => {
    const adapterList = Array.from(adapters.values()).map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      version: adapter.version,
      capabilities: adapter.capabilities,
    }));
    
    return { adapters: adapterList };
  });
  
  // Get adapter by ID
  fastify.get<{ Params: { id: string } }>('/api/adapters/:id', async (request, reply) => {
    const adapter = adapters.get(request.params.id);
    
    if (!adapter) {
      return reply.status(404).send({ error: 'Adapter not found' });
    }
    
    return {
      adapter: {
        id: adapter.id,
        name: adapter.name,
        version: adapter.version,
        capabilities: adapter.capabilities,
      }
    };
  });
}
