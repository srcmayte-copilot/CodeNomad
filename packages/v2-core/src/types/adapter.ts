/**
 * Core types for CodeNomad v2 Agent Adapters
 * 
 * This module defines the universal adapter interface that allows
 * CodeNomad to work with any AI coding assistant.
 */

export interface AgentCapabilities {
  /** Supports streaming message responses */
  streaming: boolean;
  /** Supports file operations (browse, read, write) */
  fileOperations: boolean;
  /** Supports tool/function calls */
  toolCalls: boolean;
  /** Supports nested/child sessions */
  childSessions: boolean;
  /** Supports custom model selection */
  customModels: boolean;
}

export interface AgentConfig {
  /** Base URL for API endpoint (if applicable) */
  baseUrl?: string;
  /** API key or authentication token */
  apiKey?: string;
  /** Custom headers for requests */
  headers?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Additional adapter-specific configuration */
  custom?: Record<string, unknown>;
}

export interface Session {
  /** Unique session identifier */
  id: string;
  /** Human-readable session name */
  name: string;
  /** Workspace path this session is associated with */
  workspacePath: string;
  /** Adapter ID that created this session */
  adapterId: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

export interface CreateSessionParams {
  /** Human-readable session name */
  name: string;
  /** Workspace path */
  workspacePath: string;
  /** Initial system prompt (optional) */
  systemPrompt?: string;
  /** Session metadata (optional) */
  metadata?: Record<string, unknown>;
}

export interface Message {
  /** Unique message identifier */
  id: string;
  /** Session this message belongs to */
  sessionId: string;
  /** Message role (user, assistant, system) */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** File attachments */
  attachments?: FileAttachment[];
  /** Tool calls in this message */
  toolCalls?: ToolCall[];
  /** Timestamp */
  timestamp: Date;
  /** Message metadata */
  metadata?: Record<string, unknown>;
}

export interface FileAttachment {
  /** File path relative to workspace */
  path: string;
  /** File content (optional, for small files) */
  content?: string;
  /** File MIME type */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
}

export interface ToolCall {
  /** Unique tool call identifier */
  id: string;
  /** Tool name (e.g., 'bash', 'edit', 'create') */
  name: string;
  /** Tool arguments */
  args: Record<string, unknown>;
  /** Tool result (if completed) */
  result?: ToolResult;
  /** Tool call status */
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ToolResult {
  /** Success or failure */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error message if failed */
  error?: string;
}

export interface MessageChunk {
  /** Type of chunk */
  type: 'content' | 'tool_call' | 'metadata' | 'complete';
  /** Content delta (for content chunks) */
  content?: string;
  /** Tool call data (for tool_call chunks) */
  toolCall?: ToolCall;
  /** Metadata (for metadata chunks) */
  metadata?: Record<string, unknown>;
}

export interface FileEntry {
  /** File/directory name */
  name: string;
  /** Full path */
  path: string;
  /** Type */
  type: 'file' | 'directory';
  /** Size in bytes (files only) */
  size?: number;
  /** Last modified timestamp */
  modified?: Date;
}

/**
 * Base interface that all agent adapters must implement
 */
export interface AgentAdapter {
  /** Unique adapter identifier (e.g., 'opencode', 'claude-desktop') */
  readonly id: string;
  
  /** Human-readable adapter name */
  readonly name: string;
  
  /** Adapter version */
  readonly version: string;
  
  /** Adapter capabilities */
  readonly capabilities: AgentCapabilities;
  
  /**
   * Connect to the agent with the given configuration
   */
  connect(config: AgentConfig): Promise<void>;
  
  /**
   * Disconnect from the agent
   */
  disconnect(): Promise<void>;
  
  /**
   * Create a new session
   */
  createSession(params: CreateSessionParams): Promise<Session>;
  
  /**
   * List all sessions
   */
  listSessions(): Promise<Session[]>;
  
  /**
   * Get a specific session by ID
   */
  getSession(id: string): Promise<Session>;
  
  /**
   * Delete a session
   */
  deleteSession(id: string): Promise<void>;
  
  /**
   * Send a message to a session and receive streaming response
   */
  sendMessage(sessionId: string, message: Message): AsyncIterable<MessageChunk>;
  
  /**
   * Execute a tool call (optional capability)
   */
  executeTool?(tool: ToolCall): Promise<ToolResult>;
  
  /**
   * Browse files in workspace (optional capability)
   */
  browseFiles?(path: string): Promise<FileEntry[]>;
  
  /**
   * Read file content (optional capability)
   */
  readFile?(path: string): Promise<string>;
  
  /**
   * Register event handler
   */
  on(event: 'session-updated' | 'message-updated', handler: (data: unknown) => void): void;
  
  /**
   * Unregister event handler
   */
  off(event: 'session-updated' | 'message-updated', handler: (data: unknown) => void): void;
}
