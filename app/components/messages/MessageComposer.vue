<script setup lang="ts">
interface Emits {
  (e: 'send', data: { content: string; file?: File }): void
}

defineEmits<Emits>()

const content = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const isLoading = ref(false)

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

async function sendMessage() {
  if (!content.value.trim() && !selectedFile.value) return

  isLoading.value = true
  try {
    emit('send', {
      content: content.value.trim(),
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
    <div v-if="selectedFile" class="mb-3 flex items-center gap-2 p-2 bg-[var(--ui-bg-elevated)] rounded-lg">
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

    <!-- Composer -->
    <div class="flex gap-3">
      <!-- File Upload -->
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="handleFileSelect"
      />
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
