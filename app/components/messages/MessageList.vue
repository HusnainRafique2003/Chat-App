<script setup lang="ts">
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue'
import type { Message } from '~/composables/useMessagesApi'
import { useMessageStore } from '~/stores/useMessageStore'
import { useUserStore } from '~/stores/useUserStore'
import { useToast } from '#ui/composables/useToast'
import MessageBubble from './MessageBubble.vue'
import RichMessageComposer from './RichMessageComposer.vue'
import EditMessageModal from '../modals/EditMessageModal.vue'
import MessageDeleteModal from '../modals/MessageDeleteModal.vue'

interface Props {
 channelId: string
  loading?: boolean
}

interface Emits {
  (e: 'message-sent', data: { content: string; file?: File }): void
  (e: 'message-deleted', messageId: string): void
  (e: 'message-edited', data: { messageId: string; content: string; file?: File }): void
  (e: 'reaction-added', data: { messageId: string; emoji: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

const messageStore = useMessageStore()
const userStore = useUserStore()
const messagesContainer = ref<HTMLElement>()
const editingMessage = ref<Message | null>(null)
const showEditModal = ref(false)
const deletingMessageId = ref<string | null>(null)
const showDeleteModal = ref(false)
const storeReady = ref(false)
const toast = useToast()

const sortedMessages = computed(() => {
  const messages = messageStore.sortedMessages
  console.log('[MessageList] Computed sortedMessages:', {
    count: messages.length,
    messages: messages.map(m => ({ id: m.id, content: m.content?.slice(0, 30), sender: m.sender?.name }))
  })
  return messages
})

// Ensure store is hydrated from localStorage before fetching
onBeforeMount(async () => {
  // Pinia persisted state should be available
  if (userStore.token) {
    console.log('[MessageList] Store ready with token:', userStore.token.slice(0, 20) + '...')
    storeReady.value = true
  } else {
    console.warn('[MessageList] No token found in store after mount')
  }
})

watch(() => props.channelId, async (newChannelId) => {
  if (!storeReady.value) {
    console.warn('[MessageList] Store not ready yet, waiting for token...')
    return
  }

  if (newChannelId) {
    const trimmed = newChannelId.trim()
    if (!trimmed) return
    
    // Reset UI state when switching channels
    editingMessage.value = null
    showEditModal.value = false
    deletingMessageId.value = null
    showDeleteModal.value = false
    
    console.log('[MessageList] Switching to channel:', trimmed)
    console.log('[MessageList] Clearing store and fetching messages')
    
    await messageStore.fetchMessages(trimmed)
    // Wait for DOM updates and then scroll to bottom with requestAnimationFrame
    await nextTick()
    // Double requestAnimationFrame ensures layout is fully calculated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    })
  }
}, { immediate: true })

watch(() => sortedMessages.value.length, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      scrollToBottom()
    })
  })
})

function scrollToBottom() {
  if (messagesContainer.value) {
    // Use requestAnimationFrame to ensure layout is complete before scrolling
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}

function startEdit(message: Message) {
  editingMessage.value = message
  showEditModal.value = true
}

function cancelEdit() {
  editingMessage.value = null
  showEditModal.value = false
}

async function handleSaveEdit(content: string) {
  if (!editingMessage.value) return
  
  const messageId = editingMessage.value.id
  const result = await messageStore.updateMessage(props.channelId, messageId, content)
  
  if (result.success) {
    cancelEdit()
    emit('message-edited', { messageId, content })
    toast.add({
      title: 'Message updated successfully',
      color: 'success'
    })
  } else {
    toast.add({
      title: result.error || 'Failed to update message',
      color: 'error'
    })
    // Keep modal open so user can retry
    if (editingMessage.value) {
      showEditModal.value = true
    }
  }
}

function confirmDelete(messageId: string) {
  deletingMessageId.value = messageId
  showDeleteModal.value = true
}

function cancelDelete() {
  deletingMessageId.value = null
  showDeleteModal.value = false
}

async function handleDeleteMessage() {
  if (!deletingMessageId.value) return
  
  const messageId = deletingMessageId.value
  const result = await messageStore.deleteMessage(props.channelId, messageId)
  
  if (result.success) {
    emit('message-deleted', messageId)
    toast.add({
      title: 'Message deleted successfully',
      color: 'success'
    })
  } else {
    toast.add({
      title: result.error || 'Failed to delete message',
      color: 'error'
    })
    // Keep modal open so user can retry
    showDeleteModal.value = true
  }
  
  cancelDelete()
}

async function handleReaction(messageId: string, emoji: string) {
  await messageStore.addReaction(props.channelId, messageId, emoji)
  emit('reaction-added', { messageId, emoji })
}
</script>

<template>
  <div class="flex flex-col h-full bg-[var(--ui-bg)]">
    <!-- Messages Container -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <UIcon name="i-mdi-loading" class="w-8 h-8 animate-spin text-[var(--ui-primary)] mx-auto mb-2" />
          <p class="text-[var(--ui-text-muted)]">Loading messages...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="sortedMessages.length === 0" class="flex items-center justify-center h-full">
        <div class="text-center">
          <UIcon name="i-mdi-chat-outline" class="w-12 h-12 text-[var(--ui-text-dimmed)] mx-auto mb-3" />
          <p class="text-[var(--ui-text-muted)]">No messages yet. Start the conversation!</p>
        </div>
      </div>

      <!-- Messages -->
      <template v-else>
        <div v-for="message in sortedMessages" :key="message.id">
          <MessageBubble
            :message="message"
            @edit="startEdit(message)"
            @delete="confirmDelete(message.id)"
            @react="handleReaction(message.id, $event)"
          />
        </div>
      </template>
    </div>

    <!-- Message Composer -->
    <RichMessageComposer @send="$emit('message-sent', $event)" />

    <!-- Edit Message Modal -->
    <EditMessageModal
      v-model:open="showEditModal"
      :message="editingMessage || undefined"
      @confirm="handleSaveEdit"
      @cancel="cancelEdit"
    />

    <!-- Delete Message Modal -->
    <MessageDeleteModal
      v-model:open="showDeleteModal"
      @confirm="handleDeleteMessage"
      @cancel="cancelDelete"
    />
  </div>
</template>
