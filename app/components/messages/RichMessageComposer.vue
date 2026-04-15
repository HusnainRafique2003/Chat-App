<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { simpleTrimStartEnd } from '~/composables/useMessageUtils'
import { useChannelStore } from '~/stores/useChannelStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

interface Emits {
  (e: 'send', data: { content: string; file?: File; scheduledAt?: Date }): void
}

const modelValue = defineModel<string>('modelValue', { default: '' })

const props = defineProps<{
  loading?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<Emits>()
const toast = useToast()

// File
const fileStatus = ref<'idle' | 'valid' | 'invalid'>('idle')

// File Validation
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'mp4', 'mp3', 'webm', 'ogg', 'wav'
])
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'application/zip', 'video/mp4', 'audio/mpeg', 'audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/wav'
])

function validateFile(file: File): { valid: boolean; error: string } {
  const sizeOk = file.size <= MAX_FILE_SIZE
  const mimeOk = ALLOWED_MIME_TYPES.has(file.type)
  const ext = file.name.toLowerCase().split('.').pop()
  const extOk = ext && ALLOWED_EXTENSIONS.has(ext!)
  const typeOk = mimeOk && extOk

  if (!sizeOk) return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB > 10MB)` }
  if (!typeOk) return { valid: false, error: 'File type not allowed.' }
  return { valid: true, error: '' }
}

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files?.[0]) return

  const file = files[0]
  const result = validateFile(file)
  if (result.valid) {
    selectedFile.value = file
    fileStatus.value = 'valid'
    toast.add({ title: '✅ File attached (' + (file.size / 1024).toFixed(0) + 'KB)', color: 'success' })
  } else {
    fileStatus.value = 'invalid'
    toast.add({ title: '❌ Invalid file', description: result.error, color: 'error' })
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removeFile() {
  selectedFile.value = null
  fileStatus.value = 'idle'
  if (fileInput.value) fileInput.value.value = ''
}

// Editor
const editor = useEditor({
  content: modelValue.value,
  extensions: [
    StarterKit.configure({
      codeBlock: {},
      link: false,
      paragraph: {
        HTMLAttributes: { class: 'editor-paragraph' }
      }
    }),
    Placeholder.configure({ placeholder: 'Type a message… use / for commands' }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'composer-link' },
      linkOnPaste: true,
      autolink: true
    })
  ],
  editorProps: {
    handlePaste: () => false
  }
})

function insertBold() { editor.value?.chain().focus().toggleBold().run() }
function insertItalic() { editor.value?.chain().focus().toggleItalic().run() }
function insertCodeBlock() { editor.value?.chain().focus().toggleCodeBlock().run() }

const getCleanTextContent = (): string => {
  if (!editor.value) return ''
  return simpleTrimStartEnd(editor.value.getText())
}

const isPlainContent = (html: string): boolean => {
  const hasFormatting = /<(strong|em|code|pre|a)[ >]/i.test(html) || /<p>.*\n.*<\/p>/s.test(html)
  return !hasFormatting && html.trim() !== ''
}

const getHTMLContent = (): string => {
  if (!editor.value) return ''
  let html = editor.value.getHTML()
  html = html.replace(/<p>\s*<\/p>/g, '')
  if (html.match(/^<p>([^<]+)<\/p>$/)) {
    html = html.replace(/^<p>([^<]+)<\/p>$/, '$1')
  }
  if (!html || html.trim() === '') return ''
  return html.trim()
}

// Emoji Picker
const showEmojiPicker = ref(false)
const emojiPickerRef = ref<HTMLElement | null>(null)
const emojiSearchQuery = ref('')
const selectedCategory = ref('smileys')

const emojiCategories = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😌', '😔', '😑', '😐', '😶', '🤐', '🤨', '🤔', '🤫', '🤥', '😲', '☹️', '🙁', '😮', '😯', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '🎃'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌', '👐', '🤲', '🤝', '🤜', '🤛', '👊', '✊', '👋', '🤚', '🖐️', '✋', '🖖', '💪', '🦾', '🖕', '☝️', '👇', '👈', '👉', '👆', '🖖', '🤌', '💅', '👄', '👁️', '👀'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐒', '🐔', '🐧', '🐦', '🐤', '🐴', '🐺', '🐗', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🐢', '🐍', '🦎', '🐙', '🦑', '🪼', '🦐', '🦞', '🐠', '🐟', '🐡', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🦖', '🦕'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍿', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎳', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪩', '🪆', '🎨', '🎭', '🪞', '🪟', '🎪', '🎗️', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '🏉', '🎬'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚀', '🛸', '✈️', '🛩️', '🛫', '🛬', '🚁', '🚂', '🚆', '🚇', '🚊', '🚉', '🚅', '🚈', '🚋', '🚝', '🚄', '🚃', '🚎', '🚒', '🚑', '🚓', '⛵', '🚤', '🛥️', '🛳️', '🚢', '⚓', '🪝', '🎡', '🎢', '🎠', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽'],
  objects: ['📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏰', '⌚', '📡', '🔋', '🪫', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💎', '⚙️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧰', '🧲', '🔪', '🗡️', '⚔️', '💣', '🏹', '🛡️', '🔧', '🔩', '🏗️', '🔫', '🪚', '🪛']
}

const allEmojis = computed(() => {
  let emojis = emojiCategories[selectedCategory.value as keyof typeof emojiCategories] || emojiCategories.smileys
  if (emojiSearchQuery.value && emojiSearchQuery.value.trim()) {
    const query = emojiSearchQuery.value.toLowerCase().trim()
    return emojis.filter(emoji => emoji.includes(query))
  }
  return emojis
})

const categories = [
  { id: 'smileys', name: '😊', label: 'Smileys' },
  { id: 'gestures', name: '👍', label: 'Gestures' },
  { id: 'hearts', name: '❤️', label: 'Hearts' },
  { id: 'animals', name: '🐶', label: 'Animals' },
  { id: 'food', name: '🍕', label: 'Food' },
  { id: 'activities', name: '⚽', label: 'Activities' },
  { id: 'travel', name: '🚗', label: 'Travel' },
  { id: 'objects', name: '📱', label: 'Objects' }
]

function insertEmoji(emoji: string) {
  if (!editor.value) return
  editor.value.chain().focus().insertContent(emoji).run()
  showEmojiPicker.value = false
  emojiSearchQuery.value = ''
}

function closeEmojiPicker() {
  showEmojiPicker.value = false
  emojiSearchQuery.value = ''
}

// Mention modal
const showMentionModal = ref(false)
const mentionUsers = ref<Array<{ id: string; name: string; avatar?: string }>>([])
const mentionLoading = ref(false)
const mentionError = ref<string | null>(null)

async function openMentionModal() {
  showMentionModal.value = true
  mentionError.value = null
  mentionLoading.value = true

  try {
    const channelStore = useChannelStore()
    const workspaceStore = useWorkspaceStore()
    const currentChannel = channelStore.currentChannel
    const currentWorkspace = workspaceStore.currentWorkspace

    if (currentChannel?.members?.length) {
      const userNameMap: Record<string, string> = {}
      if (currentWorkspace?.members) {
        currentWorkspace.members.forEach((member: any) => {
          const userId = member.id || member.user_id || ''
          const userName = member.name || userId
          if (userId) userNameMap[userId] = userName
        })
      }

      mentionUsers.value = currentChannel.members
        .map((member: any) => {
          const userId = member.user_id || member.id || ''
          return {
            id: userId,
            name: userNameMap[userId] || userId || 'Unknown User',
            avatar: member.avatar
          }
        })
        .filter(m => m.id)

      if (mentionUsers.value.length === 0) {
        mentionError.value = 'No members in this channel yet'
      }
    } else {
      mentionError.value = 'No channel selected or channel has no members'
    }
  } catch (error) {
    mentionError.value = error instanceof Error ? error.message : 'Failed to load members'
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

// Link dialog
const showLinkDialog = ref(false)
const linkUrl = ref('')
const linkText = ref('')

function openLinkDialog() {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
  const selectedText = editor.value.state.doc.textBetween(from, to, '')
  const linkAttrs = editor.value.getAttributes('link')
  const hasLink = editor.value.isActive('link')

  if (hasLink && linkAttrs.href) {
    linkUrl.value = linkAttrs.href
    linkText.value = selectedText || ''
  } else {
    linkUrl.value = ''
    linkText.value = selectedText || ''
  }
  showLinkDialog.value = true
}

function applyLink() {
  if (!editor.value || !linkUrl.value.trim()) return

  const url = /^https?:\/\//i.test(linkUrl.value) ? linkUrl.value : `https://${linkUrl.value}`
  const label = linkText.value.trim() || url
  const { from, to } = editor.value.state.selection

  if (from === to) {
    editor.value.chain().focus().insertContent({
      type: 'text',
      marks: [{ type: 'link', attrs: { href: url } }],
      text: label
    }).run()
  } else {
    editor.value.chain().focus().setLink({ href: url }).run()
    if (linkText.value.trim() && linkText.value !== label) {
      const { from, to } = editor.value.state.selection
      editor.value.chain().focus().deleteRange({ from, to }).insertContent({
        type: 'text',
        marks: [{ type: 'link', attrs: { href: url } }],
        text: linkText.value
      }).run()
    }
  }
  closeLinkDialog()
}

function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
  closeLinkDialog()
}

function closeLinkDialog() {
  showLinkDialog.value = false
  linkUrl.value = ''
  linkText.value = ''
}

// Voice recording
const showVoiceDialog = ref(false)
const isRecording = ref(false)
const recordedAudio = ref<Blob | null>(null)
const audioUrl = ref<string | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordingSeconds = ref(0)
let recordingTimer: ReturnType<typeof setInterval> | null = null

const recordingTime = computed(() => {
  const m = Math.floor(recordingSeconds.value / 60).toString().padStart(2, '0')
  const s = (recordingSeconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})


async function convertRecordedAudio(blob: Blob): Promise<File> {
  console.log('[Voice] Recording blob details:', blob.type, blob.size, '→ converting to MP3 (backend accepts)')
  const file = await recordToMp3(blob)
  console.log('[Voice] MP3 converted:', file.name, file.type, file.size)
  return file
}

async function openVoiceDialog() {
  showVoiceDialog.value = true
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const preferredMimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg;codecs=opus', 'audio/ogg']
      .find(type => MediaRecorder.isTypeSupported(type))

    mediaRecorder.value = preferredMimeType ? new MediaRecorder(stream, { mimeType: preferredMimeType }) : new MediaRecorder(stream)
    recordedAudio.value = null
    audioUrl.value = null
    isRecording.value = true
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
  } catch (error) {
    console.error('Recording error:', error)
    toast.add({ title: 'Microphone access denied', color: 'error' })
    showVoiceDialog.value = false
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    mediaRecorder.value.stream.getTracks().forEach(t => t.stop())
  }
}

async function attachVoiceNote() {
  if (!recordedAudio.value) return
  try {
    const voiceFile = await convertRecordedAudio(recordedAudio.value)
    selectedFile.value = voiceFile
    fileStatus.value = 'valid'
    toast.add({ title: `✅ Voice note ready (${(voiceFile.size / 1024).toFixed(0)}KB)`, color: 'success' })
  } catch (error) {
    console.error('[Voice Attach] Error:', error)
    toast.add({ title: '❌ Voice processing failed', color: 'error' })
  }
  closeVoiceDialog()
}

function discardRecording() {
  recordedAudio.value = null
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
  }
  recordingSeconds.value = 0
}

function closeVoiceDialog() {
  if (isRecording.value) stopRecording()
  if (recordingTimer) clearInterval(recordingTimer)
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  recordedAudio.value = null
  audioUrl.value = null
  isRecording.value = false
  recordingSeconds.value = 0
  showVoiceDialog.value = false
}

// Scheduler
const showScheduler = ref(false)
const scheduledDate = ref('')
const scheduledTime = ref('')
const channelStore = useChannelStore()

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
  if (isNaN(scheduledDateTime.value.getTime())) return 'Choose a valid date and time.'
  if (scheduledDateTime.value.getTime() <= Date.now()) return 'Scheduled time must be in the future.'
  return null
})

const scheduleLabel = computed(() => {
  if (!scheduledDateTime.value || scheduleError.value) return null
  return scheduledDateTime.value.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
})

function openScheduler() {
  const defaultTime = new Date()
  defaultTime.setHours(defaultTime.getHours() + 1)
  defaultTime.setMinutes(0)
  scheduledDate.value = formatLocalDateInput(defaultTime)
  scheduledTime.value = `${String(defaultTime.getHours()).padStart(2, '0')}:${String(defaultTime.getMinutes()).padStart(2, '0')}`
  showScheduler.value = true
}

function cancelSchedule() {
  showScheduler.value = false
  scheduledDate.value = ''
  scheduledTime.value = ''
}

// Send message
async function sendMessage(scheduledAt?: Date) {
  if (!editor.value) return

  const textContent = getCleanTextContent()
  const htmlContent = getHTMLContent()
  const hasTextContent = textContent.length > 0
  const hasFile = selectedFile.value !== null
  const sendFile = selectedFile.value || undefined

  if (!hasTextContent && !sendFile) {
    toast.add({ title: 'Cannot send empty message', description: 'Please enter some text or attach a file', color: 'warning' })
    return
  }

  let finalContent = ''
  if (hasTextContent) {
    finalContent = isPlainContent(htmlContent) ? textContent : htmlContent
    finalContent = simpleTrimStartEnd(finalContent)
  } else if (selectedFile.value?.type.startsWith('audio/')) {
    finalContent = '🎤 Voice note'
  } else if (hasFile) {
    finalContent = '📎 File attached'
  }

  if (scheduledAt) {
    const pkTime = new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short'
    }).format(scheduledAt)
    toast.add({ title: '📅 Message scheduled', description: `Will be sent on ${pkTime}`, color: 'success' })
  }

  emit('send', { content: finalContent, file: sendFile, scheduledAt })

  editor.value.commands.clearContent()
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  fileStatus.value = 'idle'
}

function handleScheduleSend() {
  if (!scheduledDateTime.value || scheduleError.value) return
  sendMessage(scheduledDateTime.value)
  cancelSchedule()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault()
    sendMessage()
  }
}

// Click-outside helper
function onEsc(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showLinkDialog.value) closeLinkDialog()
  if (showVoiceDialog.value) closeVoiceDialog()
  if (showScheduler.value) cancelSchedule()
  if (showEmojiPicker.value) closeEmojiPicker()
  if (showMentionModal.value) closeMentionModal()
}

onMounted(() => {
  if (editor.value) {
    editor.value.on('update', () => { modelValue.value = getHTMLContent() })
    if (modelValue.value) editor.value.commands.setContent(modelValue.value)
  }
  window.addEventListener('keydown', onEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onEsc)
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})

watch(modelValue, (newVal) => {
  if (editor.value && newVal !== getHTMLContent()) {
    editor.value.commands.setContent(newVal)
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Link Dialog -->
    <Transition name="pop">
      <div v-if="showLinkDialog" class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1.5rem)] max-w-[360px] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-2xl p-4 sm:p-5" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold tracking-tight">Insert Link</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="closeLinkDialog" />
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">Display Text</label>
            <input v-model="linkText" type="text" placeholder="Link text (optional if text is selected)" class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30" />
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">URL</label>
            <input v-model="linkUrl" type="url" placeholder="https://example.com" class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30" @keydown.enter="applyLink" />
          </div>
        </div>
        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <UButton v-if="editor?.isActive('link')" size="sm" color="error" variant="soft" class="flex-1 cursor-pointer" @click="removeLink">Remove link</UButton>
          <UButton size="sm" color="primary" class="flex-1 cursor-pointer" :disabled="!linkUrl.trim()" @click="applyLink">Apply Link</UButton>
        </div>
      </div>
    </Transition>

    <!-- Voice Recording Dialog -->
    <Transition name="pop">
      <div v-if="showVoiceDialog" class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1.5rem)] max-w-[340px] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-2xl p-4 sm:p-5" @click.stop>
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-sm font-bold tracking-tight">Voice Recording</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="closeVoiceDialog" />
        </div>
        <div v-if="!isRecording && !recordedAudio" class="flex flex-col items-center gap-4 py-4">
          <div class="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <UIcon name="i-lucide-mic" class="h-7 w-7 text-red-500" />
          </div>
          <p class="text-sm text-[var(--ui-text-dimmed)] text-center">Click the button below to start recording your voice note.</p>
          <UButton size="md" color="error" class="px-6 cursor-pointer" @click="startRecording">
            <UIcon name="i-lucide-mic" class="h-4 w-4 mr-2" />Start Recording
          </UButton>
        </div>
        <div v-else-if="isRecording" class="flex flex-col items-center gap-4 py-2">
          <div class="relative h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <UIcon name="i-lucide-mic" class="h-7 w-7 text-red-500 relative z-10" />
          </div>
          <div class="flex items-center gap-1 h-8">
            <span v-for="i in 12" :key="i" class="w-1 rounded-full bg-red-500 recording-bar" :style="{ animationDelay: `${i * 0.08}s` }" />
          </div>
          <p class="text-xl font-mono font-bold tabular-nums text-red-500">{{ recordingTime }}</p>
          <p class="text-xs text-[var(--ui-text-dimmed)] flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />Recording in progress…
          </p>
          <UButton size="md" color="error" variant="soft" class="px-6 mt-1 cursor-pointer" @click="stopRecording">
            <UIcon name="i-lucide-square" class="h-4 w-4 mr-2" />Stop Recording
          </UButton>
        </div>
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
            <audio v-if="audioUrl" :src="audioUrl" controls class="w-full h-9 rounded-lg" style="accent-color: var(--ui-primary)" />
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton size="sm" color="neutral" variant="soft" class="flex-1 cursor-pointer" @click="discardRecording">
              <UIcon name="i-lucide-trash-2" class="h-4 w-4 mr-1" />Re-record
            </UButton>
            <UButton size="sm" color="primary" class="flex-1 cursor-pointer" @click="attachVoiceNote">
              <UIcon name="i-lucide-paperclip" class="h-4 w-4 mr-1" />Attach & Close
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Schedule Dialog -->
    <Transition name="pop">
      <div v-if="showScheduler" class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1.5rem)] max-w-[360px] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-2xl p-4 sm:p-5" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar-clock" class="h-4 w-4 text-[var(--ui-primary)]" />
            <h3 class="text-sm font-bold tracking-tight">Schedule Message</h3>
          </div>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="cancelSchedule" />
        </div>
        <p class="text-xs text-[var(--ui-text-dimmed)] mb-4">Choose a date and time to send this message automatically.</p>
        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">Date</label>
            <input v-model="scheduledDate" type="date" :min="minDate" class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30" />
          </div>
          <div>
            <label class="text-[11px] font-bold uppercase tracking-widest text-[var(--ui-text-dimmed)] block mb-1">Time</label>
            <input v-model="scheduledTime" type="time" class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30" />
          </div>
        </div>
        <Transition name="fade">
          <div v-if="scheduleLabel" class="mt-3 rounded-lg bg-[var(--ui-primary)]/5 border border-[var(--ui-primary)]/15 px-3 py-2 flex items-center gap-2">
            <UIcon name="i-lucide-clock" class="h-4 w-4 text-[var(--ui-primary)] shrink-0" />
            <p class="text-xs font-bold text-[var(--ui-primary)]">Sends on {{ scheduleLabel }}</p>
          </div>
        </Transition>
        <p v-if="scheduleError" class="mt-3 text-xs font-medium text-red-500">{{ scheduleError }}</p>
        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <UButton size="sm" color="neutral" variant="soft" class="flex-1 cursor-pointer" @click="cancelSchedule">Cancel</UButton>
          <UButton size="sm" color="primary" class="flex-1 cursor-pointer" :disabled="!scheduledDate || !scheduledTime || Boolean(scheduleError)" @click="handleScheduleSend">
            <UIcon name="i-lucide-send" class="h-3.5 w-3.5 mr-1" />Schedule Send
          </UButton>
        </div>
      </div>
    </Transition>

    <!-- Emoji Picker -->
    <Transition name="pop">
      <div v-if="showEmojiPicker" class="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50" @click="closeEmojiPicker">
        <div ref="emojiPickerRef" class="w-[95vw] max-w-2xl bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-2xl rounded-3xl overflow-auto max-h-[85vh] relative z-[9999]" @click.stop>
          <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--ui-border)] sticky top-0 bg-[var(--ui-bg)] z-10">
            <h3 class="text-xl font-bold tracking-tight text-[var(--ui-text)]">Select Emoji 🎉</h3>
            <UButton icon="i-lucide-x" size="sm" color="neutral" variant="ghost" @click="closeEmojiPicker" />
          </div>
          <div class="px-5 py-3 border-b border-[var(--ui-border)] sticky top-[57px] bg-[var(--ui-bg)] z-10">
            <input v-model="emojiSearchQuery" type="text" placeholder="Search emojis..." class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/30" />
          </div>
          <div class="flex gap-1 px-4 py-2 border-b border-[var(--ui-border)] overflow-x-auto sticky top-[107px] bg-[var(--ui-bg)] z-10">
            <button v-for="cat in categories" :key="cat.id" @click="selectedCategory = cat.id" class="px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap" :class="selectedCategory === cat.id ? 'bg-[var(--ui-primary)] text-white' : 'hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-dimmed)]'">
              <span class="mr-1">{{ cat.name }}</span><span class="text-xs">{{ cat.label }}</span>
            </button>
          </div>
          <div class="p-5 max-h-[400px] overflow-y-auto">
            <div v-if="allEmojis.length === 0" class="text-center py-8 text-[var(--ui-text-dimmed)]">No emojis found</div>
            <div v-else class="grid grid-cols-8 gap-1">
              <button v-for="(emoji, idx) in allEmojis" :key="idx" class="h-10 w-10 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-all flex items-center justify-center text-2xl cursor-pointer hover:scale-110" @click="insertEmoji(emoji)">{{ emoji }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mention Modal -->
    <Transition name="pop">
      <div v-if="showMentionModal" class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1.5rem)] max-w-[340px] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-2xl p-4" @click.stop>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold tracking-tight">Mention Members</h3>
          <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" class="h-7 w-7 cursor-pointer" @click="closeMentionModal" />
        </div>
        <div v-if="mentionLoading" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader" class="h-5 w-5 animate-spin text-[var(--ui-primary)]" />
          <span class="ml-2 text-sm text-[var(--ui-text-dimmed)]">Loading members...</span>
        </div>
        <div v-else-if="mentionError" class="flex flex-col items-center py-8 gap-3">
          <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-red-500" />
          <p class="text-sm text-red-500 text-center">{{ mentionError }}</p>
          <UButton size="sm" color="primary" class="cursor-pointer" @click="openMentionModal">Retry</UButton>
        </div>
        <div v-else-if="mentionUsers.length > 0" class="space-y-2 max-h-[300px] overflow-y-auto">
          <button v-for="user in mentionUsers" :key="user.id" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-all" @click="insertMention(user.name)">
            <div v-if="user.avatar" class="h-8 w-8 rounded-full overflow-hidden">
              <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="h-8 w-8 rounded-full bg-[var(--ui-primary)]/10 flex items-center justify-center text-xs font-bold">{{ (user.name || 'U').charAt(0).toUpperCase() }}</div>
            <span class="text-sm font-medium">{{ user.name || 'Unknown' }}</span>
          </button>
        </div>
        <div v-else class="text-center py-8"><p class="text-xs text-[var(--ui-text-dimmed)]">No members found</p></div>
      </div>
    </Transition>
  </Teleport>

  <!-- Composer -->
  <div v-bind="$attrs" class="relative z-20 border-t border-[var(--ui-border)] bg-[var(--ui-bg)]">
    <div class="w-full">
      <div class="relative flex flex-col border border-[var(--ui-border)] border-t-0 bg-[var(--ui-bg-elevated)] shadow-lg focus-within:ring-2 focus-within:ring-[var(--ui-primary)]/20 transition-all overflow-hidden">
        <!-- Toolbar -->
        <div class="flex items-center gap-1 px-2 py-1.5 sm:px-3 border-b border-[var(--ui-border)] bg-gradient-to-b from-[var(--ui-bg)] to-[var(--ui-bg-muted)]/20">
          <div class="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div class="flex min-w-max items-center gap-0.5 whitespace-nowrap">
              <AppTooltip text="Bold (Ctrl+B)">
                <UButton icon="i-lucide-bold" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] ring-1 ring-[var(--ui-primary)]/20': editor?.isActive('bold') }" @click="insertBold" />
              </AppTooltip>
              <AppTooltip text="Italic (Ctrl+I)">
                <UButton icon="i-lucide-italic" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] ring-1 ring-[var(--ui-primary)]/20': editor?.isActive('italic') }" @click="insertItalic" />
              </AppTooltip>
              <div class="mx-1 h-5 w-px shrink-0 bg-[var(--ui-border)]" />
              <AppTooltip text="Insert Link">
                <UButton icon="i-lucide-link" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] ring-1 ring-[var(--ui-primary)]/20': editor?.isActive('link') }" @click="openLinkDialog" />
              </AppTooltip>
              <AppTooltip text="Code Block">
                <UButton icon="i-lucide-code" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" :class="{ 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] ring-1 ring-[var(--ui-primary)]/20': editor?.isActive('codeBlock') }" @click="insertCodeBlock" />
              </AppTooltip>
              <div class="mx-1 h-5 w-px shrink-0 bg-[var(--ui-border)]" />
              <AppTooltip text="Attach File">
                <UButton icon="i-lucide-paperclip" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" @click="fileInput?.click()" />
              </AppTooltip>
              <input ref="fileInput" type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,video/mp4,audio/mpeg" class="hidden" @change="handleFileSelect" />
              <div class="mx-1 h-5 w-px shrink-0 bg-[var(--ui-border)]" />
              <AppTooltip text="Add Emoji">
                <UButton icon="i-lucide-smile" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" @click="showEmojiPicker = true" />
              </AppTooltip>
              <AppTooltip text="Mention Member">
                <UButton icon="i-lucide-at-sign" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" @click="openMentionModal" />
              </AppTooltip>
              <AppTooltip text="Voice Recording">
                <UButton icon="i-lucide-mic" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" @click="openVoiceDialog" />
              </AppTooltip>
              <AppTooltip text="Schedule Send">
                <UButton icon="i-lucide-calendar-clock" size="xs" color="neutral" variant="ghost" class="h-8 w-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:bg-[var(--ui-bg-elevated)]" @click="openScheduler" />
              </AppTooltip>
            </div>
          </div>
          <AppTooltip text="Send message (Enter)">
            <UButton :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-send'" color="primary" size="sm" class="h-9 px-4 shrink-0 cursor-pointer rounded-lg shadow-md shadow-[var(--ui-primary)]/20 font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" :loading="loading" :disabled="(!getCleanTextContent() && !selectedFile) || loading" @click="sendMessage()">
              <span class="hidden sm:inline ml-1">Send</span>
            </UButton>
          </AppTooltip>
        </div>

        <!-- Editor area -->
        <div class="relative flex min-h-[60px] max-h-[160px] flex-col overflow-y-auto sm:max-h-[140px]">
          <editor-content :editor="editor" class="flex-1 px-3 py-2 text-sm focus:outline-none sm:px-4 sm:py-2.5 prose prose-sm max-w-none dark:prose-invert leading-relaxed custom-editor" @keydown="handleKeyDown" />

          <!-- File Preview -->
          <Transition name="slide-up">
            <div v-if="selectedFile" class="mx-4 my-3 p-3 rounded-2xl flex items-center gap-4 bg-gradient-to-r from-[var(--ui-bg-elevated)] to-[var(--ui-bg)]/50 border border-[var(--ui-border)] shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ring-1 ring-[var(--ui-primary)]/10 hover:ring-[var(--ui-primary)]/20" :class="{ 'ring-green-500/30 from-green-500/5 to-green-500/10 border-green-500/30': fileStatus === 'valid' && selectedFile.type.startsWith('audio/'), 'ring-red-500/30 from-red-500/5 to-red-500/10 border-red-500/30': fileStatus === 'invalid', 'ring-[var(--ui-primary)]/20 from-[var(--ui-primary)]/5 to-[var(--ui-primary)]/10 border-[var(--ui-primary)]/20': fileStatus === 'idle' }">
              <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                <UIcon name="i-lucide-mic-2" class="h-6 w-6 text-blue-400 drop-shadow-lg" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-xs font-bold text-blue-400 ring-1 ring-blue-500/30">ATTACHMENT</span>
                  <span class="text-xs font-semibold text-[var(--ui-text)] truncate">{{ selectedFile.name }}</span>
                </div>
                <p class="text-xs font-mono text-[var(--ui-text-dimmed)] tracking-tight">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
              </div>
              <div class="flex items-center gap-1">
                <UButton icon="i-lucide-x" size="sm" color="gray" variant="ghost" class="h-9 w-9 p-0 hover:bg-red-500/20 text-red-500 transition-all" @click="removeFile" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-editor :deep(.ProseMirror) {
  outline: none;
  cursor: text;
  min-height: 40px;
}
.custom-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--ui-text-dimmed);
  pointer-events: none;
  height: 0;
}
.custom-editor :deep(strong) { font-weight: 700; color: inherit; }
.custom-editor :deep(em) { font-style: italic; }
.custom-editor :deep(.composer-link), .custom-editor :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.custom-editor :deep(.composer-link:hover), .custom-editor :deep(a:hover) {
  color: color-mix(in srgb, var(--ui-primary) 80%, black);
  text-decoration-thickness: 2px;
}
.custom-editor :deep(pre) {
  background: var(--ui-bg-muted);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 12px;
  cursor: text;
  margin: 0.5rem 0;
  overflow-x: auto;
}
.custom-editor :deep(code) {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  background: var(--ui-bg-muted);
  padding: 0.2rem 0.3rem;
  border-radius: 4px;
}
.custom-editor :deep(.editor-paragraph), .custom-editor :deep(p) { margin: 0 0 0.25rem 0; }
.custom-editor :deep(p:last-child) { margin-bottom: 0; }
.recording-bar { height: 8px; animation: wave 0.6s ease-in-out infinite alternate; }
@keyframes wave { 0% { height: 4px; opacity: 0.4; } 100% { height: 24px; opacity: 1; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { transition: opacity 0.2s ease, transform 0.2s cubic-bezier(.34, 1.56, .64, 1); }
.pop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.pop-enter-from { opacity: 0; transform: translate(-50%, -48%) scale(0.92); }
.pop-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
.slide-up-enter-active { transition: all 0.2s cubic-bezier(.34, 1.56, .64, 1); }
.slide-up-leave-active { transition: all 0.15s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(6px); }
.slide-up-leave-to { opacity: 0; transform: translateY(4px); }
</style>