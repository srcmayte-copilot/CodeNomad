/**
 * Workspace API routes
 */

import type { FastifyInstance } from 'fastify';
import type { WorkspaceService } from '../services/workspace-service.js';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
});

export async function registerWorkspaceRoutes(
  fastify: FastifyInstance,
  workspaceService: WorkspaceService
) {
  // List all workspaces
  fastify.get('/api/workspaces', async () => {
    const workspaces = workspaceService.list();
    return { workspaces };
  });
  
  // Get workspace by ID
  fastify.get<{ Params: { id: string } }>('/api/workspaces/:id', async (request, reply) => {
    const workspace = workspaceService.getById(request.params.id);
    
    if (!workspace) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    
    return { workspace };
  });
  
  // Create workspace
  fastify.post<{ Body: unknown }>('/api/workspaces', async (request, reply) => {
    const result = createWorkspaceSchema.safeParse(request.body);
    
    if (!result.success) {
      return reply.status(400).send({ 
        error: 'Invalid request body',
        details: result.error.errors 
      });
    }
    
    const { name, path } = result.data;
    
    // Check if workspace with this path already exists
    const existing = workspaceService.getByPath(path);
    if (existing) {
      return reply.status(409).send({ error: 'Workspace with this path already exists' });
    }
    
    const workspace = workspaceService.create(name, path);
    return reply.status(201).send({ workspace });
  });
  
  // Delete workspace
  fastify.delete<{ Params: { id: string } }>('/api/workspaces/:id', async (request, reply) => {
    const workspace = workspaceService.getById(request.params.id);
    
    if (!workspace) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    
    workspaceService.delete(request.params.id);
    return reply.status(204).send();
  });
}
