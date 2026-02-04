# CodeNomad v2 Core

Core package for CodeNomad v2, providing:

- Agent adapter interfaces and base classes
- Type definitions for sessions, messages, workspaces
- Plugin system interfaces
- Adapter registry
- Logging utilities

## Installation

```bash
npm install @codenomad/core
```

## Usage

```typescript
import { AgentAdapter, AdapterRegistry, createLogger } from '@codenomad/core';

// Create a custom adapter
class MyAdapter implements AgentAdapter {
  readonly id = 'my-adapter';
  readonly name = 'My Custom Adapter';
  readonly version = '1.0.0';
  readonly capabilities = {
    streaming: true,
    fileOperations: false,
    toolCalls: true,
    childSessions: false,
    customModels: false,
  };
  
  // Implement required methods...
}

// Register the adapter
const registry = new AdapterRegistry();
registry.register(new MyAdapter());
```

## API Documentation

See the TypeScript types for full API documentation.
