<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Emits {
  (e: 'send', data: { content: string; file?: File; scheduledAt?: Date }): void
}

const props = defineProps<{
  initialContent?: string
  loading?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<Emits>()

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
    StarterKit.configure({ codeBlock: {} }),
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

async function openMentionModal() {
  showMentionModal.value = true
  try {
    mentionLoading.value = true
    // Fetch users from your API - adjust endpoint as needed
    const response = await fetch('/api/teams/members')
    if (response.ok) {
      mentionUsers.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch members:', error)
  } finally {
    mentionLoading.value = false
  }
}

function insertMention(userName: string) {
  if (!editor.value) return
  editor.value.chain().focus().insertContent(`@${userName} `).run()
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

  if (editor.value.state.selection.empty && linkText.value.trim()) {
    editor.value
      .chain().focus()
      .insertContent(`<a href="${url}">${linkText.value}</a>`)
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

async function openVoiceDialog() {
  showVoiceDialog.value = true
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value  = new MediaRecorder(stream)
    recordedAudio.value  = null
    audioUrl.value       = null
    isRecording.value    = true
    recordingSeconds.value = 0

    recordingTimer = setInterval(() => recordingSeconds.value++, 1000)

    const chunks: BlobPart[] = []
    mediaRecorder.value.ondataavailable = e => chunks.push(e.data)
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
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

function attachVoiceNote() {
  if (!recordedAudio.value) return
  selectedFile.value = new File([recordedAudio.value], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
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

const minDate = new Date().toISOString().slice(0, 10)

const scheduleLabel = computed(() => {
  if (!scheduledDate.value || !scheduledTime.value) return null
  const dt = new Date(`${scheduledDate.value}T${scheduledTime.value}`)
  return dt.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

function handleScheduleSend() {
  if (!scheduledDate.value || !scheduledTime.value) return
  const dt = new Date(`${scheduledDate.value}T${scheduledTime.value}`)
  sendMessage(dt)
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
  const html = editor.value.getHTML()
  const text = editor.value.getText()
  if (!text.trim() && !selectedFile.value) return

  emit('send', {
    content: html,
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
               w-[360px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-5"
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

        <div class="flex gap-2 mt-4">
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
               w-[340px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-5"
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

          <div class="flex gap-2">
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
               w-[360px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-5"
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

        <div class="flex gap-2 mt-4">
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
            :disabled="!scheduledDate || !scheduledTime"
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
               w-[380px] rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg)] shadow-2xl p-4"
        @click.stop
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold tracking-tight">Select Emoji</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="showEmojiPicker = false" />
        </div>

        <div class="grid grid-cols-8 gap-2 max-h-[300px] overflow-y-auto">
          <button
            v-for="(emoji, idx) in emojis"
            :key="idx"
            class="h-10 w-10 rounded-lg hover:bg-[var(--ui-primary)]/10 transition-all flex items-center justify-center text-xl cursor-pointer"
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
               w-[340px] rounded-2xl border border-[var(--ui-border)]
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
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium">{{ user.name }}</span>
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
  <div class="p-4 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] relative z-20">
    <div class="max-w-5xl mx-auto">
      <div
        class="relative flex flex-col rounded-2xl border border-[var(--ui-border)]
               bg-[var(--ui-bg-elevated)] shadow-lg
               focus-within:ring-2 focus-within:ring-[var(--ui-primary)]/20
               transition-all overflow-hidden"
      >
        <!-- Toolbar -->
        <div
          class="flex items-center justify-between px-3 py-2
                 border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/30"
        >
          <div class="flex items-center gap-0.5">
            <UButton
              icon="i-lucide-bold"
              size="xs" color="neutral" variant="ghost"
              class="h-8 w-8 cursor-pointer"
              :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('bold') }"
              title="Bold (Ctrl+B)"
              @click="insertBold"
            />
            <UButton
              icon="i-lucide-italic"
              size="xs" color="neutral" variant="ghost"
              class="h-8 w-8 cursor-pointer"
              :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('italic') }"
              title="Italic (Ctrl+I)"
              @click="insertItalic"
            />
            <div class="w-px h-4 bg-[var(--ui-border)] mx-1" />
            <UButton
              icon="i-lucide-link"
              size="xs" color="neutral" variant="ghost"
              class="h-8 w-8 cursor-pointer"
              :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('link') }"
              title="Insert / Edit Link"
              @click="openLinkDialog"
            />
            <UButton
              icon="i-lucide-code"
              size="xs" color="neutral" variant="ghost"
              class="h-8 w-8 cursor-pointer"
              :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]': editor?.isActive('codeBlock') }"
              title="Code Block"
              @click="insertCodeBlock"
            />
          </div>

          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-mic"
              size="xs" color="neutral" variant="ghost"
              class="h-8 w-8 cursor-pointer"
              title="Voice Note"
              @click="openVoiceDialog"
            />
            <UButton
              icon="i-lucide-paperclip"
              size="xs" color="neutral" variant="ghost"
              class="h-8 w-8 cursor-pointer"
              title="Attach File"
              @click="fileInput?.click()"
            />
            <input ref="fileInput" type="file" class="hidden" @change="handleFileSelect" />
          </div>
        </div>

        <!-- Rich-text editor area -->
        <div class="relative min-h-[50px] max-h-[160px] flex flex-col overflow-y-auto">
          <editor-content
            :editor="editor"
            class="flex-1 px-4 py-1 text-sm focus:outline-none
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

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-3 py-2
                 border-t border-[var(--ui-border)]/50 bg-[var(--ui-bg)]"
        >
          <div class="flex items-center gap-1">
            <UButton icon="i-lucide-smile"   size="xs" color="neutral" variant="ghost" class="h-8 w-8 cursor-pointer" title="Add emoji" @click="showEmojiPicker = true" />
            <UButton icon="i-lucide-at-sign" size="xs" color="neutral" variant="ghost" class="h-8 w-8 cursor-pointer" title="Mention member" @click="openMentionModal" />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-[var(--ui-text-dimmed)] uppercase tracking-widest hidden sm:block opacity-40">
              Enter to send · Shift+Enter for new line
            </span>

            <!-- Schedule button -->
            <UButton
              icon="i-lucide-calendar-clock"
              size="sm"
              color="neutral"
              variant="soft"
              class="cursor-pointer"
              title="Schedule send"
              @click="showScheduler = true"
            />

            <!-- Send now -->
            <UButton
              color="primary"
              size="sm"
              class="px-4 font-black uppercase tracking-widest text-[10px]
                     shadow-lg shadow-[var(--ui-primary)]/20 cursor-pointer"
              :loading="loading"
              @click="sendMessage()"
            >
              {{ submitLabel ?? 'Send' }}
              <template #trailing>
                <UIcon name="i-lucide-send" class="h-3.5 w-3.5" />
              </template>
            </UButton>
          </div>
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