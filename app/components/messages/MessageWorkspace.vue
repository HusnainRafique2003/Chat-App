<script setup lang="ts">
import { ref } from 'vue'
import MessageList from './MessageList.vue'
import { useMessageStore } from '~/stores/useMessageStore'

const messageStore = useMessageStore()
const channelId = ref('')
const toast = useToast()

async function loadMessages() {
  const trimmed = channelId.value.trim()
  if (!trimmed) return

  const result = await messageStore.fetchMessages(trimmed)
  if (!result.success && result.error) {
    toast.add({ title: result.error, color: 'error' })
  }
}

async function handleMessageSent(data: { content: string; file?: File }) {
  const trimmed = channelId.value.trim()
  if (!trimmed) return
  const result = await messageStore.createMessage(trimmed, data.content, data.file)
  if (!result.success && result.error) toast.add({ title: result.error, color: 'error' })
}

async function handleMessageEdited(data: { messageId: string; content: string; file?: File }) {
  const trimmed = channelId.value.trim()
  if (!trimmed) return
  const result = await messageStore.updateMessage(trimmed, data.messageId, data.content, data.file)
  if (!result.success && result.error) toast.add({ title: result.error, color: 'error' })
}
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)]">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">Message workspace</p>
          <h2 class="mt-2 text-2xl font-black text-[var(--ui-text-highlighted)]">Channel messages CRUD</h2>
          <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
            Paste a channel ID to load messages and edit/delete them.
          </p>
        </div>

        <div class="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
          <UInput v-model="channelId" placeholder="Enter channel ID (ObjectId)" class="w-full" />
          <BaseButton label="Load Messages" color="primary" :loading="messageStore.loading" @click="loadMessages" />
        </div>
      </div>
    </section>

    <section v-if="channelId.trim()" class="flex-1 overflow-hidden rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-[var(--shadow-md)]">
      <MessageList
        :channel-id="channelId"
        :loading="messageStore.loading"
        @message-sent="handleMessageSent"
        @message-edited="handleMessageEdited"
      />
    </section>

    <section v-else class="flex flex-1 items-center justify-center rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-[var(--shadow-md)]">
      <div class="text-center">
        <UIcon name="i-mdi-chat-outline" class="w-16 h-16 text-[var(--ui-text-dimmed)] mx-auto mb-4" />
        <p class="text-[var(--ui-text-muted)]">Enter a channel ID to load messages.</p>
      </div>
    </section>
  </div>
</template>
