<template>
  <div class="flex flex-col h-full">
    <!-- Messages List -->
    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-600">{{ error }}</p>
      </div>

      <div v-else-if="!hasMessages" class="text-center py-8 text-gray-500">
        <p>No messages yet. Start a conversation!</p>
      </div>

      <div 
        v-for="message in messages" 
        :key="message.id"
        class="flex"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-3xl rounded-lg px-4 py-2"
          :class="message.role === 'user' 
            ? 'bg-primary-600 text-white' 
            : 'bg-white border border-gray-200'"
        >
          <div class="text-xs opacity-75 mb-1">
            {{ message.role === 'user' ? 'You' : 'Assistant' }}
            <span v-if="message.isStreaming" class="ml-1">•••</span>
          </div>
          <div class="prose prose-sm max-w-none whitespace-pre-wrap">
            {{ message.content }}
          </div>
          <div class="text-xs opacity-50 mt-1">
            {{ formatTime(message.createdAt) }}
          </div>
        </div>
      </div>

      <div v-if="streaming" class="flex justify-start">
        <div class="bg-white border border-gray-200 rounded-lg px-4 py-2">
          <div class="flex items-center space-x-2">
            <div class="animate-pulse">Thinking</div>
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessageStore } from '@/stores/message'

const messageStore = useMessageStore()
const { messages, loading, error, hasMessages, streaming } = storeToRefs(messageStore)

const messagesContainer = ref<HTMLElement | null>(null)

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(streaming, () => {
  scrollToBottom()
})
</script>
