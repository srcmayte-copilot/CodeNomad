<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-4xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">CodeNomad v2</h1>
        <p class="text-gray-600">Select or create a workspace to get started</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading workspaces...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card p-8 text-center">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button @click="fetchWorkspaces" class="btn btn-primary">
          Retry
        </button>
      </div>

      <!-- Workspaces List -->
      <div v-else>
        <!-- Existing Workspaces -->
        <div v-if="hasWorkspaces" class="mb-6">
          <h2 class="text-xl font-semibold mb-4">Your Workspaces</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <button
              v-for="workspace in workspaces"
              :key="workspace.id"
              @click="handleSelectWorkspace(workspace.id)"
              class="card p-6 text-left hover:shadow-md transition-shadow"
            >
              <h3 class="font-semibold text-lg text-gray-900 mb-1">
                {{ workspace.name }}
              </h3>
              <p class="text-sm text-gray-600 mb-2 truncate">
                {{ workspace.path }}
              </p>
              <div class="text-xs text-gray-400">
                <span v-if="workspace.lastAccessedAt">
                  Last accessed {{ formatDate(workspace.lastAccessedAt) }}
                </span>
                <span v-else>
                  Created {{ formatDate(workspace.createdAt) }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Create New Workspace -->
        <div class="card p-6">
          <h2 class="text-xl font-semibold mb-4">
            {{ hasWorkspaces ? 'Create New Workspace' : 'Create Your First Workspace' }}
          </h2>
          <form @submit.prevent="handleCreateWorkspace" class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name
              </label>
              <input
                id="name"
                v-model="newWorkspace.name"
                type="text"
                required
                placeholder="My Project"
                class="input"
              />
            </div>
            <div>
              <label for="path" class="block text-sm font-medium text-gray-700 mb-1">
                Project Path
              </label>
              <input
                id="path"
                v-model="newWorkspace.path"
                type="text"
                required
                placeholder="/path/to/project"
                class="input"
              />
            </div>
            <div class="flex justify-end space-x-2">
              <button
                v-if="hasWorkspaces"
                type="button"
                @click="resetForm"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="!canCreate"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '@/stores/workspace'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const sessionStore = useSessionStore()

const { workspaces, loading, error, hasWorkspaces } = storeToRefs(workspaceStore)

const newWorkspace = ref({
  name: '',
  path: ''
})

const canCreate = computed(() => 
  newWorkspace.value.name.trim().length > 0 && 
  newWorkspace.value.path.trim().length > 0 &&
  !loading.value
)

onMounted(() => {
  workspaceStore.fetchWorkspaces()
})

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

async function handleSelectWorkspace(workspaceId: string) {
  await workspaceStore.selectWorkspace(workspaceId)
  
  // Try to load sessions for this workspace
  await sessionStore.fetchSessions(workspaceId)
  
  // If there are existing sessions, go to the most recent one
  if (sessionStore.hasSessions && sessionStore.sessions[0]) {
    router.push(`/session/${sessionStore.sessions[0].id}`)
  } else {
    // Otherwise, create a new session
    try {
      const session = await sessionStore.createSession(workspaceId)
      router.push(`/session/${session.id}`)
    } catch (e) {
      console.error('Failed to create session:', e)
    }
  }
}

async function handleCreateWorkspace() {
  if (!canCreate.value) return

  try {
    const workspace = await workspaceStore.createWorkspace(
      newWorkspace.value.name.trim(),
      newWorkspace.value.path.trim()
    )
    resetForm()
    
    // Create a new session for the new workspace
    const session = await sessionStore.createSession(workspace.id)
    router.push(`/session/${session.id}`)
  } catch (e) {
    console.error('Failed to create workspace:', e)
  }
}

function resetForm() {
  newWorkspace.value = {
    name: '',
    path: ''
  }
}
</script>
