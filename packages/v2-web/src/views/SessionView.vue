<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <SessionSidebar 
      :active-session-id="id"
      @session-selected="handleSessionSelected"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div v-if="currentSession" class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">
              {{ currentSession.title || 'Chat Session' }}
            </h1>
            <p class="text-sm text-gray-500">
              Session ID: {{ currentSession.id }}
            </p>
          </div>
          <button
            v-if="currentSession && !isNewSession"
            @click="handleDeleteSession"
            class="text-sm text-red-600 hover:text-red-700"
          >
            Delete Session
          </button>
        </div>
        <div v-else-if="loading" class="animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !currentSession" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="sessionError" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <p class="text-red-600 mb-4">{{ sessionError }}</p>
          <button @click="loadSession" class="btn btn-primary">
            Retry
          </button>
        </div>
      </div>

      <!-- Messages and Input -->
      <template v-else-if="currentSession">
        <MessageList class="flex-1" />
        <PromptInput :session-id="id" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'
import { useMessageStore } from '@/stores/message'
import SessionSidebar from '@/components/SessionSidebar.vue'
import MessageList from '@/components/MessageList.vue'
import PromptInput from '@/components/PromptInput.vue'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const sessionStore = useSessionStore()
const messageStore = useMessageStore()

const { currentSession, loading, error: sessionError } = storeToRefs(sessionStore)

const isNewSession = ref(false)

const loadSession = async () => {
  try {
    await sessionStore.fetchSession(props.id)
    await messageStore.fetchMessages(props.id)
    messageStore.connectWebSocket(props.id)
  } catch (e) {
    console.error('Failed to load session:', e)
  }
}

onMounted(() => {
  loadSession()
})

onUnmounted(() => {
  messageStore.disconnectWebSocket()
  messageStore.clearMessages()
})

watch(() => props.id, (newId, oldId) => {
  if (newId !== oldId) {
    messageStore.disconnectWebSocket()
    messageStore.clearMessages()
    loadSession()
  }
})

function handleSessionSelected(sessionId: string) {
  if (sessionId !== props.id) {
    router.push(`/session/${sessionId}`)
  }
}

async function handleDeleteSession() {
  if (!currentSession.value) return
  
  const confirmed = confirm('Are you sure you want to delete this session?')
  if (!confirmed) return

  try {
    await sessionStore.deleteSession(currentSession.value.id)
    router.push('/workspaces')
  } catch (e) {
    console.error('Failed to delete session:', e)
  }
}
</script>
