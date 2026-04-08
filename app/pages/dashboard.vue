<script setup lang="ts">
import { ref, watch } from 'vue'
import MessageList from '~/components/messages/MessageList.vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useMessageStore } from '~/stores/useMessageStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: 'dashboard'
})

const userStore = useUserStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const messageStore = useMessageStore()

const showMessaging = ref(false)

// Auto-open the chat area when channels finish loading and a current channel becomes available.
watch(
  () => channelStore.currentChannelId,
  (channelId) => {
    if (channelId) {
      showMessaging.value = true
    }
  }
)

async function handleMessageSent(data: { content: string; file?: File }) {
  if (!channelStore.currentChannelId) return

  const result = await messageStore.createMessage(
    channelStore.currentChannelId,
    data.content,
    data.file
  )

  if (!result.success) {
    console.error('Failed to send message:', result.error)
  }
}

async function handleMessageEdited(data: { messageId: string; content: string; file?: File }) {
  if (!channelStore.currentChannelId) return

  const result = await messageStore.updateMessage(
    channelStore.currentChannelId,
    data.messageId,
    data.content,
    data.file
  )

  if (!result.success) {
    console.error('Failed to edit message:', result.error)
  }
}
</script>

<template>
  <!-- AppSidebar is already rendered by `layouts/dashboard.vue`. This page renders only the chat area. -->
  <div class="h-full w-full flex flex-col overflow-hidden">
    <!-- Chat Messages Area -->
    <div
      v-if="showMessaging && channelStore.currentChannelId"
      class="flex h-full w-full flex-col overflow-hidden"
    >
      <!-- Messages List (takes remaining space with overflow) -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <MessageList
          :channel-id="channelStore.currentChannelId"
          :loading="messageStore.loading"
          @message-sent="handleMessageSent"
          @message-edited="handleMessageEdited"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center"
    >
      <div class="text-center">
        <UIcon name="i-mdi-chat-outline" class="mx-auto mb-4 h-16 w-16 text-[var(--ui-text-dimmed)]" />
        <p class="text-[var(--ui-text-muted)]">Select a channel from the sidebar to open messages</p>
      </div>
    </div>
  </div>
</template>
