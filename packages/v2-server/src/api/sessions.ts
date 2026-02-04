/**
 * Session API routes
 */

import type { FastifyInstance } from 'fastify';
import type { SessionService } from '../services/session-service.js';
import { z } from 'zod';

const createSessionSchema = z.object({
  adapterId: z.string().min(1),
  name: z.string().min(1),
  workspacePath: z.string().min(1),
  systemPrompt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function registerSessionRoutes(
  fastify: FastifyInstance,
  sessionService: SessionService
) {
  // List sessions by workspace
  fastify.get<{ Querystring: { workspacePath?: string } }>('/api/sessions', async (request, reply) => {
    const { workspacePath } = request.query;
    
    if (!workspacePath) {
      return reply.status(400).send({ error: 'workspacePath query parameter is required' });
    }
    
    const sessions = sessionService.listByWorkspace(workspacePath);
    return { sessions };
  });
  
  // Get session by ID
  fastify.get<{ Params: { id: string } }>('/api/sessions/:id', async (request, reply) => {
    const session = sessionService.getById(request.params.id);
    
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    
    return { session };
  });
  
  // Create session
  fastify.post<{ Body: unknown }>('/api/sessions', async (request, reply) => {
    const result = createSessionSchema.safeParse(request.body);
    
    if (!result.success) {
      return reply.status(400).send({ 
        error: 'Invalid request body',
        details: result.error.errors 
      });
    }
    
    const { adapterId, ...params } = result.data;
    const session = sessionService.create(adapterId, params);
    
    return reply.status(201).send({ session });
  });
  
  // Get session messages
  fastify.get<{ 
    Params: { id: string };
    Querystring: { limit?: string };
  }>('/api/sessions/:id/messages', async (request, reply) => {
    const session = sessionService.getById(request.params.id);
    
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;
    const messages = sessionService.getMessages(request.params.id, limit);
    
    return { messages };
  });
  
  // Delete session
  fastify.delete<{ Params: { id: string } }>('/api/sessions/:id', async (request, reply) => {
    const session = sessionService.getById(request.params.id);
    
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    
    sessionService.delete(request.params.id);
    return reply.status(204).send();
  });
}
