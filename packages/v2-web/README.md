# CodeNomad v2 Web

Modern Vue 3 web interface for CodeNomad v2.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Next generation frontend tooling
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - Vue state management
- **Vue Router** - Official router for Vue.js
- **@vueuse/core** - Collection of Vue Composition utilities

## Features

- 🚀 Fast development with Vite HMR
- 💪 Full TypeScript support
- 🎨 Tailwind CSS for styling
- 📦 Pinia stores for state management
- 🔌 WebSocket support for real-time messaging
- 📱 Responsive design
- ⚡ Optimized production builds

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── App.vue                 # Root component
├── router/
│   └── index.ts           # Vue Router configuration
├── stores/
│   ├── workspace.ts       # Workspace state management
│   ├── session.ts         # Session state management
│   └── message.ts         # Message state with WebSocket
├── views/
│   ├── WorkspaceSelector.vue  # Workspace selection view
│   └── SessionView.vue        # Chat session view
├── components/
│   ├── MessageList.vue        # Message display component
│   ├── PromptInput.vue        # Message input component
│   └── SessionSidebar.vue     # Session list sidebar
└── styles/
    └── main.css              # Global styles and Tailwind imports
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API base URL (default: http://localhost:3100)
VITE_API_URL=http://localhost:3100
```

### API Endpoints

The application expects the following API endpoints:

- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `POST /api/workspaces/:id/access` - Update workspace access
- `GET /api/sessions` - List all sessions
- `GET /api/workspaces/:id/sessions` - List workspace sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/messages` - Get session messages
- `POST /api/sessions/:id/messages` - Send message
- `WS /api/sessions/:id/stream` - WebSocket for message streaming

### WebSocket Protocol

The WebSocket connection expects messages in the following format:

```typescript
// Streaming events
{ type: 'message_start', messageId: string }
{ type: 'content_delta', delta: string }
{ type: 'message_end', messageId: string }
{ type: 'error', message: string }
```

## Development

### Code Style

- Use Vue 3 Composition API with `<script setup lang="ts">`
- Follow TypeScript best practices
- Use Tailwind CSS utility classes for styling
- Maintain component modularity and reusability

### State Management

The application uses Pinia for state management with three main stores:

1. **Workspace Store** - Manages workspace data and selection
2. **Session Store** - Handles session CRUD operations
3. **Message Store** - Manages messages and WebSocket connections

### Routing

Routes are defined in `src/router/index.ts`:

- `/` - Redirects to `/workspaces`
- `/workspaces` - Workspace selection page
- `/session/:id` - Chat session page

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be served by any static hosting service.

## License

See the main CodeNomad repository for license information.
