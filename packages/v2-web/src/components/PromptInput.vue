<template>
  <div class="border-t border-gray-200 bg-white p-4">
    <form @submit.prevent="handleSubmit" class="flex space-x-2">
      <textarea
        v-model="input"
        ref="textareaRef"
        rows="1"
        placeholder="Type your message..."
        class="input flex-1 resize-none"
        :disabled="disabled || streaming"
        @keydown.enter.exact.prevent="handleSubmit"
        @input="autoResize"
      />
      <button
        type="submit"
        class="btn btn-primary self-end"
        :disabled="!canSend"
      >
        <span v-if="streaming">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
        <span v-else>Send</span>
      </button>
    </form>
    <div v-if="error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessageStore } from '@/stores/message'

const props = defineProps<{
  sessionId: string
  disabled?: boolean
}>()

const messageStore = useMessageStore()
const { streaming, error } = storeToRefs(messageStore)

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => 
  input.value.trim().length > 0 && !props.disabled && !streaming.value
)

async function handleSubmit() {
  if (!canSend.value) return

  const content = input.value
  input.value = ''
  
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  try {
    await messageStore.sendMessage(props.sessionId, content)
  } catch (e) {
    console.error('Failed to send message:', e)
  }
}

function autoResize() {
  const textarea = textareaRef.value
  if (!textarea) return
  
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
}
</script>
