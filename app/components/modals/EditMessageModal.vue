<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Message } from '~/composables/useMessagesApi'

interface Props {
  message?: Message
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [content: string]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })
const editContent = ref('')
const originalContent = ref('')

watch(() => props.message, (newMessage) => {
  if (newMessage && open.value) {
    editContent.value = newMessage.content
    originalContent.value = newMessage.content
  }
}, { immediate: true })

const hasChanges = computed(() => {
  return editContent.value.trim() !== originalContent.value.trim()
})

function handleConfirm() {
  if (!editContent.value.trim() || !hasChanges.value) return
  emit('confirm', editContent.value.trim())
  open.value = false
}

function handleCancel() {
  editContent.value = ''
  emit('cancel')
  open.value = false
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    title="Edit Message"
    description="Update your message content"
    icon="i-lucide-pencil"
    confirm-label="Update"
    :confirm-disabled="!hasChanges"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="flex flex-col gap-3">
      <div>
        <label class="text-sm font-semibold text-[var(--ui-text)] block mb-2">
          Message Content
        </label>
        <textarea
          v-model="editContent"
          placeholder="Enter your message..."
          class="w-full px-3 py-2 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] text-[var(--ui-text)] placeholder-[var(--ui-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] resize-none"
          rows="4"
        />
        <div class="flex items-center justify-between mt-2">
          <p class="text-xs text-[var(--ui-text-muted)]">
            {{ editContent.length }} characters
          </p>
          <p v-if="hasChanges" class="text-xs text-[var(--ui-primary)] font-semibold">
            ✓ Changes detected
          </p>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
