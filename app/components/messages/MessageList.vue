<script setup lang="ts">
import type { Message } from '~/composables/useMessagesApi'
import { useMessageStore } from '~/stores/useMessageStore'
import RichMessageComposer from './RichMessageComposer.vue'

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
const messagesContainer = ref<HTMLElement>()
const editingId = ref<string | null>(null)
const editContent = ref('')
const showDeleteConfirm = ref<string | null>(null)

const sortedMessages = computed(() => messageStore.sortedMessages)

watch(() => props.channelId, async (newChannelId) => {
  if (newChannelId) {
    const trimmed = newChannelId.trim()
    if (!trimmed) return
    await messageStore.fetchMessages(trimmed)
    scrollToBottom()
  }
}, { immediate: true })

watch(() => sortedMessages.value.length, () => {
  nextTick(() => scrollToBottom())
})

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function startEdit(message: Message) {
  editingId.value = message.id
  editContent.value = message.content
}

function cancelEdit() {
  editingId.value = null
  editContent.value = ''
}

function confirmDelete(messageId: string) {
  showDeleteConfirm.value = messageId
}

function cancelDelete() {
  showDeleteConfirm.value = null
}

async function handleDeleteMessage(messageId: string) {
  await messageStore.deleteMessage(props.channelId, messageId)
  showDeleteConfirm.value = null
  emit('message-deleted', messageId)
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
        <div v-for="message in sortedMessages" :key="message.id" class="group">
          <!-- Delete Confirmation -->
          <div v-if="showDeleteConfirm === message.id" class="mb-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-900 dark:text-red-100 mb-2">Delete this message?</p>
            <div class="flex gap-2">
              <UButton
                size="xs"
                color="red"
                @click="handleDeleteMessage(message.id)"
              >
                Delete
              </UButton>
              <UButton
                size="xs"
                color="gray"
                variant="soft"
                @click="cancelDelete"
              >
                Cancel
              </UButton>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else-if="editingId === message.id" class="mb-2 p-3 bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)]">
            <textarea
              v-model="editContent"
              class="w-full px-3 py-2 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)] text-[var(--ui-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] resize-none"
              rows="2"
            />
            <div class="flex gap-2 mt-2">
              <UButton
                size="xs"
             color="primary"
                @click="$emit('message-edited', { messageId: message.id, content: editContent }); cancelEdit()"
              >
                Save
              </UButton>
              <UButton
                size="xs"
                color="gray"
                variant="soft"
                @click="cancelEdit"
              >
                Cancel
              </UButton>
            </div>
          </div>

          <!-- Message Display -->
          <MessageBubble
            v-else
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
  </div>
</template>
