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
const customChannelId = ref('')

// Auto-open the chat area when channels finish loading and a current channel becomes available.
watch(
  () => channelStore.currentChannelId,
  (channelId) => {
    if (channelId) {
      showMessaging.value = true
      customChannelId.value = channelId
    }
  }
)

async function loadCustomChannel() {
  const trimmed = customChannelId.value.trim()
  if (!trimmed) return
  channelStore.setCurrentChannel(trimmed)
  showMessaging.value = true
  await messageStore.fetchMessages(trimmed)
}

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
  <div class="flex h-full w-full flex-col overflow-hidden">
    <div
      v-if="showMessaging && channelStore.currentChannelId"
      class="flex h-full w-full flex-col overflow-hidden"
    >
      <div class="border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-6 py-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-[var(--ui-text-highlighted)]">
              # {{ channelStore.currentChannel?.name || channelStore.currentChannelId }}
            </h2>
            <p class="text-sm text-[var(--ui-text-muted)]">
              {{ messageStore.unreadCount }} unread message{{ messageStore.unreadCount !== 1 ? 's' : '' }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UInput v-model="customChannelId" placeholder="Paste channel_id" class="w-64" />
            <BaseButton label="Load" color="primary" :disabled="!customChannelId.trim()" @click="loadCustomChannel" />
          </div>
        </div>
      </div>

      <MessageList
        :channel-id="channelStore.currentChannelId"
        :loading="messageStore.loading"
        @message-sent="handleMessageSent"
        @message-edited="handleMessageEdited"
      />
    </div>

    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center"
    >
      <div class="text-center">
        <UIcon name="i-mdi-chat-outline" class="mx-auto mb-4 h-16 w-16 text-[var(--ui-text-dimmed)]" />
        <p class="text-[var(--ui-text-muted)]">Select a channel from the sidebar to open messages</p>

        <div class="mt-4 flex items-center justify-center gap-3">
          <UInput v-model="customChannelId" placeholder="Or paste channel_id" class="w-72" />
          <BaseButton label="Load" color="primary" :disabled="!customChannelId.trim()" @click="loadCustomChannel" />
        </div>
      </div>
    </div>
  </div>
</template>
