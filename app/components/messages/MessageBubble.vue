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

/**
 * Strip HTML tags and convert HTML entities to plain text while preserving line breaks
 */
function stripHtmlTags(html: string): string {
  const temp = document.createElement('div')
  temp.innerHTML = html
  let text = temp.textContent || temp.innerText || ''
  // Preserve newlines but trim trailing whitespace
  text = text.trim()
  return text
}

/**
 * Get clean message content (plain text without HTML tags)
 */
const cleanContent = computed(() => stripHtmlTags(props.message.content))

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
  <div :class="['group flex gap-2.5 sm:gap-3', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-secondary)] text-[11px] font-bold text-white shadow-[var(--shadow-sm)]">
        {{ message.sender.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Message Content -->
    <div :class="['flex min-w-0 flex-col gap-1.5', isOwn ? 'items-end' : 'items-start']">
      <!-- Header -->
      <div :class="['flex items-center gap-2 text-[11px]', isOwn ? 'flex-row-reverse' : 'flex-row']">
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ message.sender.name }}</span>
        <span class="text-[var(--ui-text-dimmed)]">{{ formatTime(message.created_at) }}</span>
      </div>

      <!-- Message Bubble -->
      <div :class="[
        'max-w-[min(82vw,40rem)] rounded-[1.35rem] px-4 py-3 break-words shadow-[var(--shadow-sm)] transition-all duration-300',
        isOwn
          ? 'rounded-br-md bg-[linear-gradient(180deg,rgba(55,27,23,0.96),rgba(55,27,23,0.88))] text-white'
          : 'rounded-bl-md border border-[var(--ui-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))] text-[var(--ui-text)] dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(24,24,27,0.86))]'
      ]">
        <p class="whitespace-pre-wrap text-sm leading-6">
          {{ cleanContent }}
        </p>

        <!-- File Attachment -->
        <div v-if="message.file_name" class="mt-3 border-t border-current border-opacity-15 pt-3">
          <a
            v-if="message.file_download_url"
            :href="message.file_download_url"
            target="_blank"
            class="flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 dark:bg-white/5"
          >
            <UIcon name="i-mdi-file-download" class="w-4 h-4" />
            {{ message.file_name }}
          </a>

          <button
            v-else
            type="button"
            class="flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 dark:bg-white/5"
            @click="handleDownload"
          >
            <UIcon name="i-mdi-file-download" class="w-4 h-4" />
            {{ message.file_name }}
          </button>
        </div>

        <!-- Reactions Inside Bubble -->
        <div v-if="message.reactions_summary.length > 0" :class="['mt-3 flex flex-wrap gap-1.5', isOwn ? 'justify-end' : 'justify-start']">
          <button
            v-for="reaction in message.reactions_summary"
            :key="reaction.emoji"
            class="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
            :class="[
              isOwn
                ? 'border border-white/20 bg-white/15 hover:bg-white/25'
                : 'border border-[var(--ui-border)] bg-white/65 hover:bg-white/90 dark:bg-white/8 dark:hover:bg-white/14'
            ]"
            :title="`${reaction.reacted_by.length} reaction${reaction.reacted_by.length !== 1 ? 's' : ''}`"
          >
            {{ reaction.emoji }} {{ reaction.count }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-1 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <UButton
          icon="i-mdi-emoticon-plus-outline"
          size="xs"
          color="neutral"
          variant="ghost"
          class="cursor-pointer rounded-xl"
          @click="showReactions = !showReactions"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
          class="cursor-pointer rounded-xl"
          @click="$emit('edit')"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-trash-can-outline"
          size="xs"
          color="error"
          variant="ghost"
          class="cursor-pointer rounded-xl"
          @click="$emit('delete')"
        />
      </div>

      <!-- Emoji Picker -->
      <div v-if="showReactions" class="mt-2 flex flex-wrap gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-3 shadow-[var(--shadow-md)]">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          class="cursor-pointer rounded-xl p-1 text-lg transition-transform hover:scale-125 hover:bg-[var(--ui-bg)]"
          @click="$emit('react', emoji); showReactions = false"
          :title="`React with ${emoji}`"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
