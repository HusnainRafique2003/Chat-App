<script setup lang="ts">
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { common, createLowlight } from 'lowlight'

const props = withDefaults(defineProps<{
  disabled?: boolean
  loading?: boolean
  submitLabel?: string
  initialContent?: string
}>(), {
  disabled: false,
  loading: false,
  submitLabel: 'Send message',
  initialContent: ''
})

const emit = defineEmits<{
  send: [{
    html: string
    text: string
    file: File | null
  }]
}>()

const lowlight = createLowlight(common)
const selectedFile = ref<File | null>(null)
const selectedDate = ref('')
const isRecording = ref(false)
const recordingSupported = ref(false)
const recordingError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordingChunks = ref<Blob[]>([])

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false
    }),
    Placeholder.configure({
      placeholder: 'Write a message, add code, attach a file, or record a voice note...'
    }),
    CodeBlockLowlight.configure({
      lowlight
    })
  ],
  editorProps: {
    attributes: {
      class: 'message-editor prose prose-sm max-w-none min-h-[132px] rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-[var(--ui-text)] outline-none'
    }
  },
  content: ''
})

const plainText = computed(() => editor.value?.getText().trim() || '')
const htmlContent = computed(() => editor.value?.getHTML() || '')
const canSend = computed(() => {
  return !props.disabled && !props.loading && (plainText.value.length > 0 || Boolean(selectedFile.value))
})

function triggerFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
}

function clearAttachment() {
  selectedFile.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function toggleMark(command: 'bold' | 'italic' | 'bulletList' | 'orderedList' | 'blockquote') {
  if (!editor.value) return

  const chain = editor.value.chain().focus()

  switch (command) {
    case 'bold':
      chain.toggleBold().run()
      break
    case 'italic':
      chain.toggleItalic().run()
      break
    case 'bulletList':
      chain.toggleBulletList().run()
      break
    case 'orderedList':
      chain.toggleOrderedList().run()
      break
    case 'blockquote':
      chain.toggleBlockquote().run()
      break
  }
}

function toggleCodeBlock() {
  editor.value?.chain().focus().toggleCodeBlock().run()
}

function insertDateChip() {
  if (!editor.value || !selectedDate.value) return

  editor.value.chain().focus().insertContent(`[Date: ${selectedDate.value}] `).run()
  selectedDate.value = ''
}

async function startRecording() {
  recordingError.value = ''

  if (!process.client || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    recordingSupported.value = false
    recordingError.value = 'Voice recording is not supported in this browser.'
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)

    recordingChunks.value = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordingChunks.value.push(event.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(recordingChunks.value, { type: recorder.mimeType || 'audio/webm' })
      const extension = blob.type.includes('ogg') ? 'ogg' : 'webm'
      selectedFile.value = new File([blob], `voice-message-${Date.now()}.${extension}`, { type: blob.type || 'audio/webm' })
      stream.getTracks().forEach(track => track.stop())
      mediaRecorder.value = null
      isRecording.value = false
    }

    mediaRecorder.value = recorder
    recorder.start()
    isRecording.value = true
  } catch (error) {
    recordingError.value = error instanceof Error ? error.message : 'Unable to start voice recording.'
    isRecording.value = false
  }
}

function stopRecording() {
  mediaRecorder.value?.stop()
}

function handleSubmit() {
  if (!canSend.value) return

  emit('send', {
    html: htmlContent.value,
    text: plainText.value,
    file: selectedFile.value
  })

  editor.value?.commands.clearContent()
  clearAttachment()
  selectedDate.value = ''
  recordingError.value = ''
}

onMounted(() => {
  recordingSupported.value = process.client
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined'
})

watch(() => props.initialContent, (value) => {
  if (!editor.value) return

  const normalized = value || ''
  if (editor.value.getHTML() === normalized) return

  editor.value.commands.setContent(normalized)
}, { immediate: true })

onBeforeUnmount(() => {
  mediaRecorder.value?.stream.getTracks().forEach(track => track.stop())
})
</script>

<template>
  <div class="rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-bg)]/92 p-4 shadow-[var(--shadow-md)]">
    <div class="mb-3 flex flex-wrap items-center gap-2 border-b border-[var(--ui-border-muted)] pb-3">
      <BaseButton label="Bold" size="sm" color="neutral" variant="soft" @click="toggleMark('bold')" />
      <BaseButton label="Italic" size="sm" color="neutral" variant="soft" @click="toggleMark('italic')" />
      <BaseButton label="Bullet" size="sm" color="neutral" variant="soft" @click="toggleMark('bulletList')" />
      <BaseButton label="Numbered" size="sm" color="neutral" variant="soft" @click="toggleMark('orderedList')" />
      <BaseButton label="Quote" size="sm" color="neutral" variant="soft" @click="toggleMark('blockquote')" />
      <BaseButton label="Code Block" size="sm" color="secondary" variant="soft" @click="toggleCodeBlock" />
      <BaseButton label="Attach File" size="sm" color="neutral" variant="outline" @click="triggerFilePicker" />
      <BaseButton
        :label="isRecording ? 'Stop Recording' : 'Voice Message'"
        size="sm"
        :color="isRecording ? 'error' : 'warning'"
        variant="soft"
        :disabled="!recordingSupported && !isRecording"
        @click="isRecording ? stopRecording() : startRecording()"
      />
    </div>

    <div class="mb-3 flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-2 text-sm font-medium text-[var(--ui-text-muted)]">
        Calendar insert
        <input
          v-model="selectedDate"
          type="date"
          class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-[var(--ui-text)] outline-none"
        >
      </label>
      <BaseButton label="Insert Date" size="sm" color="primary" variant="soft" :disabled="!selectedDate" @click="insertDateChip" />
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      @change="handleFileChange"
    >

    <EditorContent :editor="editor" />

    <div v-if="selectedFile || recordingError" class="mt-3 space-y-2">
      <div v-if="selectedFile" class="flex items-center justify-between rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm">
        <div>
          <p class="font-medium text-[var(--ui-text-highlighted)]">{{ selectedFile.name }}</p>
          <p class="text-[var(--ui-text-muted)]">{{ Math.round(selectedFile.size / 1024) }} KB</p>
        </div>
        <BaseButton label="Remove" size="sm" color="error" variant="ghost" @click="clearAttachment" />
      </div>

      <div v-if="recordingError" class="rounded-xl border border-[var(--ui-error)]/20 bg-[var(--ui-error)]/8 px-4 py-3 text-sm text-[var(--ui-error)]">
        {{ recordingError }}
      </div>
    </div>

    <div class="mt-4 flex flex-col gap-3 border-t border-[var(--ui-border-muted)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-[var(--ui-text-muted)]">
        {{ isRecording ? 'Recording voice note...' : 'Supports rich text, code blocks, file upload, voice notes, and date inserts.' }}
      </p>
      <BaseButton
        :label="submitLabel"
        color="primary"
        :loading="loading"
        :disabled="!canSend"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>
