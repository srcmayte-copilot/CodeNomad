# CodeNomad Rebuild Alternative: Agent-Agnostic Platform

**Version**: 1.0  
**Date**: February 4, 2026  
**Status**: Alternative Architecture Proposal  
**Target Audience**: Software Engineers & Technical Decision Makers

---

## Executive Summary

This document explores an **alternative approach** to productionizing CodeNomad: rebuilding it from scratch as a fully **agent-agnostic, test-driven, pluggable platform** with a modern frontend framework (React or Vue.js).

### Key Differences from Incremental Plan

| Aspect | Incremental (brainstorm.md) | Rebuild (This Document) |
|--------|----------------------------|-------------------------|
| **Timeline** | 17 weeks to v1.0 | 26-32 weeks to v1.0 |
| **Risk** | Low (iterative improvements) | High (complete rewrite) |
| **Architecture** | Preserve existing (SolidJS) | New (React/Vue.js) |
| **Agent Support** | OpenCode-focused | Agent-agnostic (OpenCode, Claude Desktop, Cursor, custom) |
| **Testing** | Add tests to existing code | TDD from day one |
| **Extensibility** | Limited plugin support | Full plugin architecture |
| **Investment** | ~$50K-75K (3 months) | ~$150K-200K (6-8 months) |

### Recommendation Summary

**When to Choose Rebuild**:
- ✅ You need agent-agnostic architecture from the start
- ✅ You can afford 6-8 months without new features
- ✅ You have budget for $150K-200K investment
- ✅ Current UX needs major overhaul
- ✅ Plugin ecosystem is critical to business model

**When to Choose Incremental**:
- ✅ You need production-ready app in 3-4 months
- ✅ Current architecture meets your needs
- ✅ Limited budget ($50K-75K)
- ✅ Users are happy with current UX
- ✅ OpenCode-first focus is acceptable

---

## 1. Vision: Agent-Agnostic AI Workspace Platform

### 1.1 What We're Building

**CodeNomad 2.0**: A universal, pluggable workspace for **any AI coding assistant**, not just OpenCode.

**Core Concept**:
```
Traditional (Current):
  CodeNomad → OpenCode Only

New Vision:
  CodeNomad → Adapter Layer → [OpenCode | Claude Desktop | Cursor | GitHub Copilot | Custom Agents]
```

**Key Differentiators**:
1. **Agent Agnostic**: Swap between AI providers seamlessly
2. **Plugin Architecture**: Extend with custom tools, renderers, workflows
3. **Test-First**: 80%+ coverage from day one
4. **Modern Stack**: React/Vue.js ecosystem benefits
5. **Cloud-Native**: Built for SaaS from the ground up

### 1.2 Target Use Cases

**Primary**:
- Developers who use multiple AI assistants (OpenCode for work, Claude for personal)
- Teams wanting unified workspace across different AI providers
- Organizations building custom AI agent workflows

**Secondary**:
- Enterprise teams needing on-premise deployment with custom models
- Consultants/agencies managing multiple client AI configurations
- Researchers comparing AI assistant performance

---

## 2. Technical Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vue.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Universal UI Components                             │  │
│  │  - Session Manager  - Message Renderer               │  │
│  │  - Tool Call Views  - File Browser                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  State Management (Zustand/Pinia)                    │  │
│  │  - Normalized stores  - Optimistic updates           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────┴────────────────────────────────────┐
│                    Backend API (Node.js/TypeScript)         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Adapter Layer (Plugin System)                       │  │
│  │  ┌─────────────┬─────────────┬─────────────────┐    │  │
│  │  │ OpenCode    │ Claude      │ Custom Agent    │    │  │
│  │  │ Adapter     │ Desktop     │ Adapter         │    │  │
│  │  │             │ Adapter     │                 │    │  │
│  │  └─────────────┴─────────────┴─────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Core Services                                       │  │
│  │  - Workspace Manager  - Message Broker              │  │
│  │  - Session Store      - File System API             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Storage Layer                            │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ PostgreSQL   │ Redis        │ S3/MinIO             │    │
│  │ (metadata)   │ (sessions)   │ (files/artifacts)    │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Agent Adapter Interface

**Goal**: Abstract away differences between AI providers

```typescript
// packages/core/src/adapters/base-adapter.ts

interface AgentAdapter {
  // Metadata
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: AgentCapabilities;
  
  // Lifecycle
  connect(config: AgentConfig): Promise<void>;
  disconnect(): Promise<void>;
  
  // Session Management
  createSession(params: CreateSessionParams): Promise<Session>;
  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  
  // Messaging
  sendMessage(sessionId: string, message: Message): AsyncIterable<MessageChunk>;
  
  // Tool Calls (optional)
  executeTool?(tool: ToolCall): Promise<ToolResult>;
  
  // File Operations (optional)
  browseFiles?(path: string): Promise<FileEntry[]>;
  readFile?(path: string): Promise<string>;
  
  // Events
  on(event: 'session-updated' | 'message-updated', handler: Function): void;
}

interface AgentCapabilities {
  streaming: boolean;
  fileOperations: boolean;
  toolCalls: boolean;
  childSessions: boolean;
  customModels: boolean;
}
```

**Example Implementations**:

```typescript
// OpenCode Adapter (leverages existing SDK)
class OpenCodeAdapter implements AgentAdapter {
  id = 'opencode';
  name = 'OpenCode';
  capabilities = {
    streaming: true,
    fileOperations: true,
    toolCalls: true,
    childSessions: true,
    customModels: true,
  };
  
  async connect(config: AgentConfig) {
    this.client = new OpenCodeClient(config.baseUrl);
  }
  
  async *sendMessage(sessionId: string, message: Message) {
    for await (const chunk of this.client.session.sendMessage(sessionId, message)) {
      yield this.normalizeChunk(chunk);
    }
  }
  
  private normalizeChunk(chunk: OpenCodeChunk): MessageChunk {
    // Convert OpenCode-specific format to universal format
  }
}

// Claude Desktop Adapter (new implementation)
class ClaudeDesktopAdapter implements AgentAdapter {
  id = 'claude-desktop';
  name = 'Claude Desktop';
  capabilities = {
    streaming: true,
    fileOperations: false, // Claude Desktop doesn't expose file API
    toolCalls: true,
    childSessions: false,
    customModels: false,
  };
  
  async connect(config: AgentConfig) {
    // Connect to Claude Desktop via IPC or local HTTP server
  }
  
  async *sendMessage(sessionId: string, message: Message) {
    // Translate to Claude API format
  }
}

// Custom Agent Adapter (for extensibility)
class CustomAgentAdapter implements AgentAdapter {
  // Load from plugin configuration
  constructor(private plugin: AgentPlugin) {}
  
  // Delegate to plugin implementation
}
```

### 2.3 Plugin System Architecture

**Goal**: Allow third-party extensions without modifying core

```typescript
// Plugin Manifest
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  
  // What this plugin provides
  provides: {
    adapters?: AgentAdapterDefinition[];
    toolRenderers?: ToolRendererDefinition[];
    commands?: CommandDefinition[];
    themes?: ThemeDefinition[];
  };
  
  // Dependencies
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  
  // Entry point
  main: string;
}

// Plugin API
interface PluginContext {
  // Core APIs
  workspace: WorkspaceAPI;
  sessions: SessionAPI;
  ui: UIExtensionAPI;
  storage: StorageAPI;
  
  // Utilities
  logger: Logger;
  config: ConfigAPI;
  
  // Registration
  registerAdapter(adapter: AgentAdapter): void;
  registerToolRenderer(renderer: ToolRenderer): void;
  registerCommand(command: Command): void;
}

// Example Plugin
export default class MyCustomPlugin {
  activate(context: PluginContext) {
    // Register custom OpenAI adapter
    context.registerAdapter(new OpenAIAdapter());
    
    // Register custom tool renderer for image generation
    context.registerToolRenderer({
      type: 'image-generation',
      render: (data) => <ImageGenerationView data={data} />
    });
    
    // Register slash command
    context.registerCommand({
      id: 'my-plugin.deploy',
      label: 'Deploy to Production',
      handler: async () => {
        // Custom deployment logic
      }
    });
  }
  
  deactivate() {
    // Cleanup
  }
}
```

### 2.4 Frontend Framework Choice: React vs Vue.js

#### Option 1: React (Recommended)

**Pros**:
- Largest ecosystem (npm packages, UI libraries, tooling)
- Better TypeScript support
- More developers familiar with it (easier hiring)
- Excellent testing libraries (React Testing Library, Vitest)
- Next.js for SSR/SSG if needed later
- Better performance with concurrent rendering

**Cons**:
- More boilerplate than Vue
- Hooks can be confusing for beginners
- Faster churn in ecosystem

**Stack**:
- **React 18** with TypeScript
- **Zustand** for state management (simple, performant)
- **TanStack Query** for server state
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Vitest** + **React Testing Library** for testing

#### Option 2: Vue.js 3

**Pros**:
- Simpler learning curve
- Better performance out-of-box (smaller bundle)
- Composition API similar to React Hooks
- Single-file components (template + script + style)
- Excellent official tooling (Vite, Vue Test Utils)

**Cons**:
- Smaller ecosystem than React
- Less enterprise adoption
- Fewer TypeScript-first libraries
- Plugin ecosystem not as mature

**Stack**:
- **Vue 3** with TypeScript
- **Pinia** for state management
- **VueUse** for composables
- **Headless UI** for accessible components
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Vitest** + **Vue Test Utils** for testing

#### Recommendation: **React**

**Reasoning**:
1. Plugin ecosystem will benefit from React's larger community
2. Easier to hire React developers
3. More third-party UI libraries for specialized use cases
4. Better long-term ecosystem stability
5. Concurrent rendering will help with large message lists

---

## 3. Test-Driven Development Approach

### 3.1 Testing Philosophy

**TDD from Day One**: Write tests **before** implementation

**Coverage Targets**:
- **Adapters**: 95% (critical for reliability)
- **Business Logic**: 90%
- **UI Components**: 80%
- **Integration**: 70%
- **E2E**: 10 critical flows

**Overall Target**: 85% code coverage minimum

### 3.2 Testing Stack

```typescript
// Unit Testing
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';

describe('OpenCodeAdapter', () => {
  it('should connect to server and fetch sessions', async () => {
    const adapter = new OpenCodeAdapter();
    await adapter.connect({ baseUrl: 'http://localhost:4096' });
    
    const sessions = await adapter.listSessions();
    expect(sessions).toBeInstanceOf(Array);
  });
  
  it('should stream message chunks', async () => {
    const adapter = new OpenCodeAdapter();
    const chunks: MessageChunk[] = [];
    
    for await (const chunk of adapter.sendMessage('session-1', { text: 'Hello' })) {
      chunks.push(chunk);
    }
    
    expect(chunks.length).toBeGreaterThan(0);
  });
});

// Component Testing
describe('MessageList', () => {
  it('should render messages with syntax highlighting', () => {
    render(<MessageList messages={mockMessages} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
  
  it('should auto-scroll to bottom on new message', async () => {
    const { rerender } = render(<MessageList messages={[message1]} />);
    rerender(<MessageList messages={[message1, message2]} />);
    
    // Assert scroll behavior
  });
});

// Integration Testing
describe('Session Workflow', () => {
  it('should create session, send message, receive response', async () => {
    const api = createTestAPI();
    
    const session = await api.createSession({ agent: 'opencode' });
    expect(session.id).toBeDefined();
    
    const response = await api.sendMessage(session.id, { text: 'Hello' });
    expect(response.status).toBe('streaming');
  });
});

// E2E Testing (Playwright)
test('User can create workspace and chat with agent', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="new-workspace"]');
  await page.fill('[data-testid="folder-path"]', '/tmp/test');
  await page.click('[data-testid="create"]');
  
  await page.waitForSelector('[data-testid="session-view"]');
  await page.fill('[data-testid="prompt-input"]', 'Hello AI');
  await page.click('[data-testid="send"]');
  
  await expect(page.locator('[data-testid="message"]')).toContainText('Hello');
});
```

### 3.3 TDD Development Workflow

```bash
# 1. Write failing test
$ npm run test:watch

# 2. Implement minimum code to pass
# 3. Refactor
# 4. Repeat

# Run full suite before commit
$ npm test -- --coverage
```

**Pre-commit Hook**:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm test -- --run",
      "pre-push": "npm run test:e2e"
    }
  }
}
```

---

## 4. Implementation Timeline

### 4.1 Detailed Phase Breakdown (26-32 Weeks)

#### Phase 1: Foundation & Architecture (Weeks 1-4)

**Goal**: Set up monorepo, testing, and core architecture

**Tasks**:
- [x] Initialize monorepo (pnpm workspaces)
- [x] Set up TypeScript, ESLint, Prettier
- [x] Configure Vitest + React Testing Library
- [x] Set up CI/CD pipeline (GitHub Actions)
- [x] Design adapter interface and plugin system
- [x] Create project documentation structure

**Deliverables**:
- Working monorepo with dev environment
- 100% test coverage for initial code (easy since minimal code)
- CI running tests on every commit

**Team**: 2 engineers (1 backend, 1 frontend/devops)

---

#### Phase 2: Core Backend (Weeks 5-8)

**Goal**: Build backend API and adapter system

**Tasks**:
- [x] Implement base `AgentAdapter` interface
- [x] Build workspace manager (TDD)
- [x] Implement session store (PostgreSQL)
- [x] Create message broker for real-time updates
- [x] Build file system API
- [x] Set up WebSocket server for streaming
- [x] Write comprehensive tests (target: 90% coverage)

**Deliverables**:
- REST API for workspace/session management
- WebSocket streaming for messages
- OpenCode adapter (initial implementation)
- 90%+ test coverage for backend

**Team**: 2 backend engineers

---

#### Phase 3: OpenCode Adapter (Weeks 9-10)

**Goal**: Complete OpenCode integration (feature parity with current)

**Tasks**:
- [x] Implement full OpenCode adapter
- [x] Map all OpenCode SDK features to adapter interface
- [x] Handle SSE streaming conversion
- [x] Support child sessions
- [x] Test against real OpenCode server
- [x] Performance optimization

**Deliverables**:
- Production-ready OpenCode adapter
- Integration tests with OpenCode
- Documentation for adapter implementation

**Team**: 1 backend engineer + 1 QA

---

#### Phase 4: Frontend Foundation (Weeks 11-14)

**Goal**: Build React UI foundation

**Tasks**:
- [x] Set up React + TypeScript + Vite
- [x] Implement design system (Tailwind + Radix UI)
- [x] Create component library (buttons, inputs, modals, etc.)
- [x] Build state management (Zustand stores)
- [x] Implement routing (React Router)
- [x] Set up Storybook for component development
- [x] Write component tests (target: 80% coverage)

**Deliverables**:
- Reusable component library
- Storybook for visual testing
- 80%+ test coverage for UI components

**Team**: 2 frontend engineers

---

#### Phase 5: Core UI Features (Weeks 15-18)

**Goal**: Implement main UI features

**Tasks**:
- [x] Workspace selection and creation
- [x] Session list and management
- [x] Message list with streaming
- [x] Prompt input with file attachments
- [x] Tool call rendering (edit, bash, read, write)
- [x] File browser
- [x] Command palette
- [x] Settings/preferences UI
- [x] Write E2E tests for critical flows

**Deliverables**:
- Feature-complete UI matching current CodeNomad functionality
- E2E tests for 10 critical user journeys
- Performance optimization (virtual scrolling for messages)

**Team**: 2 frontend engineers + 1 UX designer

---

#### Phase 6: Plugin System (Weeks 19-21)

**Goal**: Build plugin architecture and marketplace

**Tasks**:
- [x] Implement plugin loader
- [x] Create plugin context API
- [x] Build plugin discovery/installation UI
- [x] Develop example plugins (3-4 demos)
- [x] Write plugin developer documentation
- [x] Set up plugin marketplace (optional: NPM-based registry)

**Deliverables**:
- Working plugin system
- 3-4 demo plugins (Cursor adapter, GitHub Copilot adapter, custom themes)
- Plugin developer guide

**Team**: 2 backend engineers + 1 docs writer

---

#### Phase 7: Additional Adapters (Weeks 22-24)

**Goal**: Build 2-3 additional agent adapters

**Tasks**:
- [x] Claude Desktop adapter
- [x] Cursor adapter (if API available)
- [x] Generic OpenAI/Anthropic API adapter
- [x] Test all adapters with real services
- [x] Document adapter capabilities matrix

**Deliverables**:
- 3-4 production-ready adapters
- Adapter comparison documentation
- Migration guide from OpenCode-only to multi-agent

**Team**: 2 backend engineers

---

#### Phase 8: Polish & Performance (Weeks 25-26)

**Goal**: Optimize and refine

**Tasks**:
- [x] Performance profiling and optimization
- [x] Bundle size reduction
- [x] Memory leak detection and fixes
- [x] Accessibility audit (WCAG 2.1 AA)
- [x] Error handling improvements
- [x] Loading states and skeleton screens
- [x] Responsive design for smaller screens

**Deliverables**:
- Performance benchmarks met (<3s load, <100ms interactions)
- WCAG 2.1 AA compliance
- Polished UX

**Team**: 1 frontend engineer + 1 QA

---

#### Phase 9: Beta Testing (Weeks 27-29)

**Goal**: Validate with real users

**Tasks**:
- [x] Recruit 100-200 beta testers
- [x] Deploy beta builds (Electron + web)
- [x] Collect feedback via surveys and analytics
- [x] Triage and fix critical bugs
- [x] Iterate on UX based on feedback
- [x] Performance testing under load

**Deliverables**:
- Beta feedback report
- 50+ bugs fixed
- Release candidate ready

**Team**: Full team (5-6 engineers + PM)

---

#### Phase 10: Documentation & Launch Prep (Weeks 30-31)

**Goal**: Finalize documentation and prepare for launch

**Tasks**:
- [x] Complete user documentation
- [x] API reference documentation
- [x] Plugin developer guide
- [x] Video tutorials (5-6 short videos)
- [x] Marketing website
- [x] Prepare launch announcements

**Deliverables**:
- Complete documentation suite
- Marketing materials
- Launch plan

**Team**: 1 docs writer + 1 marketing

---

#### Phase 11: Release v1.0 (Week 32)

**Goal**: Ship production-ready v1.0

**Tasks**:
- [x] Final QA pass
- [x] Build and sign binaries (macOS, Windows, Linux)
- [x] Publish to NPM
- [x] Deploy web version
- [x] Launch announcement
- [x] Monitor for critical issues

**Deliverables**:
- **CodeNomad 2.0 v1.0 Released!** 🚀

**Team**: Full team

---

### 4.2 Timeline Summary

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| 1. Foundation | 4 weeks | Architecture finalized, tests passing |
| 2. Core Backend | 4 weeks | API + adapter system working |
| 3. OpenCode Adapter | 2 weeks | OpenCode feature parity |
| 4. Frontend Foundation | 4 weeks | Component library complete |
| 5. Core UI | 4 weeks | Feature-complete UI |
| 6. Plugin System | 3 weeks | Plugins working |
| 7. Additional Adapters | 3 weeks | Multi-agent support |
| 8. Polish | 2 weeks | Performance optimized |
| 9. Beta Testing | 3 weeks | User-validated |
| 10. Documentation | 2 weeks | Docs complete |
| 11. Launch | 1 week | v1.0 shipped |
| **TOTAL** | **32 weeks** | **~8 months** |

**Optimistic Timeline**: 26 weeks (6.5 months) if everything goes perfectly
**Realistic Timeline**: 32 weeks (8 months) accounting for bugs, scope creep
**Pessimistic Timeline**: 40 weeks (10 months) if major issues arise

---

## 5. Technology Stack Comparison

### 5.1 Current Stack (CodeNomad v0.9.5)

```yaml
Frontend:
  Framework: SolidJS 1.8
  UI Library: @suid/material, @kobalte/core
  State: SolidJS signals
  Build: Vite
  Styling: Tailwind CSS 3

Backend:
  Runtime: Node.js
  Framework: Fastify
  Language: TypeScript
  Storage: File-based JSON

Desktop:
  Primary: Electron 39
  Experimental: Tauri

Testing:
  Coverage: <5% (2 test files)
  Framework: None configured
```

### 5.2 Proposed Stack (Rebuild)

```yaml
Frontend:
  Framework: React 18
  UI Library: Radix UI (headless)
  State: Zustand + TanStack Query
  Build: Vite
  Styling: Tailwind CSS 4
  Testing: Vitest + React Testing Library

Backend:
  Runtime: Node.js 20
  Framework: Fastify 4
  Language: TypeScript 5
  Storage: PostgreSQL + Redis + S3
  Testing: Vitest + Supertest

Desktop:
  Primary: Electron 39 (same)
  Experimental: Tauri 2

DevOps:
  CI/CD: GitHub Actions
  Containers: Docker + Docker Compose
  Orchestration: Kubernetes (optional)
  Monitoring: Sentry + Prometheus + Grafana

Testing:
  Coverage: 85% target
  Unit: Vitest
  Integration: Vitest + MSW
  E2E: Playwright
  Visual: Storybook + Chromatic
```

### 5.3 Migration Considerations

**What Can Be Reused**:
- ✅ Build pipeline (electron-builder configs)
- ✅ Icon/brand assets
- ✅ OpenCode SDK knowledge
- ✅ Architecture documentation
- ✅ Some UI design patterns

**What Must Be Rewritten**:
- ❌ All SolidJS components → React
- ❌ Signal-based state → Zustand stores
- ❌ File-based storage → PostgreSQL
- ❌ Tight OpenCode coupling → Adapter abstraction

**Estimated Code Reuse**: ~10-15% (configs, assets, concepts)

---

## 6. Plugin Ecosystem Strategy

### 6.1 First-Party Plugins (Launch with v1.0)

1. **OpenCode Adapter** (built-in)
   - Full feature parity with current CodeNomad
   - Default adapter

2. **Claude Desktop Adapter**
   - Integrate with Claude Desktop app
   - Support Anthropic API as fallback

3. **Theme Pack**
   - 5-6 color themes (dark, light, high contrast)
   - Customizable syntax highlighting

4. **Export Plugin**
   - Export sessions to Markdown
   - Export to PDF
   - Export to HTML

### 6.2 Third-Party Plugin Ideas

**For Developers to Build**:
- **Cursor Adapter**: Integrate with Cursor AI
- **GitHub Copilot Chat Adapter**: Use Copilot Chat
- **Custom Model Adapter**: OpenAI, Anthropic, local LLMs
- **Jira Integration**: Create tickets from conversations
- **Git History Plugin**: Browse commit history in-app
- **Screenshot Tool**: Capture and annotate screenshots
- **Voice Input**: Speech-to-text for prompts
- **Custom Tool Renderers**: Specialized visualizations

### 6.3 Plugin Marketplace

**Distribution Options**:

**Option A: NPM-based** (Recommended)
- Publish plugins as NPM packages with `@codenomad-plugin/` scope
- Install via `npm install @codenomad-plugin/cursor`
- Auto-discovery in app settings
- Leverage existing NPM infrastructure

**Option B: Custom Registry**
- Build dedicated plugin marketplace
- Approval process for quality
- In-app browsing and one-click install
- Revenue sharing model (optional)

**Recommendation**: Start with NPM, build custom registry in v2.0 if demand exists

---

## 7. Cost & Resource Analysis

### 7.1 Team Structure

**Full-Time Employees** (32 weeks):
- **1 Tech Lead** (0.75 FTE): Architecture, code reviews, critical paths
- **2 Backend Engineers** (1.0 FTE each): API, adapters, plugin system
- **2 Frontend Engineers** (1.0 FTE each): React UI, components
- **1 DevOps/SRE** (0.5 FTE): CI/CD, infrastructure, monitoring
- **1 QA Engineer** (0.5 FTE): Test strategy, E2E tests, manual testing
- **1 Technical Writer** (0.25 FTE): Documentation
- **1 Designer** (0.25 FTE): UI/UX design, assets

**Total**: ~5.5 FTE over 8 months

### 7.2 Budget Estimates

**Personnel** (8 months):
| Role | FTE | Rate/Month | Total |
|------|-----|------------|-------|
| Tech Lead | 0.75 | $15,000 | $90,000 |
| Backend Engineers (2) | 2.0 | $12,000 | $192,000 |
| Frontend Engineers (2) | 2.0 | $12,000 | $192,000 |
| DevOps/SRE | 0.5 | $13,000 | $52,000 |
| QA Engineer | 0.5 | $10,000 | $40,000 |
| Technical Writer | 0.25 | $8,000 | $16,000 |
| Designer | 0.25 | $10,000 | $20,000 |
| **TOTAL** | **5.5** | | **$602,000** |

**Infrastructure & Tools** (8 months):
| Item | Cost/Month | Total |
|------|------------|-------|
| Cloud hosting (staging/prod) | $500 | $4,000 |
| CI/CD compute (GitHub Actions) | $200 | $1,600 |
| Monitoring (Sentry, Datadog) | $300 | $2,400 |
| Database (Postgres, Redis) | $200 | $1,600 |
| Code signing certificates | - | $500 |
| Design tools (Figma, etc.) | $100 | $800 |
| Testing services (BrowserStack) | $150 | $1,200 |
| Misc (domains, storage, etc.) | $100 | $800 |
| **TOTAL** | | **$12,900** |

**Grand Total**: ~**$615,000** for 8-month rebuild

**Cost Comparison**:
- **Incremental Plan**: ~$100K-150K (3-4 months, smaller team)
- **Rebuild Plan**: ~$615K (8 months, larger team)

**Cost Difference**: **4-6x more expensive**

### 7.3 ROI Analysis

**When Rebuild Makes Financial Sense**:

1. **Plugin Marketplace Revenue**:
   - If you plan to charge 20% commission on plugin sales
   - Estimate: 100 paid plugins × $10/month × 1000 users × 20% = $200K/year
   - ROI in 3 years

2. **Enterprise Licensing**:
   - Multi-agent support unlocks enterprise sales
   - Estimate: 50 enterprise licenses × $10K/year = $500K/year
   - ROI in 1.5 years

3. **SaaS Offering**:
   - Cloud-hosted version at $20/user/month
   - Estimate: 5000 users × $20/month = $1.2M/year
   - ROI in 6 months

**When Incremental Makes Sense**:
- You're not building a SaaS business
- OpenCode-first focus is acceptable
- Need faster time to market
- Limited budget

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Adapter abstraction too complex** | High | High | Start with 2 adapters (OpenCode + Claude), validate design early |
| **Plugin system security holes** | Medium | Critical | Sandbox plugins, code review process, security audit |
| **Performance worse than SolidJS** | Medium | Medium | Benchmark early, optimize React rendering, use virtual scrolling |
| **OpenCode SDK breaking changes** | Medium | High | Lock to stable version, maintain adapter layer for flexibility |
| **Scope creep delays launch** | High | High | Strict phase gates, MVP-first mentality, defer nice-to-haves |

### 8.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Users unhappy with UI change** | Medium | High | Beta test extensively, provide migration guide, keep familiar UX |
| **Competitors launch similar product** | Low | Medium | Move fast on core features, build community early |
| **Plugin ecosystem doesn't take off** | Medium | Medium | Build 5-6 high-quality first-party plugins to seed ecosystem |
| **Budget overruns** | High | Critical | Phase funding, reassess after each phase, maintain cash reserve |
| **Key engineers leave mid-project** | Medium | High | Document well, pair programming, cross-train team |

### 8.3 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **AI assistant market consolidates** | Medium | High | Stay agent-agnostic, don't depend on any single provider |
| **OpenCode becomes less popular** | Low | Medium | Multi-agent support reduces dependency |
| **Users don't want multi-agent support** | Medium | High | Validate with user research before committing to rebuild |

---

## 9. Comparison Matrix

### 9.1 Feature Comparison

| Feature | Current (v0.9.5) | Incremental Plan | Rebuild Plan |
|---------|------------------|------------------|--------------|
| **OpenCode Support** | ✅ Full | ✅ Full | ✅ Full |
| **Multi-Agent Support** | ❌ No | ❌ No | ✅ Yes |
| **Plugin System** | ❌ No | ⚠️ Limited | ✅ Full |
| **Test Coverage** | <5% | 60% | 85% |
| **Code Quality** | ⚠️ Inconsistent | ✅ Enforced | ✅ Enforced |
| **Performance** | ⚠️ Good | ⚠️ Good | ✅ Optimized |
| **Deployment Options** | Desktop + Web | Desktop + Web | Desktop + Web + SaaS |
| **Documentation** | ⚠️ Partial | ✅ Complete | ✅ Complete |
| **Observability** | ❌ Minimal | ✅ Production-grade | ✅ Production-grade |
| **Scalability** | ⚠️ Limited | ⚠️ Improved | ✅ Cloud-native |

### 9.2 Decision Matrix

**Choose Incremental If**:
- ✅ OpenCode-first is acceptable
- ✅ Need production app in 3-4 months
- ✅ Budget <$150K
- ✅ Team size limited (2-3 engineers)
- ✅ Users happy with current UX
- ✅ Low risk tolerance

**Choose Rebuild If**:
- ✅ Multi-agent support is strategic requirement
- ✅ Can afford 8-month timeline
- ✅ Budget >$500K available
- ✅ Team of 5+ engineers
- ✅ Building for SaaS/enterprise market
- ✅ Plugin ecosystem critical to business model

---

## 10. Hybrid Approach (Alternative)

### 10.1 "Best of Both" Strategy

**Concept**: Start with incremental improvements, plan for eventual rebuild

**Phase 1** (Months 1-3): Incremental Improvements
- Follow brainstorm.md plan
- Add testing, linting, security fixes
- Get to production-ready v1.0 quickly

**Phase 2** (Months 4-6): Adapter Layer (within SolidJS)
- Build adapter abstraction in current codebase
- Create OpenCode adapter (wraps existing code)
- Add one additional adapter (Claude or Cursor)
- Validate adapter concept with real users

**Phase 3** (Months 7-12): Gradual Migration
- If adapter layer proves valuable, plan React migration
- Migrate one package at a time (server first, then UI)
- Run both versions in parallel during transition
- Users can opt-in to new UI while keeping old as fallback

**Benefits**:
- ✅ Lower initial risk (start with incremental)
- ✅ Validate multi-agent demand before full investment
- ✅ Users get value sooner (v1.0 in 3 months)
- ✅ Can pivot if rebuild doesn't make sense
- ✅ Spreads cost over longer period

**Drawbacks**:
- ⚠️ Total timeline longer (12-18 months vs 8 months)
- ⚠️ Technical debt from two architectures
- ⚠️ Team must maintain both versions during transition

### 10.2 Hybrid Timeline

```
Month 1-3:   Incremental → Production v1.0 (OpenCode-only)
Month 4-6:   Adapter layer + Claude support → v1.1
Month 7-9:   React UI (parallel to SolidJS) → v2.0 beta
Month 10-12: Full migration → v2.0 stable
```

**Cost**: $250K-350K (spread over 12 months)

---

## 11. Recommendations

### 11.1 Primary Recommendation: **Incremental First, Rebuild Later**

**Reasoning**:
1. **Validate demand**: Multi-agent support sounds good, but is it what users actually want?
2. **Reduce risk**: Incremental plan de-risks the rebuild decision
3. **Cash flow**: Get to revenue faster with v1.0 in 3 months
4. **Learning**: Use v1.0 feedback to inform rebuild architecture
5. **Flexibility**: Can always rebuild later with better market data

**Suggested Path**:
```
NOW:   Execute incremental plan (brainstorm.md)
       → Ship v1.0 in Q2 2026

Q3:    Evaluate user feedback on multi-agent need
       → If strong demand, prototype adapter layer

Q4:    If adapter prototype successful, plan rebuild for 2027
       → Otherwise, continue iterating on v1.x
```

### 11.2 When to Choose Full Rebuild

**Rebuild makes sense if**:
1. You have **confirmed market demand** for multi-agent (surveys, customer interviews)
2. You have **secured funding** for 8-month project
3. Your **business model depends** on plugin ecosystem
4. You're targeting **enterprise sales** where extensibility is key
5. Current architecture is **fundamentally blocking** strategic goals

**Red flags suggesting rebuild is premature**:
- ❌ No user validation of multi-agent need
- ❌ Tight budget (<$500K)
- ❌ Small team (<4 engineers)
- ❌ Need revenue in <6 months
- ❌ Uncertain market fit

### 11.3 Final Thoughts

**The incremental plan in `brainstorm.md` is the smart starting point** for most scenarios. It:
- Gets you to production faster
- Costs 4-6x less
- Delivers proven value to users
- Preserves option to rebuild later

**The full rebuild** is a bigger bet that makes sense **only if**:
- Multi-agent support is a validated market need (not just a "nice to have")
- You have the budget and team to execute an 8-month project
- Plugin ecosystem is core to your business strategy

**My recommendation**: Execute the incremental plan first, then reassess rebuild in 6 months with real user data.

---

## 12. Next Steps

### If Proceeding with Incremental Plan
1. Review and approve `brainstorm.md`
2. Start Phase 1 (Foundation) immediately
3. Add multi-agent research as parallel track
4. Decide on rebuild after v1.0 ships

### If Proceeding with Rebuild
1. Conduct user research to validate multi-agent demand
2. Secure funding ($600K+ budget)
3. Hire team (5-6 engineers)
4. Set up monorepo and start Phase 1 (Foundation)
5. Plan monthly checkpoints to reassess

### If Choosing Hybrid Approach
1. Follow incremental plan for 3 months
2. Ship v1.0 with OpenCode-only
3. Build adapter abstraction layer
4. Add Claude Desktop adapter in v1.1
5. Evaluate rebuild decision with user data

---

## Appendix A: Technology Deep Dives

### A.1 React Ecosystem Benefits

**Component Libraries**:
- Radix UI (headless, accessible)
- shadcn/ui (copy-paste components)
- Chakra UI (batteries-included)
- Mantine (feature-rich)

**State Management Options**:
- Zustand (minimal, hooks-based)
- Redux Toolkit (complex but powerful)
- Jotai (atomic state)
- TanStack Query (server state)

**Testing Ecosystem**:
- Vitest (fast, Vite-native)
- React Testing Library (user-centric)
- Playwright (E2E)
- Storybook (visual testing)

**Build Tools**:
- Vite (fast dev server)
- Next.js (if SSR needed)
- Remix (if you want full-stack framework)

### A.2 PostgreSQL Schema Example

```sql
-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  parent_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  agent_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

### A.3 Docker Compose Example

```yaml
version: '3.8'

services:
  api:
    build: ./packages/server
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/codenomad
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=codenomad
    volumes:
      - postgres-data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

---

## Appendix B: Glossary

- **Adapter**: Abstraction layer that normalizes differences between AI providers
- **Agent-Agnostic**: Works with any AI assistant, not tied to specific provider
- **Plugin**: Installable extension that adds features to core app
- **TDD**: Test-Driven Development - write tests before implementation
- **Monorepo**: Single repository containing multiple packages/projects
- **SSE**: Server-Sent Events - one-way server-to-client streaming
- **WebSocket**: Bidirectional real-time communication protocol

---

**END OF REBUILD ALTERNATIVE ANALYSIS**

---

## Document Metadata

**Author**: CodeNomad Team  
**Created**: February 4, 2026  
**Last Updated**: February 4, 2026  
**Version**: 1.0  
**Status**: Proposal for Review  
**Related Documents**: 
- `brainstorm.md` - Incremental productionization plan
- `PRODUCTIONIZATION_SUMMARY.md` - Quick reference for incremental plan
