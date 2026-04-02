<script setup lang="ts">
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { lowlight } from 'lowlight'

interface Emits {
  (e: 'send', data: { html: string; text: string; file: File | null }): void
}

defineProps<{
  initialContent?: string
  loading?: boolean
  submitLabel?: string
}>()

defineEmits<Emits>()

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const showDatePicker = ref(false)
const showVoiceRecorder = ref(false)
const isRecording = ref(false)
const recordedAudio = ref<Blob | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)

const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({
      codeBlock: false
    }),
    CodeBlockLowlight.configure({
      lowlight
    }),
    Placeholder.configure({
      placeholder: 'Type a message... Use / for commands'
    })
  ]
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
  }
}

function removeFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function insertCodeBlock() {
  editor.value?.chain().focus().toggleCodeBlock().run()
}

function insertBold() {
  editor.value?.chain().focus().toggleBold().run()
}

function insertItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}

function insertLink() {
  const url = prompt('Enter URL:')
  if (url) {
    editor.value?.chain().focus().toggleLink({ href: url }).run()
  }
}

function insertDate() {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  editor.value?.chain().focus().insertContent(`📅 ${today}`).run()
  showDatePicker.value = false
}

async function startVoiceRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value = new MediaRecorder(stream)
    recordedAudio.value = null
    isRecording.value = true

    const chunks: BlobPart[] = []
    mediaRecorder.value.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.value.onstop = () => {
      recordedAudio.value = new Blob(chunks, { type: 'audio/webm' })
    }

    mediaRecorder.value.start()
  } catch (error) {
    console.error('Microphone access denied:', error)
  }
}

function stopVoiceRecording() {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
    isRecording.value = false
  }
}

function attachVoiceNote() {
  if (recordedAudio.value) {
    const file = new File([recordedAudio.value], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
    selectedFile.value = file
    recordedAudio.value = null
    showVoiceRecorder.value = false
  }
}

function discardVoiceNote() {
  recordedAudio.value = null
  isRecording.value = false
}

async function sendMessage() {
  if (!editor.value) return

  const html = editor.value.getHTML()
  const text = editor.value.getText()

  if (!text.trim() && !selectedFile.value) return

  emit('send', {
    html,
    text,
    file: selectedFile.value
  })

  editor.value.commands.clearContent()
  selectedFile.value = null
  recordedAudio.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
    event.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  if (editor.value && props.initialContent) {
    editor.value.commands.setContent(props.initialContent)
  }
})

watch(() => props.initialContent, (newContent) => {
  if (editor.value && newContent) {
    editor.value.commands.setContent(newContent)
  }
})
</script>

<template>
  <div class="border-t border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 space-y-3">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-2 pb-3 border-b border-[var(--ui-border)]">
      <!-- Text Formatting -->
      <div class="flex gap-1 items-center">
        <UButton
          icon="i-mdi-format-bold"
          size="sm"
          color="gray"
          variant="ghost"
          :ui="{ base: editor?.isActive('bold') ? 'bg-[var(--ui-bg-elevated)]' : '' }"
          @click="insertBold"
          title="Bold (Ctrl+B)"
        />
        <UButton
          icon="i-mdi-format-italic"
          size="sm"
          color="gray"
          variant="ghost"
          :ui="{ base: editor?.isActive('italic') ? 'bg-[var(--ui-bg-elevated)]' : '' }"
          @click="insertItalic"
          title="Italic (Ctrl+I)"
        />
        <UButton
          icon="i-mdi-link"
          size="sm"
          color="gray"
          variant="ghost"
          @click="insertLink"
          title="Insert Link"
        />
      </div>

      <div class="w-px bg-[var(--ui-border)]" />

      <!-- Code Block -->
      <UButton
        icon="i-mdi-code-braces"
        size="sm"
        color="gray"
        variant="ghost"
        :ui="{ base: editor?.isActive('codeBlock') ? 'bg-[var(--ui-bg-elevated)]' : '' }"
        @click="insertCodeBlock"
        title="Code Block"
      />

      <div class="w-px bg-[var(--ui-border)]" />

      <!-- File Upload -->
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="handleFileSelect"
      />
      <UButton
        icon="i-mdi-paperclip"
        size="sm"
        color="gray"
        variant="ghost"
        @click="fileInput?.click()"
        title="Attach File"
      />

      <!-- Voice Note -->
      <UButton
        :icon="isRecording ? 'i-mdi-stop-circle' : 'i-mdi-microphone'"
        size="sm"
        :color="isRecording ? 'red' : 'gray'"
        variant="ghost"
        @click="isRecording ? stopVoiceRecording() : startVoiceRecording()"
        :title="isRecording ? 'Stop Recording' : 'Record Voice Note'"
      />

      <!-- Date Picker -->
      <div class="relative">
        <UButton
          icon="i-mdi-calendar"
          size="sm"
          color="gray"
          variant="ghost"
          @click="showDatePicker = !showDatePicker"
          title="Insert Date"
        />
        <div v-if="showDatePicker" class="absolute bottom-full right-0 mb-2 bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-3 shadow-lg z-50">
          <div class="flex gap-2">
            <UButton size="xs" color="primary" @click="insertDate">Today</UButton>
            <UButton size="xs" color="gray" variant="soft" @click="showDatePicker = false">Close</UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- File Preview -->
    <div v-if="selectedFile" class="flex items-center gap-2 p-2 bg-[var(--ui-bg-elevated)] rounded-lg">
      <UIcon name="i-mdi-file" class="w-4 h-4 text-[var(--ui-primary)]" />
      <span class="text-sm text-[var(--ui-text-muted)] flex-1">{{ selectedFile.name }}</span>
      <UButton
        icon="i-mdi-close"
        size="xs"
        color="gray"
        variant="ghost"
        @click="removeFile"
      />
    </div>

    <!-- Voice Recording Preview -->
    <div v-if="recordedAudio" class="flex items-center gap-2 p-2 bg-[var(--ui-bg-elevated)] rounded-lg">
      <UIcon name="i-mdi-microphone" class="w-4 h-4 text-red-500" />
      <span class="text-sm text-[var(--ui-text-muted)] flex-1">Voice note recorded</span>
      <div class="flex gap-1">
        <UButton
          size="xs"
          color="primary"
          @click="attachVoiceNote"
        >
          Attach
        </UButton>
        <UButton
          size="xs"
          color="gray"
          variant="soft"
          @click="discardVoiceNote"
        >
          Discard
        </UButton>
      </div>
    </div>

    <!-- Editor -->
    <div class="border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg-elevated)] focus-within:ring-2 focus-within:ring-[var(--ui-primary)]">
      <EditorContent
        :editor="editor"
        class="prose prose-sm dark:prose-invert max-w-none p-3 text-[var(--ui-text)] focus:outline-none"
        @keydown="handleKeyDown"
      />
    </div>

    <!-- Send Button -->
    <div class="flex justify-end">
      <UButton
        :label="submitLabel || 'Send message'"
        icon="i-mdi-send"
        color="primary"
        :loading="loading"
        :disabled="!editor?.getText().trim() && !selectedFile && !recordedAudio"
        @click="sendMessage"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  min-height: 100px;
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: var(--ui-text-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.ProseMirror pre) {
  background: var(--ui-bg-muted);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

:deep(.ProseMirror code) {
  background: var(--ui-bg-muted);
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  font-family: monospace;
}

:deep(.ProseMirror a) {
  color: var(--ui-primary);
  text-decoration: underline;
}

:deep(.ProseMirror strong) {
  font-weight: 600;
}

:deep(.ProseMirror em) {
  font-style: italic;
}
</style>
