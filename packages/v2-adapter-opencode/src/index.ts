/**
 * OpenCode Adapter for CodeNomad v2
 * 
 * Integrates OpenCode AI coding assistant with CodeNomad
 */

import { BaseAdapter } from '@codenomad/core';
import type {
  AgentCapabilities,
  AgentConfig,
  CreateSessionParams,
  Session,
  Message,
  MessageChunk,
  ToolCall,
  ToolResult,
  FileEntry,
} from '@codenomad/core';
import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk';
import type {
  Session as OpencodeSession,
  Message as OpencodeMessage,
  Part,
  TextPartInput,
  Event,
} from '@opencode-ai/sdk';

/**
 * OpenCode adapter implementation
 */
export class OpenCodeAdapter extends BaseAdapter {
  readonly id = 'opencode';
  readonly name = 'OpenCode';
  readonly version = '2.0.0';
  readonly capabilities: AgentCapabilities = {
    streaming: true,
    fileOperations: true,
    toolCalls: true,
    childSessions: true,
    customModels: true,
  };

  private client?: OpencodeClient;
  private workspaceDir?: string;

  /**
   * Connect to OpenCode server
   */
  async connect(config: AgentConfig): Promise<void> {
    try {
      this.config = config;
      this.workspaceDir = config.custom?.directory as string | undefined;

      // Create OpenCode client
      this.client = createOpencodeClient({
        baseUrl: config.baseUrl,
        headers: config.headers,
        directory: this.workspaceDir,
      });

      // Verify connection by fetching project info
      await this.client.project.current();

      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to OpenCode: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from OpenCode server
   */
  async disconnect(): Promise<void> {
    this.client = undefined;
    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * Create a new session
   */
  async createSession(params: CreateSessionParams): Promise<Session> {
    this.ensureConnected();

    const response = await this.client!.session.create({
      body: {
        title: params.name,
      },
      query: {
        directory: params.workspacePath,
      },
    });

    if (!response.data) {
      throw new Error('Failed to create session: No data returned');
    }

    return this.convertSession(response.data, params.workspacePath);
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Session[]> {
    this.ensureConnected();

    const response = await this.client!.session.list({
      query: {
        directory: this.workspaceDir,
      },
    });

    if (!response.data) {
      return [];
    }

    return response.data.map(s => this.convertSession(s, this.workspaceDir || s.directory));
  }

  /**
   * Get a specific session by ID
   */
  async getSession(id: string): Promise<Session> {
    this.ensureConnected();

    const response = await this.client!.session.get({
      path: { id },
      query: {
        directory: this.workspaceDir,
      },
    });

    if (!response.data) {
      throw new Error(`Session ${id} not found`);
    }

    return this.convertSession(response.data, this.workspaceDir || response.data.directory);
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    this.ensureConnected();

    await this.client!.session.delete({
      path: { id },
      query: {
        directory: this.workspaceDir,
      },
    });
  }

  /**
   * Send a message to a session and receive streaming response
   */
  async *sendMessage(sessionId: string, message: Message): AsyncIterable<MessageChunk> {
    this.ensureConnected();

    // Convert message to OpenCode format
    const parts: TextPartInput[] = [
      {
        type: 'text',
        text: message.content,
      },
    ];

    // Start the message using promptAsync to avoid blocking
    await this.client!.session.promptAsync({
      path: { id: sessionId },
      body: {
        parts,
        system: message.role === 'system' ? message.content : undefined,
      },
    });

    // Subscribe to events to stream the response
    const eventStream = await this.client!.global.event();

    if (!eventStream?.stream) {
      return;
    }

    let assistantMessageId: string | undefined;

    for await (const event of eventStream.stream) {
      const payload = event.payload as Event;

      // Filter events for this session
      if ('properties' in payload) {
        const props = payload.properties as any;

        // Track message updates
        if (payload.type === 'message.updated' && props.info?.sessionID === sessionId) {
          const msg = props.info as OpencodeMessage;
          if (msg.role === 'assistant' && !assistantMessageId) {
            assistantMessageId = msg.id;
          }
        }

        // Stream message parts
        if (payload.type === 'message.part.updated' && props.part) {
          const part = props.part as Part;

          // Only stream parts for our assistant message
          if (part.sessionID === sessionId && part.messageID === assistantMessageId) {
            if (part.type === 'text') {
              yield {
                type: 'content',
                content: props.delta || part.text,
              };
            } else if (part.type === 'tool') {
              const toolState = part.state;
              const toolName = part.tool;
              const callId = part.callID;

              // Convert tool state to ToolCall
              const toolCall: ToolCall = {
                id: callId,
                name: toolName,
                args: toolState.input,
                status: toolState.status === 'pending' ? 'pending' :
                        toolState.status === 'running' ? 'running' :
                        toolState.status === 'completed' ? 'completed' : 'failed',
                result: toolState.status === 'completed' ? {
                  success: true,
                  data: toolState.output,
                } : toolState.status === 'error' ? {
                  success: false,
                  error: toolState.error,
                } : undefined,
              };

              yield {
                type: 'tool_call',
                toolCall,
              };
            }
          }
        }

        // Check for completion
        if (payload.type === 'message.updated' && props.info?.id === assistantMessageId) {
          const msg = props.info as OpencodeMessage;
          if (msg.role === 'assistant' && msg.time.completed) {
            yield {
              type: 'complete',
            };
            break;
          }
        }

        // Handle errors
        if (payload.type === 'session.error' && props.sessionID === sessionId) {
          const error = props.error as any;
          yield {
            type: 'metadata',
            metadata: {
              error: error?.data?.message || 'Unknown error',
            },
          };
          break;
        }
      }
    }
  }

  /**
   * Execute a tool call (optional capability)
   */
  async executeTool(_tool: ToolCall): Promise<ToolResult> {
    this.ensureConnected();

    // OpenCode handles tool execution internally through the session
    // This method is not typically called directly
    throw new Error('Tool execution is handled internally by OpenCode');
  }

  /**
   * Browse files in workspace (optional capability)
   */
  async browseFiles(path: string): Promise<FileEntry[]> {
    this.ensureConnected();

    const response = await this.client!.file.list({
      query: {
        directory: this.workspaceDir,
        path,
      },
    });

    if (!response.data) {
      return [];
    }

    return response.data.map(file => ({
      name: file.name,
      path: file.path,
      type: file.type === 'file' ? 'file' : 'directory',
    }));
  }

  /**
   * Read file content (optional capability)
   */
  async readFile(path: string): Promise<string> {
    this.ensureConnected();

    const response = await this.client!.file.read({
      query: {
        directory: this.workspaceDir,
        path,
      },
    });

    if (!response.data || response.data.type !== 'text') {
      throw new Error(`Failed to read file: ${path}`);
    }

    return response.data.content;
  }

  /**
   * Convert OpenCode session to CodeNomad session
   */
  private convertSession(opencodeSession: OpencodeSession, workspacePath: string): Session {
    return {
      id: opencodeSession.id,
      name: opencodeSession.title,
      workspacePath,
      adapterId: this.id,
      createdAt: new Date(opencodeSession.time.created),
      updatedAt: new Date(opencodeSession.time.updated),
      metadata: {
        projectId: opencodeSession.projectID,
        directory: opencodeSession.directory,
        parentId: opencodeSession.parentID,
        summary: opencodeSession.summary,
        share: opencodeSession.share,
        version: opencodeSession.version,
      },
    };
  }
}

export default OpenCodeAdapter;
