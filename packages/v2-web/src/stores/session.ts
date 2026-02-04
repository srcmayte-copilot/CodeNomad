import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Session {
  id: string
  workspaceId: string
  title?: string
  createdAt: string
  updatedAt: string
  messageCount?: number
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<Session[]>([])
  const currentSession = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasSessions = computed(() => sessions.value.length > 0)

  async function fetchSessions(workspaceId?: string) {
    loading.value = true
    error.value = null
    try {
      const url = workspaceId 
        ? `${API_URL}/api/workspaces/${workspaceId}/sessions`
        : `${API_URL}/api/sessions`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      sessions.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching sessions:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSession(sessionId: string) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch session')
      currentSession.value = await response.json()
      return currentSession.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching session:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createSession(workspaceId: string, title?: string) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, title })
      })
      if (!response.ok) throw new Error('Failed to create session')
      const session = await response.json()
      sessions.value.unshift(session)
      currentSession.value = session
      return session
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error creating session:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSession(sessionId: string) {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete session')
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      if (currentSession.value?.id === sessionId) {
        currentSession.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error deleting session:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    sessions,
    currentSession,
    loading,
    error,
    hasSessions,
    fetchSessions,
    fetchSession,
    createSession,
    deleteSession
  }
})
