<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import { useChannelStore } from '~/stores/useChannelStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

interface Emits {
  (e: 'send', data: { content: string; file?: File; scheduledAt?: Date }): void
}

const props = defineProps<{
  initialContent?: string
  loading?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<Emits>()
const toast = useToast()

// ─── File ────────────────────────────────────────────────────────────────────
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (files?.[0]) selectedFile.value = files[0]
}

function removeFile() {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// ─── Editor ──────────────────────────────────────────────────────────────────
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({ 
      codeBlock: {},
      link: false // Exclude Link from StarterKit since we're adding it separately
    }),
    Placeholder.configure({ placeholder: 'Type a message… use / for commands' }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'composer-link' }
    })
  ]
})

function insertBold()      { editor.value?.chain().focus().toggleBold().run() }
function insertItalic()    { editor.value?.chain().focus().toggleItalic().run() }
function insertCodeBlock() { editor.value?.chain().focus().toggleCodeBlock().run() }
// ─── Emoji picker ───────────────────────────────────────────────────────────
const showEmojiPicker = ref(false)
const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😌', '😔', '😑', '😐', '😶', '🤐', '🤨', '🤔', '🤫', '🤥', '😲', '☹️', '🙁', '😮', '😯', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😻', '😸', '😹', '😺', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎', '👊', '👏', '🙌', '👐', '🫲', '🫳', '🤲', '🤝', '🤜', '🤛', '🦵', '🦶', '👂', '👃', '🧠', '🦷', '🦴', '🌹', '💐', '🌺', '🌻', '🌼', '🌷', '⭐', '🌟', '✨', '⚡', '🔥', '💥', '💫', '🎉', '🎊', '🎈', '🎁', '🏆', '🎯', '🎲', '🎮', '🎰', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎳', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '⛸️', '🎣', '🎽', '🎿', '🛷', '🛼', '🛹', '🛺', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🏎️', '🛵', '🦯', '🦽', '🦼', '🛴', '🚲', '🛴', '🛹', '🛺', '✈️', '🛩️', '🛫', '🛬', '🚀', '🛸', '💺', '🚁', '🛶', '⛵', '🚤', '🛳️', '🛲', '⛴️', '🛴', '🚧']

function insertEmoji(emoji: string) {
  if (!editor.value) return
  editor.value.chain().focus().insertContent(emoji).run()
  showEmojiPicker.value = false
}

// ─── Mention modal ───────────────────────────────────────────────────────────
const showMentionModal = ref(false)
const mentionUsers = ref<Array<{ id: string; name: string; avatar?: string }>>([])
const mentionLoading = ref(false)
const mentionError = ref<string | null>(null)

async function openMentionModal() {
  showMentionModal.value = true
  mentionError.value = null
  mentionLoading.value = true

  const fetchUserDetails = async (userId: string): Promise<string> => {
    try {
      const response = await axios.get(`/api/users/${userId}`)
      const userData = response.data?.data || response.data
      return userData?.name || userData?.username || userId
    } catch (error) {
      console.warn(`[Mention Modal] Could not fetch user ${userId}:`, error)
      return userId
    }
  }

  try {
    // Get current channel from store
    const channelStore = useChannelStore()
    const workspaceStore = useWorkspaceStore()
    const currentChannel = channelStore.currentChannel
    const currentWorkspace = workspaceStore.currentWorkspace

    console.log('[Mention Modal] Current channel:', currentChannel)

    if (currentChannel && currentChannel.members && currentChannel.members.length > 0) {
      // Create a mapping of user_id -> user name from workspace members
      const userNameMap: Record<string, string> = {}
      if (currentWorkspace && currentWorkspace.members && Array.isArray(currentWorkspace.members)) {
        currentWorkspace.members.forEach((member: any) => {
          const userId = member.id || member.user_id || ''
          const userName = member.name || userId
          if (userId) {
            userNameMap[userId] = userName
          }
        })
      }

      console.log('[Mention Modal] User name map:', userNameMap)

      // Map channel members and fetch missing user details
      const mappedMembers = currentChannel.members
        .map((member: any) => {
          const userId = member.user_id || member.id || ''
          const userName = userNameMap[userId] || userId || 'Unknown User'
          
          return {
            id: userId,
            name: userName,
            avatar: member.avatar,
            missing: !userNameMap[userId] && userId !== userName // Flag if user details are missing
          }
        })
        .filter(m => m.id)

      // Fetch missing user details in parallel
      const usersToFetch = mappedMembers.filter(m => m.missing).map(m => m.id)
      
      if (usersToFetch.length > 0) {
        console.log('[Mention Modal] Fetching details for missing users:', usersToFetch)
        
        const fetchPromises = usersToFetch.map(async (userId) => {
          const userName = await fetchUserDetails(userId)
          return { userId, userName }
        })
        
        const fetchedUsers = await Promise.all(fetchPromises)
        
        // Update the mapped members with fetched user names
        fetchedUsers.forEach(({ userId, userName }) => {
          const memberIndex = mappedMembers.findIndex(m => m.id === userId)
          const member = memberIndex !== -1 ? mappedMembers[memberIndex] : undefined
          if (member) {
            member.name = userName
            member.missing = false
          }
        })
      }

      // Remove the missing flag before storing
      mentionUsers.value = mappedMembers.map((m: any) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar
      }))
      
      console.log('[Mention Modal] Members loaded:', mentionUsers.value.length)
      console.log('[Mention Modal] Members with names:', mentionUsers.value)
      
      if (mentionUsers.value.length === 0) {
        mentionError.value = 'No members in this channel yet'
      }
    } else {
      mentionError.value = 'No channel selected or channel has no members'
      console.warn('[Mention Modal] No channel selected or no members in channel')
    }
  } catch (error) {
    mentionError.value = error instanceof Error ? error.message : 'Failed to load members'
    console.error('[Mention Modal] Error:', error)
  } finally {
    mentionLoading.value = false
  }
}

function insertMention(userName: string) {
  if (!editor.value) return
  editor.value.chain().focus().insertContent(`<strong><em>@${userName}</em></strong> `).run()
  showMentionModal.value = false
}

function closeMentionModal() {
  showMentionModal.value = false
}
// ─── Link dialog ─────────────────────────────────────────────────────────────
const showLinkDialog = ref(false)
const linkUrl        = ref('')
const linkText       = ref('')

function openLinkDialog() {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
  linkText.value = editor.value.state.doc.textBetween(from, to, '') || ''
  linkUrl.value  = editor.value.getAttributes('link').href || ''
  showLinkDialog.value = true
}

function applyLink() {
  if (!editor.value || !linkUrl.value.trim()) return
  const url = /^https?:\/\//i.test(linkUrl.value) ? linkUrl.value : `https://${linkUrl.value}`
  const label = linkText.value.trim() || url

  if (editor.value.state.selection.empty) {
    editor.value
      .chain().focus()
      .insertContent(`<a href="${url}">${label}</a>`)
      .run()
  } else {
    editor.value.chain().focus().setLink({ href: url }).run()
  }

  closeLinkDialog()
}

function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
  closeLinkDialog()
}

function closeLinkDialog() {
  showLinkDialog.value = false
  linkUrl.value  = ''
  linkText.value = ''
}

// ─── Voice recording ─────────────────────────────────────────────────────────
const showVoiceDialog  = ref(false)
const isRecording      = ref(false)
const recordedAudio    = ref<Blob | null>(null)
const audioUrl         = ref<string | null>(null)
const mediaRecorder    = ref<MediaRecorder | null>(null)
const recordingSeconds = ref(0)
let   recordingTimer: ReturnType<typeof setInterval> | null = null

const recordingTime = computed(() => {
  const m = Math.floor(recordingSeconds.value / 60).toString().padStart(2, '0')
  const s = (recordingSeconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

function encodeWavFromAudioBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
  const channelCount = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.length
  const bytesPerSample = 2
  const blockAlign = channelCount * bytesPerSample
  const buffer = new ArrayBuffer(44 + samples * blockAlign)
  const view = new DataView(buffer)

  function writeString(offset: number, value: string) {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples * blockAlign, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples * blockAlign, true)

  const channelData = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index))
  let offset = 44

  for (let sampleIndex = 0; sampleIndex < samples; sampleIndex++) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      const sample = Math.max(-1, Math.min(1, channelData[channelIndex]?.[sampleIndex] ?? 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += bytesPerSample
    }
  }

  return buffer
}

async function convertRecordedAudioToWavFile(blob: Blob) {
  const audioContext = new AudioContext()

  try {
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const wavBuffer = encodeWavFromAudioBuffer(audioBuffer)
    return new File([wavBuffer], `voice-${Date.now()}.wav`, { type: 'audio/wav' })
  } finally {
    await audioContext.close()
  }
}

async function openVoiceDialog() {
  showVoiceDialog.value = true
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const preferredMimeType = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ].find(type => MediaRecorder.isTypeSupported(type))

    mediaRecorder.value  = preferredMimeType
      ? new MediaRecorder(stream, { mimeType: preferredMimeType })
      : new MediaRecorder(stream)
    recordedAudio.value  = null
    audioUrl.value       = null
    isRecording.value    = true
    recordingSeconds.value = 0

    recordingTimer = setInterval(() => recordingSeconds.value++, 1000)

    const chunks: BlobPart[] = []
    mediaRecorder.value.ondataavailable = e => chunks.push(e.data)
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.value?.mimeType || 'audio/webm' })
      recordedAudio.value = blob
      audioUrl.value = URL.createObjectURL(blob)
      isRecording.value = false
      if (recordingTimer) clearInterval(recordingTimer)
    }
    mediaRecorder.value.start()
  } catch {
    showVoiceDialog.value = false
  }
}

function stopRecording() {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
    mediaRecorder.value.stream.getTracks().forEach(t => t.stop())
  }
}

async function attachVoiceNote() {
  if (!recordedAudio.value) return

  try {
    selectedFile.value = await convertRecordedAudioToWavFile(recordedAudio.value)
  } catch (error) {
    console.warn('[Voice Note] Falling back to original recording format:', error)
    selectedFile.value = new File(
      [recordedAudio.value],
      `voice-${Date.now()}.webm`,
      { type: recordedAudio.value.type || 'audio/webm' }
    )
  }

  toast.add({
    title: 'Voice note attached locally',
    description: 'This server currently rejects audio uploads, so voice notes cannot be sent until backend file rules allow audio types.',
    color: 'warning'
  })

  closeVoiceDialog()
}

function discardRecording() {
  recordedAudio.value = null
  audioUrl.value = null
  recordingSeconds.value = 0
}

function closeVoiceDialog() {
  if (isRecording.value) stopRecording()
  if (recordingTimer) clearInterval(recordingTimer)
  recordedAudio.value = null
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = null
  isRecording.value = false
  recordingSeconds.value = 0
  showVoiceDialog.value = false
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
const showScheduler  = ref(false)
const scheduledDate  = ref('')
const scheduledTime  = ref('')

function formatLocalDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const minDate = formatLocalDateInput(new Date())

const scheduledDateTime = computed(() => {
  if (!scheduledDate.value || !scheduledTime.value) return null
  return new Date(`${scheduledDate.value}T${scheduledTime.value}`)
})

const scheduleError = computed(() => {
  if (!scheduledDateTime.value) return null
  if (Number.isNaN(scheduledDateTime.value.getTime())) {
    return 'Choose a valid date and time.'
  }
  if (scheduledDateTime.value.getTime() <= Date.now()) {
    return 'Scheduled time must be in the future.'
  }
  return null
})

const scheduleLabel = computed(() => {
  if (!scheduledDateTime.value || scheduleError.value) return null
  const dt = scheduledDateTime.value
  return dt.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

function handleScheduleSend() {
  if (!scheduledDateTime.value || scheduleError.value) return
  sendMessage(scheduledDateTime.value)
  showScheduler.value = false
  scheduledDate.value = ''
  scheduledTime.value = ''
}

function cancelSchedule() {
  showScheduler.value = false
  scheduledDate.value = ''
  scheduledTime.value = ''
}

// ─── Send ─────────────────────────────────────────────────────────────────────
async function sendMessage(scheduledAt?: Date) {
  if (!editor.value) return
  const text = editor.value.getText()
  const html = editor.value.getHTML()
  const hasHtmlContent = /<(a|p|div|strong|em|code|pre|ul|ol|li|blockquote)\b/i.test(html)
  if (!text.trim() && !hasHtmlContent && !selectedFile.value) return

  const isVoiceNote = selectedFile.value?.type.startsWith('audio/')
  const content = text.trim() || hasHtmlContent
    ? html.trim()
    : isVoiceNote
      ? '<p>Voice note</p>'
      : ''

  emit('send', {
    content,
    file: selectedFile.value ?? undefined,
    scheduledAt
  })

  editor.value.commands.clearContent()
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ─── Click-outside helper ─────────────────────────────────────────────────────
function onEsc(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showLinkDialog.value)   closeLinkDialog()
  if (showVoiceDialog.value)  closeVoiceDialog()
  if (showScheduler.value)    cancelSchedule()
  if (showEmojiPicker.value)  showEmojiPicker.value = false
  if (showMentionModal.value) closeMentionModal()
}

onMounted(() => {
  if (editor.value && props.initialContent)
    editor.value.commands.setContent(props.initialContent)
  window.addEventListener('keydown', onEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onEsc)
})

watch(() => props.initialContent, v => {
  if (editor.value && v) editor.value.commands.setContent(v)
})
</script>

<template>
  <!-- ─── Backdrop (shared) ──────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showLinkDialog || showVoiceDialog || showScheduler || showEmojiPicker || showMentionModal"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        @click="closeLinkDialog(); closeVoiceDialog(); cancelSchedule(); showEmojiPicker = false; closeMentionModal()"
      />
    </Transition>

    <!-- ─── Link Dialog ──────────────────────────────────────────────────────── -->
    <Transition name="pop">
      <div
        v-if="showLinkDialog"
        class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[calc(100vw-1.5rem)] max-w-[360px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-4 sm:p-5"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold tracking-tight">Insert Link</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="closeLinkDialog" />
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">
              Display Text
            </label>
            <input
              v-model="linkText"
              type="text"
              placeholder="Link text (optional if text is selected)"
              class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]
                     px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30
                     placeholder:text-[var(--ui-text-dimmed)] transition-all"
            />
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">
              URL
            </label>
            <input
              v-model="linkUrl"
              type="url"
              placeholder="https://example.com"
              class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]
                     px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30
                     placeholder:text-[var(--ui-text-dimmed)] transition-all"
              @keydown.enter="applyLink"
            />
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <UButton
            v-if="editor?.isActive('link')"
            size="sm"
            color="error"
            variant="soft"
            class="flex-1 cursor-pointer"
            @click="removeLink"
          >
            Remove link
          </UButton>
          <UButton
            size="sm"
            color="primary"
            class="flex-1 cursor-pointer"
            :disabled="!linkUrl.trim()"
            @click="applyLink"
          >
            Apply
          </UButton>
        </div>
      </div>
    </Transition>

    <!-- ─── Voice Recording Dialog ────────────────────────────────────────────── -->
    <Transition name="pop">
      <div
        v-if="showVoiceDialog"
        class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[calc(100vw-1.5rem)] max-w-[340px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-4 sm:p-5"
        @click.stop
      >
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-sm font-bold tracking-tight">Voice Recording</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="closeVoiceDialog" />
        </div>

        <!-- Before recording starts -->
        <div v-if="!isRecording && !recordedAudio" class="flex flex-col items-center gap-4 py-4">
          <div class="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <UIcon name="i-lucide-mic" class="h-7 w-7 text-red-500" />
          </div>
          <p class="text-sm text-[var(--ui-text-dimmed)] text-center">
            Click the button below to start recording your voice note.
          </p>
          <UButton
            size="md"
            color="error"
            class="px-6 cursor-pointer"
            @click="startRecording"
          >
            <UIcon name="i-lucide-mic" class="h-4 w-4 mr-2" />
            Start Recording
          </UButton>
        </div>

        <!-- Recording in progress -->
        <div v-else-if="isRecording" class="flex flex-col items-center gap-4 py-2">
          <div class="relative h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <UIcon name="i-lucide-mic" class="h-7 w-7 text-red-500 relative z-10" />
          </div>

          <!-- Waveform bars animation -->
          <div class="flex items-center gap-1 h-8">
            <span
              v-for="i in 12" :key="i"
              class="w-1 rounded-full bg-red-500 recording-bar"
              :style="{ animationDelay: `${i * 0.08}s` }"
            />
          </div>

          <p class="text-xl font-mono font-bold tabular-nums text-red-500">{{ recordingTime }}</p>
          <p class="text-xs text-[var(--ui-text-dimmed)] flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording in progress…
          </p>

          <UButton
            size="md"
            color="error"
            variant="soft"
            class="px-6 mt-1 cursor-pointer"
            @click="stopRecording"
          >
            <UIcon name="i-lucide-square" class="h-4 w-4 mr-2" />
            Stop Recording
          </UButton>
        </div>

        <!-- Playback after recording -->
        <div v-else-if="recordedAudio" class="flex flex-col gap-4">
          <div class="rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] p-3">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p class="text-sm font-bold">Recording complete</p>
                <p class="text-[11px] text-[var(--ui-text-dimmed)]">{{ recordingTime }} recorded</p>
              </div>
            </div>
            <!-- Native audio player -->
            <audio
              v-if="audioUrl"
              :src="audioUrl"
              controls
              class="w-full h-9 rounded-lg"
              style="accent-color: var(--ui-primary)"
            />
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              class="flex-1 cursor-pointer"
              @click="discardRecording"
            >
              <UIcon name="i-lucide-trash-2" class="h-4 w-4 mr-1" />
              Re-record
            </UButton>
            <UButton
              size="sm"
              color="primary"
              class="flex-1 cursor-pointer"
              @click="attachVoiceNote"
            >
              <UIcon name="i-lucide-paperclip" class="h-4 w-4 mr-1" />
              Attach & Close
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ─── Schedule Dialog ───────────────────────────────────────────────────── -->
    <Transition name="pop">
      <div
        v-if="showScheduler"
        class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[calc(100vw-1.5rem)] max-w-[360px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-4 sm:p-5"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar-clock" class="h-4 w-4 text-[var(--ui-primary)]" />
            <h3 class="text-sm font-bold tracking-tight">Schedule Message</h3>
          </div>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="cancelSchedule" />
        </div>

        <p class="text-xs text-[var(--ui-text-dimmed)] mb-4">
          Choose a date and time to send this message automatically.
        </p>

        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">
              Date
            </label>
            <input
              v-model="scheduledDate"
              type="date"
              :min="minDate"
              class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]
                     px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30
                     cursor-pointer transition-all"
            />
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">
              Time
            </label>
            <input
              v-model="scheduledTime"
              type="time"
              class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]
                     px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30
                     cursor-pointer transition-all"
            />
          </div>
        </div>

        <!-- Preview badge -->
        <Transition name="fade">
          <div
            v-if="scheduleLabel"
            class="mt-3 rounded-lg bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/15
                   px-3 py-2 flex items-center gap-2"
          >
            <UIcon name="i-lucide-clock" class="h-4 w-4 text-[var(--ui-primary)] shrink-0" />
            <p class="text-xs font-bold text-[var(--ui-primary)]">Sends on {{ scheduleLabel }}</p>
          </div>
        </Transition>

        <p v-if="scheduleError" class="mt-3 text-xs font-medium text-[var(--ui-error)]">
          {{ scheduleError }}
        </p>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            class="flex-1 cursor-pointer"
            @click="cancelSchedule"
          >
            Cancel
          </UButton>
          <UButton
            size="sm"
            color="primary"
            class="flex-1 cursor-pointer"
            :disabled="!scheduledDate || !scheduledTime || Boolean(scheduleError)"
            @click="handleScheduleSend"
          >
            <UIcon name="i-lucide-send" class="h-3.5 w-3.5 mr-1" />
            Schedule Send
          </UButton>
        </div>
      </div>
    </Transition>

    <!-- ─── Emoji Picker Dialog ─────────────────────────────────────────────── -->
    <Transition name="pop">
      <div
        v-if="showEmojiPicker"
        class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[calc(100vw-1.5rem)] max-w-[380px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-4"
        @click.stop
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold tracking-tight">Select Emoji</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="showEmojiPicker = false" />
        </div>

        <div class="flex gap-2 whitespace-nowrap overflow-x-auto">
          <button
            v-for="(emoji, idx) in emojis"
            :key="idx"
            class="h-10 w-10 rounded-lg hover:bg-[var(--ui-primary)]/10 transition-all flex items-center justify-center text-xl cursor-pointer flex-shrink-0"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ─── Mention Modal ───────────────────────────────────────────────────── -->
    <Transition name="pop">
      <div
        v-if="showMentionModal"
        class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-[calc(100vw-1.5rem)] max-w-[340px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-4"
        @click.stop
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold tracking-tight">Mention Members</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="closeMentionModal" />
        </div>

        <!-- Loading state -->
        <div v-if="mentionLoading" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader" class="h-5 w-5 animate-spin text-[var(--ui-primary)]" />
          <span class="ml-2 text-sm text-[var(--ui-text-dimmed)]">Loading members...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="mentionError" class="flex flex-col items-center py-8 gap-3">
          <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-red-500" />
          <p class="text-sm text-red-500 text-center">{{ mentionError }}</p>
          <UButton
            size="sm"
            color="primary"
            class="cursor-pointer"
            @click="openMentionModal"
          >
            Retry
          </UButton>
        </div>

        <!-- Members list -->
        <div v-else-if="mentionUsers.length > 0" class="space-y-2 max-h-[300px] overflow-y-auto">
          <button
            v-for="user in mentionUsers"
            :key="user.id"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-all"
            @click="insertMention(user.name)"
          >
            <div v-if="user.avatar" class="h-8 w-8 rounded-full overflow-hidden">
              <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="h-8 w-8 rounded-full bg-[var(--ui-primary)]/10 flex items-center justify-center text-xs font-bold">
              {{ (user.name || 'U').charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium">{{ user.name || 'Unknown' }}</span>
          </button>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8">
          <p class="text-xs text-[var(--ui-text-dimmed)]">No members found</p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ─── Composer ─────────────────────────────────────────────────────────── -->
  <div class="relative z-20 border-t border-[var(--ui-border)] bg-[var(--ui-bg)]">
    <div class="w-full">
      <div
        class="relative flex flex-col border border-[var(--ui-border)] border-t-0
               bg-[var(--ui-bg-elevated)] shadow-lg
               focus-within:ring-2 focus-within:ring-[var(--ui-primary)]/20
               transition-all overflow-hidden"
      >
        <!-- Toolbar -->
        <div
          class="flex items-center gap-2 px-2 py-2 sm:px-3
                 border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/30
                 "
        >
          <div
            class="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div class="flex min-w-max items-center gap-1 whitespace-nowrap">
              <AppTooltip text="Bold (Ctrl+B)">
                <UButton
                  icon="i-lucide-bold"
                  size="xs" color="neutral" variant="ghost"
                  class="h-8 w-8 shrink-0 cursor-pointer"
                  :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('bold') }"
                  @click="insertBold"
                />
              </AppTooltip>
              <AppTooltip text="Italic (Ctrl+I)">
                <UButton
                  icon="i-lucide-italic"
                  size="xs" color="neutral" variant="ghost"
                  class="h-8 w-8 shrink-0 cursor-pointer"
                  :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('italic') }"
                  @click="insertItalic"
                />
              </AppTooltip>
              <div class="mx-1 h-4 w-px shrink-0 bg-[var(--ui-border)]" />
              <AppTooltip text="Insert / Edit Link">
                <UButton
                  icon="i-lucide-link"
                  size="xs" color="neutral" variant="ghost"
                  class="h-8 w-8 shrink-0 cursor-pointer"
                  :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('link') }"
                  @click="openLinkDialog"
                />
              </AppTooltip>
              <AppTooltip text="Code Block">
                <UButton
                  icon="i-lucide-code"
                  size="xs" color="neutral" variant="ghost"
                  class="h-8 w-8 shrink-0 cursor-pointer"
                  :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('codeBlock') }"
                  @click="insertCodeBlock"
                />
              </AppTooltip>
              <div class="mx-1 h-4 w-px shrink-0 bg-[var(--ui-border)]" />
              <AppTooltip text="Attach File">
                <UButton
                  icon="i-lucide-paperclip"
                  size="xs" color="neutral" variant="ghost"
                  class="h-8 w-8 shrink-0 cursor-pointer"
                  @click="fileInput?.click()"
                />
              </AppTooltip>
              <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
              <div class="mx-1 h-4 w-px shrink-0 bg-[var(--ui-border)]" />
              <AppTooltip text="Add emoji">
                <UButton icon="i-lucide-smile" size="xs" color="neutral" variant="ghost" class="h-8 w-8 shrink-0 cursor-pointer" @click="showEmojiPicker = true" />
              </AppTooltip>
              <AppTooltip text="Mention member">
                <UButton icon="i-lucide-at-sign" size="xs" color="neutral" variant="ghost" class="h-8 w-8 shrink-0 cursor-pointer" @click="openMentionModal" />
              </AppTooltip>
              <AppTooltip text="Schedule send">
                <UButton icon="i-lucide-calendar-clock" size="xs" color="neutral" variant="ghost" class="h-8 w-8 shrink-0 cursor-pointer" @click="showScheduler = true" />
              </AppTooltip>
            </div>
          </div>
          <AppTooltip text="Send message">
            <UButton icon="i-lucide-send" color="primary" size="xs" class="h-9 w-9 shrink-0 cursor-pointer rounded-full shadow-lg shadow-[var(--ui-primary)]/20" :loading="loading" @click="sendMessage()" />
          </AppTooltip>
        </div>

        <!-- Rich-text editor area -->
        <div class="relative flex min-h-[56px] max-h-[160px] flex-col overflow-y-auto sm:max-h-[120px]">
          <editor-content
            :editor="editor"
            class="flex-1 px-3 py-3 text-sm focus:outline-none sm:px-4 sm:py-2
                   prose prose-sm max-w-none dark:prose-invert
                   font-medium leading-relaxed custom-editor"
            @keydown="handleKeyDown"
          />

          <!-- Attached file preview -->
          <Transition name="slide-up">
            <div
              v-if="selectedFile"
              class="mx-4 mb-3 p-2 rounded-xl bg-[var(--ui-primary)]/5
                     border border-[var(--ui-primary)]/10
                     flex items-center gap-3"
            >
              <div class="h-8 w-8 rounded-lg bg-[var(--ui-primary)]/10 flex items-center justify-center text-[var(--ui-primary)]">
                <UIcon
                  :name="selectedFile.type.startsWith('audio') ? 'i-lucide-mic' : 'i-lucide-file'"
                  class="h-4 w-4"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-black truncate tracking-tight">{{ selectedFile.name }}</p>
                <p class="text-[9px] font-black uppercase opacity-50">
                  {{ (selectedFile.size / 1024).toFixed(1) }} KB
                </p>
              </div>
              <UButton icon="i-lucide-x" size="xs" color="error" variant="ghost" class="h-6 w-6 cursor-pointer" @click="removeFile" />
            </div>
          </Transition>
        </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
/* ── Editor prose ─────────────────────────────────────────────────────────── */
.custom-editor :deep(.ProseMirror) {
  outline: none;
  cursor: text;
}

.custom-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--ui-text-dimmed);
  pointer-events: none;
  height: 0;
}

/* Preserve bold / italic visually inside the editor */
.custom-editor :deep(strong) { font-weight: 700; }
.custom-editor :deep(em)     { font-style: italic; }

/* Styled links inside the editor */
.custom-editor :deep(.composer-link) {
  color: var(--ui-primary);
  text-decoration: underline;
  cursor: pointer;
}

/* Code blocks */
.custom-editor :deep(pre) {
  background: var(--ui-bg-muted);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 12px;
  cursor: text;
}

/* ── Recording waveform ───────────────────────────────────────────────────── */
.recording-bar {
  height: 8px;
  animation: wave 0.6s ease-in-out infinite alternate;
}

@keyframes wave {
  0%   { height: 4px;  opacity: 0.4; }
  100% { height: 24px; opacity: 1;   }
}

/* ── Transitions ──────────────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active  { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to      { opacity: 0; }

.pop-enter-active   { transition: opacity 0.2s ease, transform 0.2s cubic-bezier(.34,1.56,.64,1); }
.pop-leave-active   { transition: opacity 0.15s ease, transform 0.15s ease; }
.pop-enter-from     { opacity: 0; transform: translate(-50%, -48%) scale(0.92); }
.pop-leave-to       { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }

.slide-up-enter-active { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
.slide-up-leave-active { transition: all 0.15s ease; }
.slide-up-enter-from   { opacity: 0; transform: translateY(6px); }
.slide-up-leave-to     { opacity: 0; transform: translateY(4px); }
</style>
