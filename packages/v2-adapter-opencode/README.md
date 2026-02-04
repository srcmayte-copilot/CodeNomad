# @codenomad/adapter-opencode

OpenCode adapter for CodeNomad v2 - Integrate the OpenCode AI coding assistant with CodeNomad.

## Features

✅ **Full Session Management** - Create, list, get, and delete OpenCode sessions  
✅ **Streaming Messages** - Real-time streaming of AI responses and tool calls  
✅ **File Operations** - Browse workspace files and read file contents  
✅ **Tool Execution** - Automatic execution of coding tools through OpenCode  
✅ **Child Sessions** - Support for nested session hierarchies  
✅ **Custom Models** - Configure custom AI models and providers  

## Installation

```bash
npm install @codenomad/adapter-opencode
```

## Prerequisites

You need to have OpenCode installed and running. Install OpenCode:

```bash
npm install -g @opencode-ai/cli
```

Start the OpenCode server:

```bash
opencode serve
```

By default, OpenCode runs on `http://localhost:7777`.

## Usage

### Basic Example

```typescript
import { OpenCodeAdapter } from '@codenomad/adapter-opencode';

// Create adapter instance
const adapter = new OpenCodeAdapter();

// Connect to OpenCode server
await adapter.connect({
  baseUrl: 'http://localhost:7777',
  custom: {
    directory: '/path/to/your/workspace',
  },
});

// Create a session
const session = await adapter.createSession({
  name: 'My Coding Session',
  workspacePath: '/path/to/your/workspace',
});

// Send a message and stream the response
const message = {
  id: 'msg-1',
  sessionId: session.id,
  role: 'user',
  content: 'Create a simple Node.js HTTP server',
  timestamp: new Date(),
};

for await (const chunk of adapter.sendMessage(session.id, message)) {
  if (chunk.type === 'content') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'tool_call') {
    console.log(`\nExecuting tool: ${chunk.toolCall.name}`);
  }
}
```

### With CodeNomad Core

```typescript
import { AdapterRegistry } from '@codenomad/core';
import { OpenCodeAdapter } from '@codenomad/adapter-opencode';

// Register the adapter
const registry = new AdapterRegistry();
registry.register(new OpenCodeAdapter());

// Get and use the adapter
const adapter = registry.get('opencode');
await adapter.connect({
  baseUrl: 'http://localhost:7777',
});
```

### Session Management

```typescript
// List all sessions
const sessions = await adapter.listSessions();
console.log(`Found ${sessions.length} sessions`);

// Get specific session
const session = await adapter.getSession('session-id');
console.log(`Session: ${session.name}`);

// Delete session
await adapter.deleteSession('session-id');
```

### File Operations

```typescript
// Browse files in workspace
const files = await adapter.browseFiles('src');
for (const file of files) {
  console.log(`${file.type}: ${file.path}`);
}

// Read file content
const content = await adapter.readFile('src/index.ts');
console.log(content);
```

### Event Handling

```typescript
// Listen for session updates
adapter.on('session-updated', (data) => {
  console.log('Session updated:', data);
});

// Listen for message updates
adapter.on('message-updated', (data) => {
  console.log('Message updated:', data);
});

// Check connection status
if (adapter.isConnected()) {
  console.log('Connected to OpenCode');
}
```

## Configuration Options

The adapter accepts the following configuration through `AgentConfig`:

```typescript
interface AgentConfig {
  // Base URL for OpenCode server (default: http://localhost:7777)
  baseUrl?: string;
  
  // API key or authentication token (if required)
  apiKey?: string;
  
  // Custom headers for requests
  headers?: Record<string, string>;
  
  // Timeout in milliseconds
  timeout?: number;
  
  // OpenCode-specific options
  custom?: {
    // Workspace directory for OpenCode operations
    directory?: string;
  };
}
```

### Example Configuration

```typescript
await adapter.connect({
  baseUrl: 'http://localhost:7777',
  timeout: 30000,
  headers: {
    'X-Custom-Header': 'value',
  },
  custom: {
    directory: process.cwd(),
  },
});
```

## Capabilities

The OpenCode adapter supports all CodeNomad capabilities:

```typescript
{
  streaming: true,        // Real-time message streaming
  fileOperations: true,   // Browse and read files
  toolCalls: true,        // Execute coding tools
  childSessions: true,    // Nested session hierarchies
  customModels: true,     // Custom AI model configuration
}
```

## Message Format

### Input Message

```typescript
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
}
```

### Streamed Response Chunks

```typescript
interface MessageChunk {
  type: 'content' | 'tool_call' | 'metadata' | 'complete';
  content?: string;           // For 'content' chunks
  toolCall?: ToolCall;        // For 'tool_call' chunks
  metadata?: Record<string, unknown>;  // For 'metadata' chunks
}
```

## Tool Calls

OpenCode automatically executes tools based on the AI's decisions. Tool calls are streamed as they happen:

```typescript
for await (const chunk of adapter.sendMessage(sessionId, message)) {
  if (chunk.type === 'tool_call') {
    const tool = chunk.toolCall;
    console.log(`Tool: ${tool.name}`);
    console.log(`Status: ${tool.status}`);
    console.log(`Args:`, tool.args);
    
    if (tool.result) {
      console.log(`Result:`, tool.result.data);
    }
  }
}
```

## Error Handling

```typescript
try {
  await adapter.connect(config);
} catch (error) {
  console.error('Failed to connect:', error.message);
}

try {
  const session = await adapter.createSession(params);
} catch (error) {
  console.error('Failed to create session:', error.message);
}

// Errors during streaming are sent as metadata chunks
for await (const chunk of adapter.sendMessage(sessionId, message)) {
  if (chunk.type === 'metadata' && chunk.metadata?.error) {
    console.error('Stream error:', chunk.metadata.error);
  }
}
```

## Disconnection

Always disconnect when done:

```typescript
await adapter.disconnect();
```

## TypeScript Support

The adapter is fully typed with TypeScript. All types are exported from `@codenomad/core/types`:

```typescript
import type {
  AgentAdapter,
  AgentCapabilities,
  AgentConfig,
  Session,
  Message,
  MessageChunk,
  ToolCall,
  FileEntry,
} from '@codenomad/core/types';
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck
```

## License

MIT

## Links

- [OpenCode](https://opencode.ai) - Official OpenCode website
- [OpenCode SDK](https://www.npmjs.com/package/@opencode-ai/sdk) - OpenCode TypeScript SDK
- [CodeNomad](https://github.com/yourusername/codenomad) - CodeNomad core
- [Documentation](https://codenomad.dev/docs) - Full documentation

## Support

For issues specific to this adapter, please file an issue on GitHub.

For OpenCode-related questions, visit the [OpenCode documentation](https://opencode.ai/docs).
