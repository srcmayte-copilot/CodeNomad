# CodeNomad v2 - Quick Start Guide

This guide will help you get started with CodeNomad v2 in minutes.

## Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later
- **Git** (for cloning the repository)

## Installation

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/srcmayte-copilot/CodeNomad.git
cd CodeNomad

# Checkout the v2 branch
git checkout copilot/implement-out-set-requirements

# Install all dependencies
npm install
```

### 2. Start Development Environment

The easiest way to get started is to run both the server and web UI together:

```bash
# Start server and web UI (requires concurrently)
npm run dev:v2
```

Or run them separately in different terminals:

```bash
# Terminal 1: Start the backend server
npm run dev:v2:server

# Terminal 2: Start the web UI
npm run dev:v2:web
```

The server will start on **http://localhost:3100** and the web UI on **http://localhost:5173**.

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

## First Steps

### Creating a Workspace

1. Open http://localhost:5173 in your browser
2. Click "Create New Workspace"
3. Enter a name (e.g., "My Project")
4. Enter the absolute path to your project directory
5. Click "Create"

### Starting a Session

1. Select your workspace from the list
2. Click "New Session"
3. Choose an adapter (e.g., "OpenCode")
4. Give your session a name
5. Click "Create Session"

### Sending Messages

1. Type your message in the input box at the bottom
2. Press Enter or click Send
3. Watch the AI response stream in real-time

## Using with OpenCode

If you have OpenCode running:

### 1. Start OpenCode Server

```bash
# Make sure OpenCode is running on default port 3400
opencode-server start
```

### 2. Configure the Adapter

The OpenCode adapter will automatically connect to `http://localhost:3400`.

To use a different URL, set the environment variable:

```bash
export OPENCODE_BASE_URL=http://localhost:3400
```

### 3. Create a Session

When creating a new session, select "OpenCode" as the adapter. The adapter will:
- Connect to your OpenCode server
- Create a session in OpenCode
- Stream responses back to the CodeNomad UI

## Project Structure

```
CodeNomad/
├── packages/
│   ├── v2-core/              # Core types and adapter interfaces
│   ├── v2-server/            # Backend API server
│   ├── v2-cli/               # Command-line interface
│   ├── v2-web/               # Vue 3 web application
│   └── v2-adapter-opencode/  # OpenCode adapter
├── V2_README.md              # Comprehensive v2 documentation
├── package.json              # Root package with workspace config
└── QUICKSTART.md             # This file
```

## Available Scripts

### Root Level

```bash
# Development
npm run dev:v2              # Start server + web UI together
npm run dev:v2:server       # Start server only
npm run dev:v2:web          # Start web UI only

# Building
npm run build:v2            # Build all v2 packages
npm run typecheck:v2        # Type check all v2 packages
```

### Package Level

```bash
# Core package
cd packages/v2-core
npm run build               # Build
npm test                    # Run tests

# Server package
cd packages/v2-server
npm run dev                 # Development mode
npm run build               # Build
npm start                   # Production mode

# Web package
cd packages/v2-web
npm run dev                 # Development mode (Vite)
npm run build               # Production build
npm run preview             # Preview production build

# CLI package
cd packages/v2-cli
npm run dev                 # Development mode
npm run build               # Build
npm start                   # Run CLI

# OpenCode adapter
cd packages/v2-adapter-opencode
npm run build               # Build
```

## Environment Variables

### Server (.env or process.env)

```bash
# Server configuration
PORT=3100                           # Server port (default: 3100)
HOST=127.0.0.1                      # Server host (default: 127.0.0.1)
DB_PATH=./data/codenomad.db         # Database path
LOG_LEVEL=info                      # Log level: debug, info, warn, error
CORS_ORIGINS=http://localhost:5173  # Comma-separated CORS origins

# OpenCode adapter
OPENCODE_BASE_URL=http://localhost:3400  # OpenCode server URL
```

### Web UI (.env.local in packages/v2-web/)

```bash
VITE_API_BASE_URL=http://localhost:3100  # Backend API URL
VITE_WS_URL=ws://localhost:3100          # WebSocket URL
```

## Troubleshooting

### Port Already in Use

If port 3100 or 5173 is already in use:

```bash
# Change server port
PORT=3200 npm run dev:v2:server

# Vite will automatically try the next available port for the web UI
```

### Database Locked

If you see "database is locked" errors:

```bash
# Stop the server and delete the database
rm -rf data/
# Restart the server (it will create a fresh database)
```

### WebSocket Connection Failed

Make sure:
1. The server is running on port 3100
2. No firewall is blocking WebSocket connections
3. The CORS origins are configured correctly

### OpenCode Connection Failed

Verify:
1. OpenCode server is running: `curl http://localhost:3400/health`
2. The OpenCode base URL is correct
3. Network connectivity between CodeNomad and OpenCode

## Next Steps

- Read [V2_README.md](./V2_README.md) for detailed architecture documentation
- Explore the [API Reference](#) in the server README
- Check out individual package READMEs for more details
- Try creating custom adapters for other AI assistants

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/srcmayte-copilot/CodeNomad/issues)
- **Documentation**: See package READMEs in `packages/v2-*/`
- **Questions**: [GitHub Discussions](https://github.com/srcmayte-copilot/CodeNomad/discussions)

## License

MIT - See [LICENSE](./LICENSE) file for details.

---

**Happy coding with CodeNomad v2!** 🚀
