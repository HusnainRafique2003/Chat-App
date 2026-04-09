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

function sanitizeMessageHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  const allowedTags = new Set(['A', 'P', 'BR', 'STRONG', 'EM', 'CODE', 'PRE', 'UL', 'OL', 'LI', 'BLOCKQUOTE'])

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || '')
    }

    if (!(node instanceof HTMLElement)) {
      return ''
    }

    const tagName = node.tagName.toUpperCase()
    const children = Array.from(node.childNodes).map(walk).join('')

    if (!allowedTags.has(tagName)) {
      return children
    }

    if (tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (!/^https?:\/\//i.test(href)) {
        return children
      }

      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow" class="underline underline-offset-2">${children || escapeHtml(href)}</a>`
    }

    if (tagName === 'BR') {
      return '<br>'
    }

    const safeTag = tagName.toLowerCase()
    return `<${safeTag}>${children}</${safeTag}>`
  }

  return Array.from(doc.body.childNodes).map(walk).join('').trim()
}

const renderedContent = computed(() => sanitizeMessageHtml(props.message.content))
const isAudioAttachment = computed(() => {
  if (props.message.file_mime?.startsWith('audio/')) return true
  return /\.(wav|mp3|m4a|ogg|webm)$/i.test(props.message.file_name || '')
})
const audioSource = computed(() => props.message.file_download_url || '')

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

function formatScheduledTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
          ? 'rounded-br-md border border-[rgba(217,196,168,0.95)] bg-[linear-gradient(180deg,rgba(248,241,232,0.98),rgba(238,224,205,0.96))] text-[rgb(82,59,38)] shadow-[0_12px_32px_-18px_rgba(120,85,45,0.28)]'
          : 'rounded-bl-md border border-[var(--ui-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))] text-[var(--ui-text)] dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(24,24,27,0.86))]'
      ]">
        <div class="message-content text-sm leading-6" v-html="renderedContent" />

        <div
          v-if="message.status === 'scheduled' && message.schedule_time"
          :class="[
            'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
            isOwn
              ? 'bg-[rgba(255,248,240,0.9)] text-[rgb(112,82,54)]'
              : 'border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]'
          ]"
        >
          <UIcon name="i-lucide-calendar-clock" class="h-3.5 w-3.5" />
          Scheduled for {{ formatScheduledTime(message.schedule_time) }}
        </div>

        <!-- File Attachment -->
        <div v-if="message.file_name" class="mt-3 border-t border-current border-opacity-15 pt-3">
          <div
            v-if="isAudioAttachment && audioSource"
            class="rounded-2xl bg-black/5 p-3 dark:bg-white/5"
          >
            <audio
              :src="audioSource"
              controls
              preload="metadata"
              class="w-full max-w-xs"
            />
            <p class="mt-2 text-xs font-medium opacity-80">
              {{ message.file_name }}
            </p>
          </div>

          <a
            v-else-if="message.file_download_url"
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

<style scoped>
.message-content :deep(p) {
  margin: 0;
}

.message-content :deep(p + p) {
  margin-top: 0.65rem;
}

.message-content :deep(a) {
  font-weight: 600;
}

.message-content :deep(strong em),
.message-content :deep(em strong) {
  font-style: italic;
  font-weight: 800;
  color: var(--ui-primary);
}

.message-content :deep(code) {
  border: 1px solid color-mix(in srgb, var(--ui-border) 75%, transparent);
  background: color-mix(in srgb, var(--ui-bg-elevated) 88%, transparent);
  border-radius: 0.55rem;
  padding: 0.15rem 0.4rem;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.82em;
}

.message-content :deep(pre) {
  position: relative;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--ui-border) 80%, transparent);
  background: #101827;
  color: #e5eefc;
  border-radius: 1rem;
  margin-top: 0.85rem;
  padding: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.message-content :deep(pre code) {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre;
  display: block;
}

.message-content :deep(pre)::before {
  content: "Code";
  display: inline-flex;
  align-items: center;
  margin-bottom: 0.75rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
  padding: 0.18rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
