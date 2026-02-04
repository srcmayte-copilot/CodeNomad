import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  isStreaming?: boolean
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100'
const WS_URL = API_URL.replace(/^http/, 'ws')

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const streaming = ref(false)
  const error = ref<string | null>(null)
  const ws = ref<WebSocket | null>(null)
  const currentSessionId = ref<string | null>(null)

  const hasMessages = computed(() => messages.value.length > 0)
  const streamingMessage = computed(() => 
    messages.value.find(m => m.isStreaming)
  )

  async function fetchMessages(sessionId: string) {
    loading.value = true
    error.value = null
    currentSessionId.value = sessionId
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      messages.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error fetching messages:', e)
    } finally {
      loading.value = false
    }
  }

  function connectWebSocket(sessionId: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.close()
    }

    ws.value = new WebSocket(`${WS_URL}/api/sessions/${sessionId}/stream`)

    ws.value.onopen = () => {
      console.log('WebSocket connected')
      error.value = null
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (e) {
        console.error('Error parsing WebSocket message:', e)
      }
    }

    ws.value.onerror = (event) => {
      console.error('WebSocket error:', event)
      error.value = 'WebSocket connection error'
    }

    ws.value.onclose = () => {
      console.log('WebSocket disconnected')
      streaming.value = false
    }
  }

  function handleWebSocketMessage(data: any) {
    if (data.type === 'message_start') {
      streaming.value = true
      const newMessage: Message = {
        id: data.messageId || `temp-${Date.now()}`,
        sessionId: currentSessionId.value!,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isStreaming: true
      }
      messages.value.push(newMessage)
    } else if (data.type === 'content_delta') {
      const msg = streamingMessage.value
      if (msg) {
        msg.content += data.delta
      }
    } else if (data.type === 'message_end') {
      const msg = streamingMessage.value
      if (msg) {
        msg.isStreaming = false
        if (data.messageId) {
          msg.id = data.messageId
        }
      }
      streaming.value = false
    } else if (data.type === 'error') {
      error.value = data.message || 'Streaming error'
      streaming.value = false
      const msg = streamingMessage.value
      if (msg) {
        msg.isStreaming = false
      }
    }
  }

  async function sendMessage(sessionId: string, content: string) {
    if (!content.trim()) return

    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      sessionId,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString()
    }
    messages.value.push(userMessage)

    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const savedMessage = await response.json()
      const idx = messages.value.findIndex(m => m.id === userMessage.id)
      if (idx !== -1) {
        messages.value[idx] = savedMessage
      }

      if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
        connectWebSocket(sessionId)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error sending message:', e)
      const idx = messages.value.findIndex(m => m.id === userMessage.id)
      if (idx !== -1) {
        messages.value.splice(idx, 1)
      }
      throw e
    }
  }

  function disconnectWebSocket() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    streaming.value = false
  }

  function clearMessages() {
    messages.value = []
    currentSessionId.value = null
  }

  return {
    messages,
    loading,
    streaming,
    error,
    hasMessages,
    streamingMessage,
    fetchMessages,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
    clearMessages
  }
})
