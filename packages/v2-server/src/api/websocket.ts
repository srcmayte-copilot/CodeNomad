/**
 * WebSocket handler for streaming messages
 */

import type { FastifyInstance } from 'fastify';
import type { SessionService } from '../services/session-service.js';
import type { AgentAdapter, Message } from '@codenomad/core';
import { randomUUID } from 'crypto';

interface SendMessagePayload {
  sessionId: string;
  content: string;
  attachments?: any[];
}

export async function registerWebSocketHandler(
  fastify: FastifyInstance,
  sessionService: SessionService,
  adapters: Map<string, AgentAdapter>
) {
  fastify.register(async (fastify) => {
    fastify.get('/ws', { websocket: true } as any, (connection: any) => {
      connection.socket.on('message', async (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'send_message') {
            await handleSendMessage(
              connection.socket,
              message.payload as SendMessagePayload,
              sessionService,
              adapters
            );
          }
        } catch (error) {
          connection.socket.send(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
    });
  });
}

async function handleSendMessage(
  socket: any,
  payload: SendMessagePayload,
  sessionService: SessionService,
  adapters: Map<string, AgentAdapter>
) {
  const { sessionId, content, attachments } = payload;
  
  // Get session
  const session = sessionService.getById(sessionId);
  if (!session) {
    socket.send(JSON.stringify({
      type: 'error',
      error: 'Session not found'
    }));
    return;
  }
  
  // Get adapter
  const adapter = adapters.get(session.adapterId);
  if (!adapter) {
    socket.send(JSON.stringify({
      type: 'error',
      error: 'Adapter not found'
    }));
    return;
  }
  
  // Create user message
  const userMessage: Message = {
    id: randomUUID(),
    sessionId,
    role: 'user',
    content,
    attachments,
    timestamp: new Date(),
  };
  
  // Save user message
  sessionService.saveMessage(userMessage);
  
  // Send user message confirmation
  socket.send(JSON.stringify({
    type: 'message_saved',
    message: userMessage
  }));
  
  // Stream assistant response
  try {
    let assistantContent = '';
    const toolCalls: any[] = [];
    
    for await (const chunk of adapter.sendMessage(sessionId, userMessage)) {
      // Send chunk to client
      socket.send(JSON.stringify({
        type: 'chunk',
        chunk
      }));
      
      // Accumulate content
      if (chunk.type === 'content' && chunk.content) {
        assistantContent += chunk.content;
      }
      
      // Accumulate tool calls
      if (chunk.type === 'tool_call' && chunk.toolCall) {
        toolCalls.push(chunk.toolCall);
      }
      
      // Handle completion
      if (chunk.type === 'complete') {
        const assistantMessage: Message = {
          id: randomUUID(),
          sessionId,
          role: 'assistant',
          content: assistantContent,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          timestamp: new Date(),
        };
        
        // Save assistant message
        sessionService.saveMessage(assistantMessage);
        
        // Send completion
        socket.send(JSON.stringify({
          type: 'complete',
          message: assistantMessage
        }));
      }
    }
  } catch (error) {
    socket.send(JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to stream message'
    }));
  }
}
