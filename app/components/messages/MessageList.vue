<script setup lang="ts">

import { computed, nextTick, ref, watch } from 'vue'

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

  (e: 'message-sent', data: { content: string; file?: File; scheduledAt?: Date }): void

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

const toast = useToast()

const scrollThreshold = ref(100) // pixels from top to trigger loading more

const shouldAutoScroll = ref(true) // Flag to control auto-scrolling to bottom

const previousMessageCount = ref(0) // Track message count to detect new messages



const sortedMessages = computed(() => {

  const messages = messageStore.sortedMessages

  console.log('[MessageList] Computed sortedMessages:', {

    count: messages.length,

    messages: messages.map(m => ({ id: m.id, content: m.content?.slice(0, 30), sender: m.sender?.name }))

  })

  return messages

})



watch(

  [() => props.channelId, () => userStore.token],

  async ([newChannelId, token]) => {

    if (!token || !newChannelId) {

      return

    }



    const trimmed = newChannelId.trim()

    if (!trimmed) return



    console.log('[MessageList] Store ready with token:', token.slice(0, 20) + '...')



    console.log('[MessageList] Switching to channel:', trimmed)

    console.log('[MessageList] Clearing store and fetching messages')



    shouldAutoScroll.value = true // Reset when switching channels

    previousMessageCount.value = 0 // Reset message count tracker

    await messageStore.fetchMessages(trimmed)

    // Wait for DOM updates and then scroll to bottom with requestAnimationFrame

    await nextTick()

    // Double requestAnimationFrame ensures layout is fully calculated

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        scrollToBottom()

      })

    })

  },

  { immediate: true }

)



// New watcher to auto-scroll when messages are added (including new messages sent)

watch(

  () => sortedMessages.value.length,

  async (newLength, oldLength) => {

    if (newLength > oldLength && shouldAutoScroll.value) {

      console.log('[MessageList] New message detected, auto-scrolling to bottom', {

        oldLength,

        newLength,

        difference: newLength - oldLength

      })

     

      // Wait for DOM to update before scrolling

      await nextTick()

      requestAnimationFrame(() => {

        scrollToBottom()

      })

    }

  }

)



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



async function handleScroll() {

  if (!messagesContainer.value) return



  const scrollTop = messagesContainer.value.scrollTop



  // When user scrolls near the top, load more messages

  if (scrollTop < scrollThreshold.value && messageStore.hasMoreMessages && !messageStore.loadingMore) {

    console.log('[MessageList] User scrolled to top, loading more messages')

   

    // Disable auto-scroll when loading more messages

    shouldAutoScroll.value = false

   

    // Store current scroll state before loading more messages

    const scrollHeightBefore = messagesContainer.value.scrollHeight



    const result = await messageStore.loadMoreMessages()

   

    if (result.success) {

      // Wait for DOM update

      await nextTick()

     

      // Restore scroll position by adjusting for the new content

      requestAnimationFrame(() => {

        if (messagesContainer.value) {

          const scrollHeightAfter = messagesContainer.value.scrollHeight

          const heightDifference = scrollHeightAfter - scrollHeightBefore

          messagesContainer.value.scrollTop = scrollTop + heightDifference

          console.log('[MessageList] Scroll position restored:', {

            scrollTop,

            heightDifference,

            newScrollTop: scrollTop + heightDifference

          })

        }

      })

    }

  }

}



// Remove the unused ref

// const lastCalculatedScrollHeight = ref({ current: 0 })



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

  const result = await messageStore.addReaction(props.channelId, messageId, emoji)

 

  if (!result.success && result.error) {

    // Only show errors from actual API failures, not prevention errors

    toast.add({

      title: 'Reaction error',

      description: result.error,

      color: 'error'

    })

    return

  }

 

  emit('reaction-added', { messageId, emoji })

}



async function handleMessageSent(data: { content: string; file?: File }) {

  // Emit the message-sent event to parent component

  emit('message-sent', data)

 

  // Re-enable auto-scroll so the watcher will scroll when the message appears

  shouldAutoScroll.value = true

 

  console.log('[MessageList] Message sent, auto-scroll enabled. Watcher will handle scrolling when message is added to store.')

}

</script>



<template>

  <div class="flex flex-col h-full bg-[var(--ui-bg)] overflow-hidden">

    <!-- Messages Container (scrollable) -->

    <div

      ref="messagesContainer"

      class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"

      @scroll="handleScroll"

    >

      <!-- Load More Indicator -->

      <div v-if="messageStore.loadingMore" class="flex items-center justify-center py-4">

        <div class="text-center">

          <UIcon name="i-mdi-chevron-up" class="w-6 h-6 animate-bounce text-[var(--ui-primary)] mx-auto mb-2" />

          <p class="text-sm text-[var(--ui-text-muted)]">Loading earlier messages...</p>

        </div>

      </div>



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

        <div v-for="message in sortedMessages" :key="message.id" :data-message-id="message.id">

          <MessageBubble

            :message="message"

            @edit="startEdit(message)"

            @delete="confirmDelete(message.id)"

            @react="handleReaction(message.id, $event)"

          />

        </div>

      </template>

    </div>



    <!-- Message Composer (sticky at bottom) -->

    <div class="shrink-0 border-t border-[var(--ui-border)]">

      <RichMessageComposer @send="handleMessageSent" />

    </div>



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