# CodeNomad Rebuild Alternative: Agent-Agnostic Platform (MVP Web-First)

**Version**: 1.1 (Updated based on feedback)
**Date**: February 4, 2026  
**Status**: Alternative Architecture Proposal  
**Target Audience**: Software Engineers & Technical Decision Makers

**Key Updates** (v1.1):
- ✅ **Vue.js 3** selected as frontend framework (based on team preference)
- ✅ **Web-first MVP** approach (server + web UI, desktop deferred to v1.1+)
- ✅ **Simplified timeline**: 24 weeks (6 months) vs 32 weeks
- ✅ **Reduced cost**: $380K vs $615K (38% savings)
- ✅ **MVP focus**: 2-3 adapters (OpenCode + Claude + custom), minimal viable plugin system

---

## Executive Summary

This document explores an **alternative approach** to productionizing CodeNomad: rebuilding it from scratch as a fully **agent-agnostic, test-driven, pluggable platform** with **Vue.js 3** as the frontend framework.

### Key Differences from Incremental Plan

| Aspect | Incremental (brainstorm.md) | Rebuild MVP (This Document) |
|--------|----------------------------|-------------------------|
| **Timeline** | 17 weeks to v1.0 | 20-24 weeks to v1.0 MVP |
| **Risk** | Low (iterative improvements) | Medium (focused rewrite) |
| **Architecture** | Preserve existing (SolidJS) | New (Vue.js 3) |
| **Deployment** | Desktop + Web | **Web-first** (server + web UI) |
| **Agent Support** | OpenCode-focused | Agent-agnostic (OpenCode, Claude, custom) |
| **Testing** | Add tests to existing code | TDD from day one (85% coverage) |
| **Extensibility** | Limited plugin support | Full plugin architecture |
| **Investment** | ~$50K-75K (3 months) | ~$120K-160K (5-6 months) |

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
1. **Agent Agnostic**: Swap between AI providers seamlessly via adapter pattern
2. **Plugin Architecture**: Extend with custom tools, renderers, workflows
3. **Test-First**: 85%+ coverage from day one
4. **Modern Stack**: Vue.js 3 Composition API with TypeScript
5. **Web-First MVP**: Server + web UI (desktop apps added in v1.1+)
6. **Cloud-Ready**: Built for self-hosted and SaaS deployment

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
│                    Frontend (Vue.js 3)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Universal UI Components (SFC)                       │  │
│  │  - Session Manager  - Message Renderer               │  │
│  │  - Tool Call Views  - File Browser                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  State Management (Pinia)                            │  │
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

### 2.4 Frontend Framework: Vue.js 3 (Selected)

**Based on team preference and MVP requirements, Vue.js 3 is selected as the frontend framework.**

#### Why Vue.js 3 for This Project

**Pros**:
- ✅ **Simpler learning curve** - Easier for team to adopt
- ✅ **Better performance out-of-box** - Smaller bundle size, faster initial load
- ✅ **Composition API** - Clean, composable logic similar to React Hooks
- ✅ **Single-file components** - Template + script + style in one file
- ✅ **Excellent official tooling** - Vite (official), Vue Test Utils, DevTools
- ✅ **Less boilerplate** - More concise than React for same functionality
- ✅ **Official router & state** - Vue Router and Pinia maintained by core team
- ✅ **TypeScript support** - First-class TypeScript support in Vue 3

**Cons** (acceptable for this project):
- ⚠️ Smaller ecosystem than React (but sufficient for our needs)
- ⚠️ Fewer third-party UI libraries (but Headless UI and Radix Vue exist)
- ⚠️ Less enterprise adoption (not a concern for this project)

**Selected Stack**:
- **Vue 3** (Composition API) with TypeScript
- **Pinia** for state management
- **VueUse** for composables (utility hooks)
- **Headless UI** or **Radix Vue** for accessible components
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Vitest** + **Vue Test Utils** for testing
**Example Vue Component with Composition API**:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMessages } from '@/stores/messages';
import { useAdapter } from '@/composables/useAdapter';

const messages = useMessages();
const { sendMessage, isStreaming } = useAdapter();
const promptInput = ref('');

const canSend = computed(() => 
  promptInput.value.trim().length > 0 && !isStreaming.value
);

async function handleSend() {
  if (!canSend.value) return;
  
  await sendMessage(promptInput.value);
  promptInput.value = '';
}
</script>

<template>
  <div class="message-view">
    <MessageList :messages="messages.all" />
    
    <PromptInput
      v-model="promptInput"
      :disabled="isStreaming"
      @submit="handleSend"
    />
  </div>
</template>

<style scoped>
.message-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
```

#### Desktop Apps: Deferred to v1.1+

**MVP Decision**: Start with **web-only deployment** (server + web UI)

**Rationale**:
- ✅ Simpler development (no Electron/Tauri complexity initially)
- ✅ Faster iteration cycles (no platform-specific builds)
- ✅ Lower testing burden (one deployment target)
- ✅ Users can access via browser immediately
- ✅ Desktop apps can be added later without changing architecture

**Desktop Strategy for Future**:
- **v1.1**: Add Electron wrapper around web UI (simple shell)
- **v1.2**: Add Tauri experimental build
- **v2.0**: Native desktop features (global shortcuts, tray integration)

**Web-First Benefits**:
- Deploy to any server (self-hosted or cloud)
- Works on any OS with a browser
- Easier updates (no app distribution)
- Lower barrier to user adoption

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
import { mount } from '@vue/test-utils';

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

// Component Testing (Vue)
describe('MessageList', () => {
  it('should render messages with syntax highlighting', () => {
    const wrapper = mount(MessageList, {
      props: { messages: mockMessages }
    });
    expect(wrapper.find('[data-testid="message-list"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(3);
  });
  
  it('should auto-scroll to bottom on new message', async () => {
    const wrapper = mount(MessageList, {
      props: { messages: [message1] }
    });
    
    await wrapper.setProps({ messages: [message1, message2] });
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

## 4. Implementation Timeline (MVP Web-First)

### 4.1 Revised Phase Breakdown (20-24 Weeks)

**Key Changes from Original**:
- ✅ Vue.js 3 instead of React (faster development)
- ✅ Web-only deployment (no Electron/Tauri initially)
- ✅ Focus on 2-3 adapters for MVP (OpenCode + Claude + one custom)
- ✅ Simplified storage (can use file-based or SQLite initially, defer PostgreSQL)
- ✅ MVP-focused feature set

#### Phase 1: Foundation & Architecture (Weeks 1-3)

**Goal**: Set up monorepo, testing, and core architecture

**Tasks**:
- [ ] Initialize monorepo (pnpm workspaces: `packages/server`, `packages/web`)
- [ ] Set up TypeScript, ESLint, Prettier
- [ ] Configure Vitest + Vue Test Utils
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Design adapter interface (agent-agnostic)
- [ ] Design plugin system API
- [ ] Create project documentation structure

**Deliverables**:
- Working monorepo with dev environment
- 100% test coverage for initial code
- CI running tests + linting on every commit
- Architecture documentation

**Team**: 2 engineers (1 backend, 1 frontend/devops)

---

#### Phase 2: Core Backend + Adapter System (Weeks 4-7)

**Goal**: Build backend API and adapter abstraction layer

**Tasks**:
- [ ] Implement base `AgentAdapter` interface (TypeScript)
- [ ] Build workspace manager (TDD approach)
- [ ] Implement session store (start with SQLite, can upgrade to PostgreSQL later)
- [ ] Create message broker for real-time updates (simple event emitter initially)
- [ ] Build file system API
- [ ] Set up WebSocket server for streaming
- [ ] Implement plugin loader and context API
- [ ] Write comprehensive tests (target: 90% coverage)

**Deliverables**:
- REST API for workspace/session management
- WebSocket streaming for messages
- Adapter interface working with mock adapter
- Plugin system foundation
- 90%+ test coverage for backend

**Team**: 2 backend engineers

---

#### Phase 3: OpenCode Adapter (Weeks 8-9)

**Goal**: Complete OpenCode integration (MVP feature parity)

**Tasks**:
- [ ] Implement OpenCode adapter using existing SDK
- [ ] Map all essential OpenCode features to adapter interface
- [ ] Handle SSE streaming conversion to WebSocket
- [ ] Support child sessions (if needed for MVP)
- [ ] Test against real OpenCode server
- [ ] Basic performance optimization

**Deliverables**:
- Production-ready OpenCode adapter
- Integration tests with OpenCode
- Documentation for adapter implementation

**Team**: 1 backend engineer + 1 QA

---

#### Phase 4: Frontend Foundation (Weeks 10-12)

**Goal**: Build Vue.js UI foundation

**Tasks**:
- [ ] Set up Vue 3 + TypeScript + Vite
- [ ] Implement design system (Tailwind + Headless UI/Radix Vue)
- [ ] Create component library (buttons, inputs, modals, dropdowns)
- [ ] Build state management (Pinia stores)
- [ ] Implement routing (Vue Router)
- [ ] Set up Storybook for component development (optional for MVP)
- [ ] Write component tests (target: 80% coverage)

**Deliverables**:
- Reusable component library
- Storybook for visual testing (optional)
- 80%+ test coverage for UI components

**Team**: 2 frontend engineers

---

#### Phase 5: Core UI Features (Weeks 13-16)

**Goal**: Implement main UI features (web-only)

**Tasks**:
- [ ] Workspace selection and creation UI
- [ ] Session list and management
- [ ] Message list with streaming (virtual scrolling if needed)
- [ ] Prompt input with file attachments
- [ ] Tool call rendering (edit, bash, read, write, task)
- [ ] File browser component
- [ ] Command palette
- [ ] Settings/preferences UI
- [ ] Adapter selection UI (switch between OpenCode/Claude/custom)
- [ ] Write E2E tests for critical flows

**Deliverables**:
- Feature-complete web UI with OpenCode adapter
- E2E tests for 5-10 critical user journeys
- Responsive design (works on tablets/mobile browsers)

**Team**: 2 frontend engineers

---

#### Phase 6: Additional Adapters (Weeks 17-18)

**Goal**: Add 1-2 more adapters to validate architecture

**Tasks**:
- [ ] Claude Desktop/API adapter
- [ ] Generic OpenAI API adapter OR custom adapter template
- [ ] Test all adapters with real services
- [ ] Document adapter capabilities matrix
- [ ] Create adapter developer guide

**Deliverables**:
- 2-3 production-ready adapters total
- Adapter comparison documentation
- Proof of agent-agnostic architecture

**Team**: 1-2 backend engineers

---

#### Phase 7: Polish & Performance (Weeks 19-20)

**Goal**: Optimize and refine for production

**Tasks**:
- [ ] Performance profiling and optimization
- [ ] Bundle size reduction
- [ ] Memory leak detection and fixes
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Error handling improvements
- [ ] Loading states and skeleton screens
- [ ] Mobile/tablet responsiveness
- [ ] Documentation polish

**Deliverables**:
- Performance benchmarks met (<3s load, <100ms interactions)
- WCAG 2.1 AA compliance
- Polished UX
- Complete user documentation

**Team**: 1 frontend + 1 backend engineer

---

#### Phase 8: Beta Testing (Weeks 21-23)

**Goal**: Validate with real users

**Tasks**:
- [ ] Recruit 50-100 beta testers
- [ ] Deploy beta to public URL (or provide Docker image)
- [ ] Collect feedback via surveys and analytics
- [ ] Triage and fix critical bugs
- [ ] Iterate on UX based on feedback
- [ ] Performance testing under load

**Deliverables**:
- Beta feedback report
- Critical bugs fixed
- Release candidate ready

**Team**: Full team (3-4 engineers + PM)

---

#### Phase 9: Launch v1.0 MVP (Week 24)

**Goal**: Ship production-ready web version

**Tasks**:
- [ ] Final QA pass
- [ ] Build production bundle
- [ ] Deploy to production (or provide self-hosted Docker image)
- [ ] Publish NPM package for server (`@codenomad/server`)
- [ ] Launch announcement
- [ ] Monitor for critical issues

**Deliverables**:
- **CodeNomad 2.0 v1.0 MVP Released!** 🚀 (Web version)

**Team**: Full team

---

### 4.2 Timeline Summary (MVP)

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| 1. Foundation | 3 weeks | Architecture finalized, monorepo setup |
| 2. Core Backend + Adapters | 4 weeks | API + adapter system working |
| 3. OpenCode Adapter | 2 weeks | OpenCode integration complete |
| 4. Frontend Foundation | 3 weeks | Vue component library ready |
| 5. Core UI | 4 weeks | Feature-complete web UI |
| 6. Additional Adapters | 2 weeks | Multi-agent support validated |
| 7. Polish & Performance | 2 weeks | Production-ready quality |
| 8. Beta Testing | 3 weeks | User-validated |
| 9. Launch v1.0 MVP | 1 week | Web version shipped |
| **TOTAL** | **24 weeks** | **~6 months** |

**Optimistic Timeline**: 20 weeks (5 months) if everything goes smoothly
**Realistic Timeline**: 24 weeks (6 months) accounting for bugs and iteration
**Buffer**: 26-28 weeks (6.5-7 months) if major issues arise

**Post-MVP Roadmap**:
- **v1.1** (Month 7-8): Add Electron wrapper for desktop app
- **v1.2** (Month 9-10): Add Tauri experimental build
- **v1.3** (Month 11-12): Plugin marketplace and additional adapters

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

### 5.2 Proposed Stack (MVP Web-First Rebuild)

```yaml
Frontend:
  Framework: Vue 3 (Composition API)
  UI Library: Headless UI or Radix Vue (accessible primitives)
  State: Pinia (official Vue state management)
  Composables: VueUse (utility composables)
  Build: Vite
  Styling: Tailwind CSS 4
  Testing: Vitest + Vue Test Utils

Backend:
  Runtime: Node.js 20
  Framework: Fastify 4
  Language: TypeScript 5
  Storage: SQLite (MVP) → PostgreSQL (v1.1+)
  Cache: In-memory (MVP) → Redis (v1.1+ if needed)
  Testing: Vitest + Supertest

Deployment:
  MVP: Web-only (server + web UI)
  v1.1+: Electron wrapper
  v1.2+: Tauri experimental

DevOps:
  CI/CD: GitHub Actions
  Containers: Docker + Docker Compose
  Monitoring: Sentry (errors) + basic logging
  Future: Prometheus + Grafana (if SaaS)

Testing:
  Coverage: 85% target
  Unit: Vitest
  Integration: Vitest + MSW
  E2E: Playwright
  Visual: Optional Storybook
```

### 5.3 Migration Considerations

**What Can Be Reused**:
- ✅ OpenCode SDK knowledge and integration patterns
- ✅ Architecture documentation concepts
- ✅ UI/UX design patterns (adapted to Vue)
- ✅ Icon/brand assets
- ✅ Some TypeScript utility code

**What Must Be Rewritten**:
- ❌ All SolidJS components → Vue 3 SFC
- ❌ Signal-based state → Pinia stores
- ❌ Tight OpenCode coupling → Adapter abstraction
- ❌ File-based storage → SQLite/PostgreSQL
- ❌ Desktop-specific code (deferred to v1.1)

**Estimated Code Reuse**: ~5-10% (mainly concepts and assets, not code)

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

### 7.1 Team Structure (MVP Web-First)

**Full-Time Employees** (24 weeks / 6 months):
- **1 Tech Lead** (0.5 FTE): Architecture, code reviews, critical paths
- **2 Backend Engineers** (1.0 FTE each): API, adapters, plugin system
- **2 Frontend Engineers** (1.0 FTE each): Vue.js UI, components
- **1 DevOps/QA** (0.5 FTE): CI/CD, testing, deployment
- **1 Technical Writer** (0.25 FTE part-time): Documentation

**Total**: ~4.25 FTE over 6 months

**Simplified from Original**:
- ❌ No separate designer (use open-source design system)
- ❌ Lighter DevOps (web-only, no desktop builds)
- ❌ Smaller QA burden (focused MVP scope)

### 7.2 Budget Estimates (MVP)

**Personnel** (6 months):
| Role | FTE | Rate/Month | Total |
|------|-----|------------|-------|
| Tech Lead | 0.5 | $15,000 | $45,000 |
| Backend Engineers (2) | 2.0 | $12,000 | $144,000 |
| Frontend Engineers (2) | 2.0 | $12,000 | $144,000 |
| DevOps/QA | 0.5 | $11,000 | $33,000 |
| Technical Writer | 0.25 | $8,000 | $12,000 |
| **TOTAL** | **4.25** | | **$378,000** |

**Infrastructure & Tools** (6 months):
| Item | Cost/Month | Total |
|------|------------|-------|
| Cloud hosting (staging + simple prod) | $200 | $1,200 |
| CI/CD compute (GitHub Actions) | $100 | $600 |
| Monitoring (Sentry free tier + basic) | $50 | $300 |
| Database (SQLite self-hosted → minimal cost) | $0 | $0 |
| Design tools (Figma free tier) | $0 | $0 |
| Testing (Playwright cloud optional) | $50 | $300 |
| Misc (domain, storage, etc.) | $50 | $300 |
| **TOTAL** | | **$2,700** |

**Grand Total (MVP)**: ~**$380,000** for 6-month rebuild

**Cost Comparison**:
- **Incremental Plan**: ~$100K-150K (3-4 months, smaller team)
- **MVP Rebuild (Web-First)**: ~$380K (6 months, focused team)
- **Full Rebuild (Original)**: ~$615K (8 months, larger team)

**Cost Difference**: **2.5-3.8x more than incremental**, but **38% less than full rebuild**

### 7.3 ROI Analysis (Updated for MVP)

**When MVP Rebuild Makes Financial Sense**:

1. **Multi-Agent Demand Validated**:
   - User research confirms demand for Claude/Cursor/custom agents
   - Willing to pay premium for unified workspace
   - Market size justifies investment

2. **SaaS Business Model**:
   - Plan to charge $10-20/user/month
   - Target: 2000 paying users within 12 months
   - Revenue: $240K-480K/year → ROI in 9-18 months

3. **Enterprise Licensing**:
   - Multi-agent + plugin system attracts enterprises
   - Target: 20 enterprise deals × $5K/year = $100K/year
   - Combined with SaaS: ROI in 12 months

**When Incremental Still Makes More Sense**:
- Uncertain market demand for multi-agent
- Budget constrained (<$300K)
- Need revenue faster (3-4 months vs 6 months)
- OpenCode-first focus is acceptable for v1.0

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Adapter abstraction too complex** | Medium | High | Start with 2 adapters (OpenCode + Claude), iterate on design |
| **Plugin system security holes** | Medium | Critical | Minimal MVP plugin system, defer complex features to v1.1 |
| **Performance issues with Vue.js** | Low | Medium | Vue 3 is performant, use virtual scrolling if needed |
| **OpenCode SDK breaking changes** | Medium | High | Lock to stable version, adapter layer provides insulation |
| **Scope creep delays launch** | High | High | **Strict MVP focus, web-only, defer desktop to v1.1** |
| **Web-only limits adoption** | Medium | Medium | Most users comfortable with web apps, add desktop later if needed |

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

| Feature | Current (v0.9.5) | Incremental Plan | MVP Rebuild (Web-First) |
|---------|------------------|------------------|-------------------------|
| **OpenCode Support** | ✅ Full | ✅ Full | ✅ Full |
| **Multi-Agent Support** | ❌ No | ❌ No | ✅ Yes (OpenCode + Claude + custom) |
| **Plugin System** | ❌ No | ⚠️ Limited | ✅ MVP plugin system |
| **Test Coverage** | <5% | 60% | 85% |
| **Code Quality** | ⚠️ Inconsistent | ✅ Enforced | ✅ Enforced (TDD) |
| **Performance** | ⚠️ Good | ⚠️ Good | ✅ Optimized (Vue 3) |
| **Deployment** | Desktop + Web | Desktop + Web | **Web-only MVP** (desktop in v1.1+) |
| **Documentation** | ⚠️ Partial | ✅ Complete | ✅ Complete |
| **Observability** | ❌ Minimal | ✅ Production-grade | ✅ Production-grade |
| **Timeline** | - | 17 weeks | 24 weeks |
| **Cost** | - | $100-150K | $380K |

### 9.2 Decision Matrix (Updated)

**Choose Incremental If**:
- ✅ OpenCode-first is acceptable for v1.0
- ✅ Need production app in 3-4 months
- ✅ Budget <$200K
- ✅ Team size limited (2-3 engineers)
- ✅ Users happy with current UX
- ✅ Low risk tolerance
- ✅ Desktop apps are important from day one

**Choose MVP Rebuild If**:
- ✅ Multi-agent support is validated requirement
- ✅ Can afford 6-month timeline
- ✅ Budget ~$400K available
- ✅ Team of 4 engineers
- ✅ Building for web/SaaS deployment
- ✅ Want modern framework (Vue.js) and TDD from start
- ✅ Desktop apps can wait until v1.1
- ✅ Plugin ecosystem is medium-term goal

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
- If adapter layer proves valuable, plan Vue.js migration
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
- ⚠️ Total timeline longer (12-18 months vs 6 months)
- ⚠️ Technical debt from two architectures
- ⚠️ Team must maintain both versions during transition

### 10.2 Hybrid Timeline

```
Month 1-3:   Incremental → Production v1.0 (OpenCode-only, SolidJS)
Month 4-6:   Adapter layer + Claude support → v1.1 (still SolidJS)
Month 7-9:   Vue.js web UI (parallel to SolidJS desktop) → v2.0 beta
Month 10-12: Full migration → v2.0 stable (deprecate SolidJS)
```

**Cost**: $250K-300K (spread over 12 months)

---

## 11. Recommendations

### 11.1 Updated Recommendation: **Consider MVP Rebuild If Multi-Agent Is Priority**

**Based on Feedback**:
- ✅ Team prefers Vue.js (simpler, faster to develop)
- ✅ Web-first approach acceptable (desktop can wait)
- ✅ MVP focus on adapters and interfaces

**Two Viable Paths**:

#### Path A: Incremental (Lower Risk)
```
NOW:   Execute incremental plan (brainstorm.md)
       → Ship v1.0 in Q2 2026 (17 weeks, $100-150K)

Q3:    Evaluate user feedback on multi-agent need
       → If strong demand, prototype adapter layer in SolidJS

Q4:    If validated, plan Vue.js rebuild for 2027
       → Otherwise, continue iterating on v1.x
```

**Choose if**: OpenCode-first is acceptable, budget <$200K, need revenue quickly

#### Path B: MVP Rebuild (Higher Potential)
```
NOW:   Execute MVP rebuild plan (this document)
       → Ship v1.0 web-only in Q3 2026 (24 weeks, $380K)
       → Multi-agent from day one (OpenCode + Claude + custom)

Q4:    Add Electron wrapper for v1.1
       → Desktop app without rebuilding architecture

2027:  Expand plugin marketplace, additional adapters
```

**Choose if**: Multi-agent demand validated, budget ~$400K, web-first acceptable

### 11.2 When MVP Rebuild Makes Sense

**Green lights for MVP rebuild**:
1. ✅ **Validated demand** for multi-agent (user research, interviews)
2. ✅ **Team prefers Vue.js** (as stated in feedback)
3. ✅ **$300-400K budget** secured
4. ✅ **Web-first is acceptable** (as stated in feedback)
5. ✅ **6-month timeline** acceptable
6. ✅ Want **TDD from day one** (85% coverage)
7. ✅ Planning **SaaS or self-hosted** deployment

**Red flags suggesting incremental is safer**:
- ❌ No user validation of multi-agent need
- ❌ Budget <$300K
- ❌ Need revenue in <4 months
- ❌ Desktop apps critical from day one
- ❌ Team unfamiliar with Vue.js

### 11.3 Final Thoughts

**Given your feedback** (prefer Vue.js, web-only is fine, MVP focus):

The **MVP rebuild becomes more attractive** because:
- ✅ Web-only reduces complexity and cost (vs full rebuild)
- ✅ Vue.js aligns with team preference (vs forced React)
- ✅ Agent-agnostic from start (vs retrofitting later)
- ✅ Still 2.5x cost of incremental, but **cleaner architecture**

**However**, the **incremental plan is still safer** if:
- Multi-agent demand is unvalidated
- Budget is tight
- Need faster time to revenue

**Recommendation**: 
1. **If multi-agent demand is confirmed** → MVP Rebuild (Path B)
2. **If multi-agent demand is uncertain** → Incremental first (Path A), rebuild later if validated

The MVP rebuild plan in this document provides a **realistic, focused approach** for building an agent-agnostic platform with Vue.js in 6 months for ~$380K.

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
