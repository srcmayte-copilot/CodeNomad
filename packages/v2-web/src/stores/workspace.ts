import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Workspace {
  id: string
  name: string
  path: string
  createdAt: string
  lastAccessedAt?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([])
  const currentWorkspace = ref<Workspace | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasWorkspaces = computed(() => workspaces.value.length > 0)

  async function fetchWorkspaces() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/api/workspaces`)
      if (!response.ok) throw new Error('Failed to fetch workspaces')
      workspaces.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching workspaces:', e)
    } finally {
      loading.value = false
    }
  }

  async function selectWorkspace(workspaceId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (workspace) {
      currentWorkspace.value = workspace
      try {
        await fetch(`${API_URL}/api/workspaces/${workspaceId}/access`, {
          method: 'POST'
        })
      } catch (e) {
        console.error('Error updating workspace access:', e)
      }
    }
  }

  async function createWorkspace(name: string, path: string) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/api/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, path })
      })
      if (!response.ok) throw new Error('Failed to create workspace')
      const workspace = await response.json()
      workspaces.value.push(workspace)
      return workspace
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error creating workspace:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    hasWorkspaces,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace
  }
})
