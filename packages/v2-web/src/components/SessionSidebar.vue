<template>
  <div class="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">Sessions</h2>
      <button
        @click="handleNewSession"
        class="mt-2 w-full btn btn-primary text-sm"
        :disabled="!currentWorkspace || loading"
      >
        + New Session
      </button>
    </div>

    <!-- Sessions List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4 text-center">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
      </div>

      <div v-else-if="error" class="p-4 text-sm text-red-600">
        {{ error }}
      </div>

      <div v-else-if="!hasSessions" class="p-4 text-sm text-gray-500 text-center">
        No sessions yet
      </div>

      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="session in sessions"
          :key="session.id"
          @click="selectSession(session.id)"
          class="w-full p-3 text-left hover:bg-gray-50 transition-colors"
          :class="{ 'bg-primary-50': session.id === activeSessionId }"
        >
          <div class="text-sm font-medium text-gray-900 truncate">
            {{ session.title || 'Untitled Session' }}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ formatDate(session.updatedAt) }}
          </div>
          <div v-if="session.messageCount" class="text-xs text-gray-400 mt-1">
            {{ session.messageCount }} messages
          </div>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200">
      <div v-if="currentWorkspace" class="text-xs text-gray-600">
        <div class="font-medium truncate">{{ currentWorkspace.name }}</div>
        <div class="text-gray-400 truncate">{{ currentWorkspace.path }}</div>
      </div>
      <button
        @click="handleBackToWorkspaces"
        class="mt-2 w-full btn btn-secondary text-xs"
      >
        Change Workspace
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'
import { useWorkspaceStore } from '@/stores/workspace'

const props = defineProps<{
  activeSessionId?: string
}>()

const emit = defineEmits<{
  sessionSelected: [sessionId: string]
}>()

const router = useRouter()
const sessionStore = useSessionStore()
const workspaceStore = useWorkspaceStore()

const { sessions, loading, error, hasSessions } = storeToRefs(sessionStore)
const { currentWorkspace } = storeToRefs(workspaceStore)

onMounted(() => {
  if (currentWorkspace.value) {
    sessionStore.fetchSessions(currentWorkspace.value.id)
  }
})

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function selectSession(sessionId: string) {
  emit('sessionSelected', sessionId)
  router.push(`/session/${sessionId}`)
}

async function handleNewSession() {
  if (!currentWorkspace.value) return
  
  try {
    const session = await sessionStore.createSession(currentWorkspace.value.id)
    router.push(`/session/${session.id}`)
  } catch (e) {
    console.error('Failed to create session:', e)
  }
}

function handleBackToWorkspaces() {
  router.push('/workspaces')
}
</script>
