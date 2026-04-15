<script setup lang="ts">
import { simpleTrimStartEnd } from '~/composables/useMessageUtils'

interface Emits {
  (e: 'send', data: { content: string, file?: File }): void
}

defineEmits<Emits>()

const content = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const isLoading = ref(false)

function validateFile(file: File): { valid: boolean, error: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'mp4', 'mp3', 'webm', 'ogg', 'wav'
  ])
  const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'video/mp4', 'audio/mpeg', 'audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/ogg;codecs=opus', 'audio/wav', 'audio/webm;codecs=vorbis'
  ])

  const sizeOk = file.size <= MAX_FILE_SIZE
  const mimeOk = ALLOWED_MIME_TYPES.has(file.type)
  const ext = file.name.toLowerCase().split('.').pop()
  const extOk = ext && ALLOWED_EXTENSIONS.has(ext!)
  const typeOk = mimeOk && extOk

  if (!sizeOk) return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB > 10MB)` }
  if (!typeOk) return { valid: false, error: 'File type not allowed. Server supports ONLY: Images (JPG/JPEG/PNG/GIF/WEBP), Docs (PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/TXT), Zip, MP4, MP3.' }
  return { valid: true, error: '' }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    const result = validateFile(file)
    if (result.valid) {
      selectedFile.value = file
    } else {
      // Clear input on invalid file
      target.value = ''
      console.error('File validation failed:', result.error)
      // Use native alert for now (simple composer - no toast composable)
      window.alert(result.error)
    }
  }
}

function removeFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function sendMessage() {
  const trimmedContent = simpleTrimStartEnd(content.value)
  if (!trimmedContent && !selectedFile.value) return

  isLoading.value = true
  try {
    emit('send', {
      content: trimmedContent,
      file: selectedFile.value || undefined
    })
    content.value = ''
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } finally {
    isLoading.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="border-t border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
    <!-- File Preview -->
    <div
      v-if="selectedFile"
      class="mb-3 flex items-center gap-2 p-2 bg-[var(--ui-bg-elevated)] rounded-lg"
    >
      <UIcon
        name="i-mdi-file"
        class="w-4 h-4 text-[var(--ui-primary)]"
      />
      <span class="text-sm text-[var(--ui-text-muted)] flex-1">{{ selectedFile.name }}</span>
      <UButton
        icon="i-mdi-close"
        size="xs"
        color="gray"
        variant="ghost"
        @click="removeFile"
      />
    </div>

    <!-- Composer -->
    <div class="flex gap-3">
      <!-- File Upload -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,video/mp4,audio/mpeg"
        class="hidden"
        @change="handleFileSelect"
      >
      <UButton
        icon="i-mdi-paperclip"
        size="lg"
        color="gray"
        variant="ghost"
        @click="fileInput?.click()"
      />

      <!-- Text Input -->
      <textarea
        v-model="content"
        placeholder="Type a message... (Shift+Enter for new line)"
        class="flex-1 px-4 py-2 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] text-[var(--ui-text)] placeholder-[var(--ui-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] resize-none"
        rows="3"
        @keydown="handleKeyDown"
      />

      <!-- Send Button -->
      <UButton
        icon="i-mdi-send"
        size="lg"
        color="primary"
        :loading="isLoading"
        :disabled="!content.trim() && !selectedFile"
        @click="sendMessage"
      />
    </div>
  </div>
</template>
