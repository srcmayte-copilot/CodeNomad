# CodeNomad v2 MVP - Implementation Guide

This document provides a comprehensive overview of the CodeNomad v2 MVP implementation, which introduces an **agent-agnostic, web-first** architecture with Vue.js 3.

## 🎯 Overview

CodeNomad v2 is a rebuild that transforms CodeNomad from an OpenCode-specific desktop application into a universal platform supporting multiple AI coding assistants through a clean adapter pattern.

### Key Features

- ✅ **Multi-Agent Support**: Work with OpenCode, Claude Desktop, Cursor, GitHub Copilot, and custom agents
- ✅ **Web-First**: Responsive web interface accessible from any browser
- ✅ **Modern Stack**: Vue 3 + TypeScript + Pinia + Tailwind CSS
- ✅ **Real-Time Streaming**: WebSocket-based message streaming
- ✅ **SQLite Database**: Persistent workspace and session storage
- ✅ **Plugin System**: Extensible architecture for custom adapters and tools
- ✅ **Type-Safe**: Full TypeScript coverage across all packages

## 📦 Package Structure

The v2 implementation consists of 4 packages:

```
packages/
├── v2-core/       # Core types, adapter interfaces, utilities
├── v2-server/     # Fastify backend API with SQLite
├── v2-cli/        # Command-line interface
└── v2-web/        # Vue 3 web frontend
```

### Package Details

#### 1. @codenomad/core

Core package providing shared types, adapter interfaces, and utilities.

**Key Exports:**
- `AgentAdapter` - Base adapter interface
- `AdapterRegistry` - Adapter management
- `BaseAdapter` - Abstract adapter base class
- Plugin system types and interfaces
- Logger utility

**Location:** `packages/v2-core/`

#### 2. @codenomad/server

Backend API server built with Fastify and better-sqlite3.

**Features:**
- REST API for workspaces, sessions, adapters
- WebSocket endpoint for streaming messages
- SQLite database with migrations
- Workspace and session management services
- CORS and security middleware

**Location:** `packages/v2-server/`

**Port:** 3100 (default, configurable)

#### 3. @codenomad/cli

Command-line interface for managing the server.

**Commands:**
- `codenomad start` - Start the server
- `codenomad info` - Display version information

**Location:** `packages/v2-cli/`

#### 4. @codenomad/web

Vue 3 web application with Tailwind CSS.

**Features:**
- Workspace selector
- Session management
- Real-time message streaming
- Responsive design
- WebSocket client integration

**Location:** `packages/v2-web/`

**Port:** 5173 (Vite dev server default)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm 10+

### Installation

```bash
# From repository root
npm install
```

### Development

```bash
# Start both server and web UI (recommended)
npm run dev:v2

# Or start them separately:

# Terminal 1: Start server
npm run dev:v2:server

# Terminal 2: Start web UI
npm run dev:v2:web
```

Then open http://localhost:5173 in your browser.

### Production Build

```bash
# Build all v2 packages
npm run build:v2

# Or build individually
cd packages/v2-core && npm run build
cd packages/v2-server && npm run build
cd packages/v2-cli && npm run build
cd packages/v2-web && npm run build
```

### Running in Production

```bash
# Option 1: Using CLI
npm install -g @codenomad/cli
codenomad start --port 3100

# Option 2: Using server directly
cd packages/v2-server
npm start

# Option 3: Using Docker (coming soon)
docker-compose up
```

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│         Vue 3 Web UI (v2-web)              │
│  Components, Views, Pinia Stores, Router   │
└──────────────────┬──────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────┴──────────────────────────┐
│      Fastify Server (v2-server)            │
│  REST API, WebSocket, Services, SQLite     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│        Adapter Layer (v2-core)             │
│  ┌──────────┬──────────┬──────────────┐   │
│  │ OpenCode │  Claude  │    Custom    │   │
│  │ Adapter  │ Adapter  │   Adapter    │   │
│  └──────────┴──────────┴──────────────┘   │
└────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → Vue component → Pinia store
2. **API Call** → Fastify route → Service layer → SQLite
3. **Streaming** → WebSocket → Adapter → AsyncIterator → Client
4. **State Update** → Pinia store → Vue reactivity → UI update

## 🔌 Adapter System

The adapter system allows CodeNomad to work with any AI coding assistant.

### Creating a Custom Adapter

```typescript
import { BaseAdapter } from '@codenomad/core';
import type { 
  AgentCapabilities, 
  AgentConfig, 
  Session,
  CreateSessionParams,
  Message,
  MessageChunk 
} from '@codenomad/core';

export class MyCustomAdapter extends BaseAdapter {
  readonly id = 'my-adapter';
  readonly name = 'My Custom Adapter';
  readonly version = '1.0.0';
  readonly capabilities: AgentCapabilities = {
    streaming: true,
    fileOperations: true,
    toolCalls: true,
    childSessions: false,
    customModels: false,
  };

  async connect(config: AgentConfig): Promise<void> {
    // Initialize connection to your AI service
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    // Cleanup
    this.connected = false;
  }

  async createSession(params: CreateSessionParams): Promise<Session> {
    // Create a new session
  }

  async listSessions(): Promise<Session[]> {
    // List sessions
  }

  async getSession(id: string): Promise<Session> {
    // Get session by ID
  }

  async deleteSession(id: string): Promise<void> {
    // Delete session
  }

  async *sendMessage(sessionId: string, message: Message): AsyncIterable<MessageChunk> {
    // Stream message chunks
    yield { type: 'content', content: 'Hello' };
    yield { type: 'complete' };
  }
}
```

### Registering an Adapter

```typescript
import { adapterRegistry } from '@codenomad/server';
import { MyCustomAdapter } from './my-adapter';

// Register the adapter
adapterRegistry.register(new MyCustomAdapter());

// The adapter is now available via /api/adapters
```

## 🧪 Testing

```bash
# Run tests for all v2 packages
npm run test --workspace @codenomad/core
npm run test --workspace @codenomad/server

# With coverage
npm run test:coverage --workspace @codenomad/core
```

## 📝 API Reference

### REST Endpoints

#### Workspaces

- `GET /api/workspaces` - List all workspaces
- `GET /api/workspaces/:id` - Get workspace by ID
- `POST /api/workspaces` - Create workspace
  ```json
  {
    "name": "My Project",
    "path": "/path/to/project"
  }
  ```
- `DELETE /api/workspaces/:id` - Delete workspace

#### Sessions

- `GET /api/sessions?workspacePath=/path` - List sessions by workspace
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create session
  ```json
  {
    "name": "New Session",
    "workspacePath": "/path/to/project",
    "adapterId": "opencode",
    "systemPrompt": "You are a helpful assistant"
  }
  ```
- `GET /api/sessions/:id/messages` - Get session messages
- `DELETE /api/sessions/:id` - Delete session

#### Adapters

- `GET /api/adapters` - List registered adapters
- `GET /api/adapters/:id` - Get adapter details

### WebSocket

Connect to `ws://localhost:3100/ws` for real-time streaming.

**Send message:**
```json
{
  "type": "send_message",
  "payload": {
    "sessionId": "session-id",
    "content": "Hello, how can I help?",
    "attachments": []
  }
}
```

**Receive chunks:**
```json
{
  "type": "chunk",
  "chunk": {
    "type": "content",
    "content": "Hello! I'm here to help."
  }
}
```

## 🔒 Security Considerations

- CORS configured for localhost by default
- Database uses parameterized queries (SQL injection protection)
- WebSocket connections require valid session IDs
- Rate limiting should be added for production (use `@fastify/rate-limit`)

## 🚦 Roadmap

### v2.0.0-alpha (Current)
- [x] Core types and adapter interface
- [x] Server with REST API and WebSocket
- [x] CLI for server management
- [x] Vue 3 web UI with basic features

### v2.0.0-beta (Next 2 weeks)
- [ ] OpenCode adapter implementation
- [ ] Claude adapter implementation
- [ ] Enhanced error handling
- [ ] Loading states and UI polish
- [ ] E2E tests with Playwright

### v2.0.0 (Release - 4 weeks)
- [ ] Production-ready features
- [ ] Complete documentation
- [ ] Docker deployment
- [ ] Plugin marketplace foundation

### v2.1.0+ (Future)
- [ ] Electron desktop wrapper
- [ ] PostgreSQL migration option
- [ ] Advanced plugin system
- [ ] Multi-user support

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: See individual package READMEs
- **Questions**: GitHub Discussions

---

Built with ❤️ by the CodeNomad team
