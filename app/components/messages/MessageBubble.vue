<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { downloadMessageFile } from '~/composables/useMessagesApi'
import type { Message } from '~/composables/useMessagesApi'
import { useUserStore } from '~/stores/useUserStore'
import { useToast } from '#ui/composables/useToast'
import FileViewerModal from '~/components/modals/FileViewerModal.vue'

interface Props {
  message: Message
}

interface Emits {
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'react', emoji: string): void
}

const emit = defineEmits<Emits>()

const userStore = useUserStore()
const showReactions = ref(false)
const showFileModal = ref(false) 
const toast = useToast()

const props = defineProps<Props>()

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
/**
 * FIXED COMPUTED PROPERTY
 * Handles both standard ID and MongoDB-style _id for comparison 
 */
const isOwn = computed(() => {
  const currentUserId = userStore.user?.id || (userStore.user as any)?._id;
  const messageSenderId = props.message.sender_id || props.message.sender?.id || (props.message.sender as any)?._id;
  return messageSenderId === currentUserId;
})

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '✨']

const userReactionEmoji = computed(() => {
  const userReaction = props.message.reactions_summary.find(r => r.reacted_by_me)
  return userReaction?.emoji || null
})

function stripHtmlTags(html: string): string {
  if (!html) return ''
  const temp = document.createElement('div')
  temp.innerHTML = html
  const text = temp.textContent || temp.innerText || ''
  return text.trim()
}

const cleanContent = computed(() => stripHtmlTags(props.message.content || ''))

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isImage = computed(() => {
  const mime = props.message.file_mime
  if (mime && mime.startsWith('image/')) return true

  const name = props.message.file_name
  if (name) {
    const ext = name.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')
  }
  return false
})

const imageUrl = ref<string | null>(null)
const isLoadingImage = ref(false)

/**
 * Image fetcher logic
 * Uses Blob URLs for secure local rendering of server-stored images [cite: 809, 810]
 */
 watch(() => props.message, async (newMsg) => {
  // If it's an image and we don't have a local blob yet
  if (isImage.value && !imageUrl.value) {
    isLoadingImage.value = true
    try {
      const workspaceId = newMsg.workspace_id
      const filename = newMsg.file_name
      // Generate the path exactly as the API expects it
      const path = newMsg.file_path || (workspaceId && filename ? `workspaces/${workspaceId}/messages/${filename}` : '')

      if (path) {
        // This call uses your axios interceptor to provide the required TOKEN
        const response = await downloadMessageFile(path) 
        
        // Convert the raw data into a local Blob URL the browser can render without headers
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || newMsg.file_mime || 'image/png'
        })
        imageUrl.value = URL.createObjectURL(blob) 
        
        console.log('[MessageBubble] Successfully created local Blob URL:', imageUrl.value)
      }
    } catch (e) {
      console.error('[MessageBubble] Failed to fetch image data for blob:', e)
    } finally {
      isLoadingImage.value = false
    }
  }
}, { immediate: true })
/**
 * Memory Management
 * Ensures Blob URLs are not revoked while the FileViewerModal is still using them
 */
onUnmounted(() => {
  if (imageUrl.value && !props.message.file_download_url && !showFileModal.value) {
     URL.revokeObjectURL(imageUrl.value)
  }
})

/**
 * Robust preview trigger
 * Allows opening the modal for non-image files to provide download options
 */
function openPreview() {
  if (imageUrl.value || !isImage.value) {
    showFileModal.value = true
  } else if (isImage.value && isLoadingImage.value) {
    toast.add({ title: 'Still processing image preview...', color: 'neutral' })
  }
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
  const workspaceId = props.message.workspace_id
  const filename = props.message.file_name
  const path = props.message.file_path || (workspaceId && filename ? `workspaces/${workspaceId}/messages/${filename}` : '')

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
  } catch (error: any) {
    toast.add({
      title: error.message || 'Unable to download file',
      color: 'error'
    })
  }
}
</script>

<template>
  <div :class="['group flex gap-2.5 sm:gap-3', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <div class="flex-shrink-0">
      <div class="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-secondary)] text-[11px] font-bold text-white shadow-[var(--shadow-sm)]">
        {{ message.sender?.name?.charAt(0).toUpperCase() || 'U' }}
      </div>
    </div>

    <div :class="['flex flex-col gap-1 relative', isOwn ? 'items-end' : 'items-start']">
      <div v-if="showReactions" :class="['absolute bottom-full mb-2 flex whitespace-nowrap overflow-x-auto gap-2 p-3 bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)] shadow-lg z-10', isOwn ? 'right-0' : 'left-0']">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          :class="[
            'text-lg hover:scale-125 transition-all cursor-pointer relative',
            userReactionEmoji === emoji ? 'scale-125 opacity-100' : 'opacity-75 hover:opacity-100'
          ]"
          :title="userReactionEmoji === emoji ? `Click to remove ${emoji}` : `React with ${emoji}`"
          @click="$emit('react', emoji); showReactions = false"
        >
          {{ emoji }}
          <div v-if="userReactionEmoji === emoji" class="absolute -top-1 -right-1 w-2 h-2 bg-[var(--ui-primary)] rounded-full"></div>
        </button>
      </div>

      <div :class="['flex items-center gap-2 text-[11px]', isOwn ? 'flex-row-reverse' : 'flex-row']">
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ message.sender?.name || 'Unknown' }}</span>
        <span class="text-[var(--ui-text-dimmed)]">{{ formatTime(message.created_at) }}</span>
      </div>

      <div :class="[
        'max-w-[min(82vw,40rem)] rounded-[1.35rem] px-4 py-3 break-words shadow-[var(--shadow-sm)] transition-all duration-300',
        isOwn
          ? 'rounded-br-md bg-[linear-gradient(180deg,rgba(55,27,23,0.96),rgba(55,27,23,0.88))] text-white'
          : 'rounded-bl-md border border-[var(--ui-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.78))] text-[var(--ui-text)] dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(24,24,27,0.86))]'
      ]">
        <div class="message-content text-sm leading-6" v-html="renderedContent" />

        <div
          v-if="message.status === 'scheduled' && message.schedule_time"
          :class="[
            'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
            isOwn
              ? 'bg-white/12 text-white/90'
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
            @click="openPreview"
            class="flex w-fit items-center gap-3 rounded-xl border border-current border-opacity-20 bg-black/5 px-4 py-3 text-left transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            :class="{ 'border-t border-current border-opacity-15 pt-3': cleanContent }"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-current bg-opacity-10">
              <UIcon name="i-mdi-file-document-outline" class="h-5 w-5" />
            </div>
            <div class="min-w-0 pr-2">
              <p class="truncate text-sm font-semibold max-w-[200px]">{{ message.file_name }}</p>
              <p class="text-[10px] uppercase tracking-wider opacity-70">Click to preview</p>
            </div>
          </button>
        </div>

        <div v-if="message.reactions_summary.length > 0" :class="['flex flex-wrap gap-1 mt-2', isOwn ? 'justify-end' : 'justify-start']">
          <span
            v-for="reaction in message.reactions_summary"
            :key="reaction.emoji"
            :class="[
              'px-1 py-0 rounded-full text-xs font-medium inline-flex items-center gap-0',
              isOwn
                ? 'bg-white bg-opacity-20 border border-white border-opacity-30'
                : 'bg-white bg-opacity-50 border border-[var(--ui-border)]',
              reaction.reacted_by_me && 'ring-1 ring-offset-0 ring-[var(--ui-primary)] font-bold'
            ]"
          >
            {{ reaction.emoji }} {{ reaction.count }}
            <span v-if="reaction.reacted_by_me" class="text-white opacity-75 ml-0.5">✓</span>
          </span>
        </div>
      </div>

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

  <FileViewerModal
    v-model:open="showFileModal"
    :file-name="message.file_name"
    :file-path="message.file_path"
    :file-mime="message.file_mime"
    :image-url="imageUrl"
    @download="handleDownload"
  />
</template>
