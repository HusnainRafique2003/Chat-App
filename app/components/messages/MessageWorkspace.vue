<script setup lang="ts">
import MessageBubble from './MessageBubble.vue'
import MessageComposer from './MessageComposer.vue'
import { downloadMessageFile } from '~/composables/useMessagesApi'
import { useMessageStore } from '~/stores/useMessageStore'
import { useUserStore } from '~/stores/useUserStore'

const messageStore = useMessageStore()
const userStore = useUserStore()
const toast = useToast()

const channelId = ref('general') // Default channel for demo
const search = ref('')
const editingMessageId = ref('')
const workspaceStore = useWorkspaceStore()
const currentWorkspaceName = computed(() => {
  const name = workspaceStore.currentWorkspace?.name
  return name ? name.trim() : 'Current Workspace'
})

const selectedMessage = computed(() => {
  return messageStore.messages.find(message => message.id === editingMessageId.value) || null
})

const visibleMessages = computed(() => {
  if ((search.value || '').trim()) {
    return searchItems.value
  }
  return messageStore.sortedMessages
})

const searchItems = computed(() => {
  return (search.value || '').trim() ? messageStore.searchResults : []
})

const activeChannelName = computed(() => {
  if (messageStore.currentChannelId) {
    return `#${(messageStore.currentChannelId || '').trim() || 'channel' }`
  }
  const channelName = visibleMessages.value[0]?.channel?.name || ''
  return `#${channelName.trim() || 'Select channel' }`
})

async function loadMessages() {
  const result = await messageStore.fetchMessages(channelId.value)

  if (!result.success && result.error) {
    toast.add({ title: result.error, color: 'error' })
  }
}

async function handleSearch() {
  const result = await messageStore.runSearch(search.value, { channel_id: channelId.value })

  if (!result.success && result.error) {
    toast.add({ title: result.error, color: 'error' })
  }
}

async function handleSend(payload: { html: string; text: string; file: File | null }) {
  const result = editingMessageId.value
    ? await messageStore.editMessage({
      channel_id: channelId.value,
      message_id: editingMessageId.value,
      message: payload.html,
      file: payload.file
    })
    : await messageStore.sendMessage({
      channel_id: channelId.value,
      message: payload.html,
      file: payload.file
    })

  if (!result.success && result.error) {
    toast.add({ title: result.error, color: 'error' })
    return
  }

  if (editingMessageId.value) {
    editingMessageId.value = ''
    toast.add({ title: 'Message updated', color: 'success' })
    return
  }

  toast.add({ title: 'Message sent', color: 'success' })
}

async function handleDelete(messageId: string) {
  const result = await messageStore.removeMessage({
    channel_id: channelId.value,
    message_id: messageId
  })

  if (!result.success && result.error) {
    toast.add({ title: result.error, color: 'error' })
    return
  }

  toast.add({ title: 'Message deleted', color: 'success' })
}

async function handleReact(messageId: string, emoji: string) {
  const result = await messageStore.react({
    channel_id: channelId.value,
    messageId,
    emoji
  })

  if (!result.success && result.error) {
    toast.add({ title: result.error, color: 'error' })
  }
}

function beginEditing(messageId: string) {
  editingMessageId.value = messageId
}

async function downloadAttachment(path: string) {
  try {
    const response = await downloadMessageFile(path)
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = path.split('/').pop() || 'attachment'
    link.click()
    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    toast.add({
      title: error instanceof Error ? error.message : 'Unable to download file',
      color: 'error'
    })
  }
}

watch([channelId, search], async () => {
  if (channelId.value) {
    await loadMessages()
  }
  if (!search.value.trim()) {
    messageStore.clearSearch()
  }
})

onMounted(async () => {
  if (channelId.value) {
    await loadMessages()
  }
})
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div class="space-y-6">
      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)]">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">Message workspace</p>
            <h2 class="mt-2 text-2xl font-black text-[var(--ui-text-highlighted)]">{{ currentWorkspaceName }}</h2>
            <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
              Active workspace context integrated.
            </p>
          </div>

          <div class="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <UInput v-model="channelId" placeholder="Enter channel ID" class="w-full" />
            <BaseButton label="Load Messages" color="primary" :loading="messageStore.loading" @click="loadMessages" />
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-[var(--shadow-md)]">
        <div class="border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/95 px-6 py-5 backdrop-blur-md">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]">
                <Icon name="i-mdi-pound" class="h-6 w-6" />
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-dimmed)]">Active channel</p>
                <h3 class="mt-1 text-2xl font-black text-[var(--ui-text-highlighted)]"># {{ activeChannelName }}</h3>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              {{ messageStore.sortedMessages.length ? `${messageStore.sortedMessages.length} messages loaded` : 'Enter channel ID to load live messages' }}
            </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <UBadge :label="editingMessageId ? 'Editing message' : 'Composing'" :color="editingMessageId ? 'warning' : 'success'" variant="soft" />
              <UBadge label="Rich Composer" color="secondary" variant="soft" />
            </div>
          </div>
        </div>

        <div v-if="messageStore.error" class="mx-6 mt-4 rounded-xl border border-[var(--ui-error)]/20 bg-[var(--ui-error)]/8 px-4 py-3 text-sm text-[var(--ui-error)]">
          {{ messageStore.error }}
        </div>

        <div class="grid min-h-[720px] grid-rows-[minmax(0,1fr)_auto]">
          <div class="chat-preview-surface overflow-auto px-6 py-6">
        <div v-if="visibleMessages.length === 0 && !messageStore.loading" class="mb-6 rounded-[1.5rem] border border-dashed border-[var(--ui-border-accented)] bg-[var(--ui-bg)]/75 px-5 py-4 text-sm text-[var(--ui-text-muted)]">
          Enter a channel ID above and click "Load Messages" to fetch live data from backend.
        </div>

            <div class="space-y-5">
              <MessageBubble
                v-for="message in visibleMessages"
                :key="message.id"
                :message="message"
                :own="message.sender_id === userStore.user?.id"
                :editing="editingMessageId === message.id"
                @react="handleReact(message.id, $event)"
                @edit="beginEditing(message.id)"
                @remove="handleDelete(message.id)"
                @download="downloadAttachment"
              />
            </div>
          </div>

          <div class="border-t border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/55 p-4">
            <MessageComposer
              :initial-content="selectedMessage?.content || ''"
              :loading="messageStore.sending"
              :submit-label="editingMessageId ? 'Update message' : 'Send message'"
              @send="handleSend"
            />
          </div>
        </div>
      </section>
    </div>

    <div class="space-y-6">
      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)]">
        <h3 class="text-xl font-black text-[var(--ui-text-highlighted)]">Channel details</h3>
        <div class="mt-4 space-y-3">
          <div class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/70 p-4">
            <p class="text-xs uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">Status</p>
            <p class="mt-2 font-semibold text-[var(--ui-text-highlighted)]">Preview mode</p>
          </div>
          <div class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/70 p-4">
            <p class="text-xs uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">Ready for</p>
            <p class="mt-2 text-sm leading-6 text-[var(--ui-text-muted)]">Channel switching, live messages, pagination, unread markers, and message threads.</p>
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)]">
        <h3 class="text-xl font-black text-[var(--ui-text-highlighted)]">Search messages</h3>
        <p class="mt-2 text-sm text-[var(--ui-text-muted)]">Search within the current channel or workspace.</p>

        <div class="mt-4 flex gap-3">
          <UInput v-model="search" placeholder="Search message text" class="w-full" />
          <BaseButton label="Search" color="secondary" :loading="messageStore.searching" @click="handleSearch" />
        </div>

        <div class="mt-5 space-y-3">
          <div v-if="(search.value || '').trim() && !searchItems.length && !messageStore.searching" class="rounded-[1.25rem] border border-dashed border-[var(--ui-border-accented)] bg-[var(--ui-bg-muted)]/70 px-4 py-5 text-sm text-[var(--ui-text-muted)]">
            No search results found.
          </div>

          <div
            v-for="item in searchItems"
            :key="item.id"
            class="rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/70 p-4"
          >
            <p class="font-semibold text-[var(--ui-text-highlighted)]">{{ item.sender?.name || 'Unknown sender' }}</p>
            <p class="mt-2 text-sm leading-6 text-[var(--ui-text-muted)]">{{ item.content.replace(/<[^>]+>/g, ' ') }}</p>
            <p class="mt-2 text-xs uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">{{ item.channel?.name || 'Channel' }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)]">
        <h3 class="text-xl font-black text-[var(--ui-text-highlighted)]">Integration notes</h3>
        <ul class="mt-4 space-y-3 text-sm leading-6 text-[var(--ui-text-muted)]">
          <li>Tiptap handles rich formatting and code blocks.</li>
          <li>Voice notes are uploaded as audio attachments through the same message API.</li>
          <li>Date inserts use a calendar input and drop a schedulable text marker into the editor.</li>
          <li>The channel ID input can later be replaced by your teammate&apos;s sidebar selection state.</li>
        </ul>
      </section>
    </div>
  </div>
</template>
