<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { computed, onUnmounted, ref, watch } from 'vue'
import FileViewerModal from '~/components/modals/FileViewerModal.vue'
import { downloadMessageFile } from '~/services/messageService'
import { useUserStore } from '~/stores/useUserStore'
import type { Message } from '~/types/message'
import { simpleTrimStartEnd } from '~/utils/messageHelpers'

interface Props {
  message: Message
}

const emit = defineEmits<{
  edit: []
  delete: []
  react: [emoji: string]
}>()
const userStore = useUserStore()

const showReactions = ref(false)

const showFileModal = ref(false)

const toast = useToast()
const props = defineProps<Props>()

// --- HTML Sanitization Logic (Intact) ---
function sanitizeMessageHtml(html: string): string {
  const parser = new DOMParser()

  const doc = parser.parseFromString(html || '', 'text/html')

  const allowedTags = new Set(['A', 'P', 'BR', 'STRONG', 'EM', 'CODE', 'PRE', 'UL', 'OL', 'LI', 'BLOCKQUOTE'])

  function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      // FIXED: Preserve ALL original whitespace/spaces/tabs (user requirement)
      return escapeHtml(node.textContent || '')
    }
    if (!(node instanceof HTMLElement)) return ''
    const tagName = node.tagName.toUpperCase()

    const children = Array.from(node.childNodes).map(walk).join('')
    if (!allowedTags.has(tagName)) return children
    if (tagName === 'A') {
      const href = node.getAttribute('href') || ''
      if (!/^https?:\/\//i.test(href)) return children
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow" class="underline underline-offset-2">${children || escapeHtml(href)}</a>`
    }
    if (tagName === 'BR') return '<br>'
    const safeTag = tagName.toLowerCase()

    return `<${safeTag}>${children}</${safeTag}>`
  }
  // Preserve ALL internal whitespace (spaces/tabs preserved)
  const preservedContent = Array.from(doc.body.childNodes).map(walk).join('')
  return simpleTrimStartEnd(preservedContent)
}

const renderedContent = computed(() => {
  const result = sanitizeMessageHtml(props.message.content || props.message.message || '')
  console.log('[TRIM-DEBUG] MessageBubble - Raw:', props.message.content, '→ Rendered:', result)
  return result
})

// --- Expanded File Detection ---
const extension = computed(() => props.message.file_name?.split('.').pop()?.toLowerCase() || '')

const isImage = computed(() => {
  return props.message.file_mime?.startsWith('image/')
    || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'jif'].includes(extension.value)
})

const isAudioAttachment = computed(() => {
  return props.message.file_mime?.startsWith('audio/')
    || ['wav', 'mp3', 'm4a', 'ogg', 'webm'].includes(extension.value)
})

const isVideo = computed(() => {
  return props.message.file_mime?.startsWith('video/') || extension.value === 'mp4'
})

const isPDF = computed(() => {
  return props.message.file_mime === 'application/pdf' || extension.value === 'pdf'
})

// Determine if the modal should attempt to fetch a Blob URL for previewing
const canPreview = computed(() => isImage.value || isVideo.value || isPDF.value || isAudioAttachment.value)

// --- Auth & Ownership ---
const isOwn = computed(() => {
  const currentUserId = userStore.user?.id || ((userStore.user as { _id?: string } | null)?._id)
  const senderRecord = props.message.sender as { _id?: string } | null
  const messageSenderId = props.message.sender_id || props.message.sender?.id || senderRecord?._id

  return messageSenderId === currentUserId
})

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '✨']
// const userReactionEmoji = computed(() => {
//   const userReaction = props.message.reactions_summary.find(r => r.reacted_by_me)
//
//   return userReaction?.emoji || null
// })

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatScheduledTime(date: string) {
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Read status indicator
const hasBeenRead = computed(() => props.message.read_by_count > 0)

// --- Authorized Fetching Logic for All Preview Types ---
const imageUrl = ref<string | null>(null)
const isLoadingFile = ref(false)

watch(() => props.message, async (newMsg) => {
  // Trigger fetch if the file type supports preview and we don't have a URL yet
  if (canPreview.value && !imageUrl.value) {
    isLoadingFile.value = true
    try {
      const workspaceId = newMsg.workspace_id

      const filename = newMsg.file_name

      const path = newMsg.file_path || (workspaceId && filename ? `workspaces/${workspaceId}/messages/${filename}` : '')

      if (path) {
        const response = await downloadMessageFile(path)
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || newMsg.file_mime
        })
        imageUrl.value = URL.createObjectURL(blob)
        console.log('[MessageBubble] Preview ready for:', filename)
      }
    } catch (e) {
      console.error('[MessageBubble] Failed to fetch preview data:', e)
    } finally {
      isLoadingFile.value = false
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (imageUrl.value && !props.message.file_download_url && !showFileModal.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
})

function openPreview() {
  if (imageUrl.value || !canPreview.value) {
    showFileModal.value = true
  } else if (isLoadingFile.value) {
    toast.add({ title: 'Downloading preview...', color: 'neutral' })
  }
}

async function handleDownload() {
  const workspaceId = props.message.workspace_id

  const filename = props.message.file_name

  const path = props.message.file_path || (workspaceId && filename ? `workspaces/${workspaceId}/messages/${filename}` : '')

  if (!path) return
  try {
    const response = await downloadMessageFile(path)
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    const downloadUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = downloadUrl

    link.download = filename || 'attachment'

    link.click()

    URL.revokeObjectURL(downloadUrl)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unable to download file'
    toast.add({ title: errMsg, color: 'error' })
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
      <div
        v-if="showReactions"
        :class="['absolute bottom-full mb-2 flex whitespace-nowrap overflow-x-auto gap-2 p-3 bg-[var(--ui-bg-elevated)] rounded-lg border border-[var(--ui-border)] shadow-lg z-10', isOwn ? 'right-0' : 'left-0']"
      >
        <button
          v-for="emoji in emojis"
          :key="emoji"
          class="text-lg hover:scale-125 transition-all"
          @click="emit('react', emoji); showReactions = false"
        >
          {{ emoji }}
        </button>
      </div>

      <div :class="['flex items-center gap-2 text-[11px]', isOwn ? 'flex-row-reverse' : 'flex-row']">
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ message.sender?.name || 'Unknown' }}</span>

        <span class="text-[var(--ui-text-dimmed)]">{{ formatTime(message.created_at) }}</span>

        <!-- Read status indicator for own messages - WhatsApp style -->
        <div
          v-if="isOwn"
          :title="hasBeenRead ? 'Seen by other users' : 'Not yet seen'"
          class="flex items-center -space-x-1.5"
        >
          <UIcon
            name="i-mdi-check"
            :class="[
              'h-4 w-4 transition-colors duration-300',
              hasBeenRead ? 'text-blue-500' : 'text-gray-400'
            ]"
          />
          <UIcon
            name="i-mdi-check"
            :class="[
              'h-4 w-4 transition-colors duration-300',
              hasBeenRead ? 'text-blue-500' : 'text-gray-400'
            ]"
          />
        </div>

        <!-- Unread indicator for messages from others -->
        <div
          v-else-if="!hasBeenRead"
          :title="'Unread message'"
          class="flex items-center"
        >
          <span class="h-2 w-2 rounded-full bg-[var(--ui-primary)]" />
        </div>
      </div>

      <div
        :class="[

          'max-w-[min(82vw,40rem)] rounded-[1.35rem] px-4 py-3 break-words shadow-[var(--shadow-sm)] transition-all duration-300',
          isOwn
            ? 'rounded-br-md bg-[linear-gradient(180deg,rgba(55,27,23,0.96),rgba(55,27,23,0.88))] text-white'
            : hasBeenRead
              ? 'rounded-bl-md border border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)]'
              : 'rounded-bl-md border-2 border-[var(--ui-primary)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] shadow-[0_0_12px_rgba(var(--color-primary-500),0.15)]'
        ]"
      >
        <div
          v-if="renderedContent"
          class="message-content text-sm leading-6 mb-2"
          v-html="renderedContent"
        />

        <div
          v-if="message.status === 'scheduled' && message.schedule_time"
          class="mt-2 text-[10px] opacity-70"
        >
          <UIcon
            name="i-lucide-calendar-clock"
            class="mr-1"
          /> Scheduled: {{ formatScheduledTime(message.schedule_time) }}
        </div>

        <div
          v-if="message.file_name"
          class="mt-3"
        >
          <div
            v-if="isImage"
            class="relative overflow-hidden rounded-xl bg-black/10 dark:bg-white/10 max-w-[280px] sm:max-w-sm"
          >
            <div
              v-if="isLoadingFile"
              class="flex h-32 w-48 items-center justify-center"
            >
              <UIcon
                name="i-lucide-loader"
                class="h-6 w-6 animate-spin opacity-50"
              />
            </div>
            <img
              v-else-if="imageUrl"
              :src="imageUrl"
              :alt="message.file_name"
              class="max-h-[320px] w-auto cursor-pointer"
              @click="openPreview"
            >
          </div>

          <button
            v-else
            type="button"
            class="flex w-fit items-center gap-3 rounded-xl border border-current border-opacity-20 bg-black/5 px-4 py-3 text-left transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            @click="openPreview"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-current bg-opacity-10">
              <UIcon
                :name="isPDF ? 'i-mdi-file-pdf-box' : isVideo ? 'i-mdi-video' : isAudioAttachment ? 'i-mdi-volume-high' : 'i-mdi-file-document-outline'"
                class="h-5 w-5"
              />
            </div>

            <div class="min-w-0 pr-2">
              <p class="truncate text-sm font-semibold max-w-[200px]">
                {{ message.file_name }}
              </p>

              <p class="text-[10px] uppercase tracking-wider opacity-70">
                Click to preview
              </p>
            </div>
          </button>
        </div>

        <div
          v-if="message.reactions_summary.length > 0"
          class="flex flex-wrap gap-1 mt-2"
        >
          <span
            v-for="reaction in message.reactions_summary"
            :key="reaction.emoji"
            class="px-1 py-0 rounded-full text-xs font-medium border border-[var(--ui-border)]"
          >
            {{ reaction.emoji }} {{ reaction.count }}
          </span>
        </div>
      </div>

      <div class="mt-1 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <UButton
          icon="i-mdi-emoticon-plus-outline"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="showReactions = !showReactions"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="emit('edit')"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-trash-can-outline"
          size="xs"
          color="error"
          variant="ghost"
          @click="emit('delete')"
        />
      </div>
    </div>
  </div>

  <FileViewerModal

    v-model:open="showFileModal"

    :file-name="message.file_name"

    :file-path="message.file_path"

    :file-mime="message.file_mime"

    :image-url="imageUrl"

    @download="handleDownload"
  />
</template>

<style scoped>
.message-content {
  white-space: pre-wrap; /* FIXED: Preserve ALL spaces/newlines */
}

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
  color: #15803d;
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
