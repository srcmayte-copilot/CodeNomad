# CodeNomad v2 Server

Backend API server for CodeNomad v2 with SQLite database and WebSocket support.

## Features

- **REST API** for workspaces, sessions, and adapters
- **WebSocket** streaming for real-time message delivery
- **SQLite** database for persistent storage
- **Agent-agnostic** architecture via adapter system
- **TypeScript** for type safety

## Installation

```bash
npm install @codenomad/server
```

## Usage

### Start the server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

### Environment Variables

```bash
PORT=3100                  # Server port
HOST=127.0.0.1            # Server host
DB_PATH=./data/codenomad.db  # Database file path
CORS_ORIGINS=http://localhost:3000,http://localhost:5173  # CORS origins
LOG_LEVEL=info            # Log level (debug, info, warn, error)
```

## API Endpoints

### Workspaces

- `GET /api/workspaces` - List all workspaces
- `GET /api/workspaces/:id` - Get workspace by ID
- `POST /api/workspaces` - Create workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Sessions

- `GET /api/sessions?workspacePath=...` - List sessions by workspace
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id/messages` - Get session messages
- `DELETE /api/sessions/:id` - Delete session

### Adapters

- `GET /api/adapters` - List registered adapters
- `GET /api/adapters/:id` - Get adapter by ID

### WebSocket

- `GET /ws` - WebSocket connection for streaming messages

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck
```
