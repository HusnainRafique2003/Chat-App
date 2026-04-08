<script setup lang="ts">
import { downloadMessageFile } from '~/composables/useMessagesApi'
import type { Message } from '~/composables/useMessagesApi'
import { useUserStore } from '~/stores/useUserStore'

interface Props {
  message: Message
}

interface Emits {
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'react', emoji: string): void
}

defineEmits<Emits>()

const userStore = useUserStore()
const showReactions = ref(false)
const showMenu = ref(false)
const toast = useToast()

const props = defineProps<Props>()
const isOwn = computed(() => props.message.sender_id === userStore.user?.id)

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '✨']

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function handleDownload() {
  // Backend doc: GET /download?path=workspaces/{workspace_id}/messages/{filename}
  const workspaceId = props.message.workspace_id
  const filename = props.message.file_name
  const fallbackPath = workspaceId && filename
    ? `workspaces/${workspaceId}/messages/${filename}`
    : ''

  const path = props.message.file_path || fallbackPath
  if (!path) return

  try {
    const response = await downloadMessageFile(path)
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream'
    })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'attachment'
    link.click()
    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    toast.add({
      title: error instanceof Error ? error.message : 'Unable to download file',
      color: 'error'
    })
  }
}
</script>

<template>
  <div :class="['flex gap-3 group', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-secondary)] flex items-center justify-center text-xs font-bold text-white">
        {{ message.sender.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Message Content -->
    <div :class="['flex flex-col gap-1', isOwn ? 'items-end' : 'items-start']">
      <!-- Header -->
      <div :class="['flex items-center gap-2 text-xs', isOwn ? 'flex-row-reverse' : 'flex-row']">
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ message.sender.name }}</span>
        <span class="text-[var(--ui-text-dimmed)]">{{ formatTime(message.created_at) }}</span>
      </div>

      <!-- Message Bubble -->
      <div :class="[
        'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl break-words',
        isOwn
          ? 'bg-[var(--ui-primary)] text-white rounded-br-none'
          : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] rounded-bl-none'
      ]">
        <p
          class="text-sm leading-relaxed"
          v-html="message.content"
        />

        <!-- File Attachment -->
        <div v-if="message.file_name" class="mt-2 pt-2 border-t border-current border-opacity-20">
          <a
            v-if="message.file_download_url"
            :href="message.file_download_url"
            target="_blank"
            class="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
          >
            <UIcon name="i-mdi-file-download" class="w-4 h-4" />
            {{ message.file_name }}
          </a>

          <button
            v-else
            type="button"
            class="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
            @click="handleDownload"
          >
            <UIcon name="i-mdi-file-download" class="w-4 h-4" />
            {{ message.file_name }}
          </button>
        </div>

        <!-- Reactions Inside Bubble -->
        <div v-if="message.reactions_summary.length > 0" :class="['flex flex-wrap gap-1 mt-2', isOwn ? 'justify-end' : 'justify-start']">
          <button
            v-for="reaction in message.reactions_summary"
            :key="reaction.emoji"
            class="px-2 py-1 rounded-full text-xs transition-colors cursor-pointer"
            :class="[
              isOwn
                ? 'bg-white bg-opacity-20 hover:bg-opacity-30 border border-white border-opacity-30'
                : 'bg-white bg-opacity-50 hover:bg-opacity-70 border border-[var(--ui-border)]'
            ]"
            :title="`${reaction.reacted_by.length} reaction${reaction.reacted_by.length !== 1 ? 's' : ''}`"
          >
            {{ reaction.emoji }} {{ reaction.count }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <UButton
          icon="i-mdi-emoticon-plus-outline"
          size="xs"
          color="gray"
          variant="ghost"
          class="cursor-pointer"
          @click="showReactions = !showReactions"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-pencil"
          size="xs"
          color="gray"
          variant="ghost"
          class="cursor-pointer"
          @click="$emit('edit')"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-trash-can-outline"
          size="xs"
          color="red"
          variant="ghost"
          class="cursor-pointer"
          @click="$emit('delete')"
        />
      </div>

      <!-- Emoji Picker -->
      <div v-if="showReactions" class="flex flex-wrap gap-2 mt-2 p-3 bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)] shadow-lg">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          class="text-lg hover:scale-125 transition-transform cursor-pointer"
          @click="$emit('react', emoji); showReactions = false"
          :title="`React with ${emoji}`"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
