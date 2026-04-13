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



const renderedContent = computed(() => sanitizeMessageHtml(props.message.content || props.message.message || ''))

const isAudioAttachment = computed(() => {

  if (props.message.file_mime?.startsWith('audio/')) return true

  return /\.(wav|mp3|m4a|ogg|webm)$/i.test(props.message.file_name || '')

})

const audioSource = computed(() => props.message.file_download_url || '')



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



watch(() => props.message, async (newMsg) => {

  if (isImage.value && !imageUrl.value) {

    isLoadingImage.value = true

    try {

      const workspaceId = newMsg.workspace_id

      const filename = newMsg.file_name

      const path = newMsg.file_path || (workspaceId && filename ? `workspaces/${workspaceId}/messages/${filename}` : '')



      if (path) {

        const response = await downloadMessageFile(path)

        const blob = new Blob([response.data], {

          type: response.headers['content-type'] || newMsg.file_mime || 'image/png'

        })

        imageUrl.value = URL.createObjectURL(blob)

      }

    } catch (e) {

      console.error('[MessageBubble] Failed to fetch image data for blob:', e)

    } finally {

      isLoadingImage.value = false

    }

  }

}, { immediate: true })



onUnmounted(() => {

  if (imageUrl.value && !props.message.file_download_url && !showFileModal.value) {

     URL.revokeObjectURL(imageUrl.value)

  }

})



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

        <div v-if="renderedContent" class="message-content text-sm leading-6 mb-2" v-html="renderedContent" />



        <div v-if="isImage" class="relative mt-2 mb-2 inline-block overflow-hidden rounded-xl bg-black/10 dark:bg-white/10 max-w-[280px] sm:max-w-sm">

          <div v-if="isLoadingImage" class="flex h-32 w-48 items-center justify-center">

            <UIcon name="i-lucide-loader" class="h-6 w-6 animate-spin opacity-50" />

          </div>

          <img

            v-else-if="imageUrl"

            :src="imageUrl"

            :alt="message.file_name"

            class="max-h-[320px] w-auto rounded-lg object-contain cursor-pointer transition-transform duration-300 hover:scale-[1.02] block"

            @click="openPreview"

            :title="`Click to preview ${message.file_name}`"

          />

        </div>



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



        <div v-if="message.file_name && !isImage" class="mt-3 border-t border-current border-opacity-15 pt-3">

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



  <FileViewerModal

    v-model:open="showFileModal"

    :file-name="message.file_name"

    :file-path="message.file_path"

    :file-mime="message.file_mime"

    :image-url="imageUrl"

    @download="handleDownload"

  />

</template>