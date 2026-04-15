<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

function handleConfirm() {
  emit('confirm')
  open.value = false
}

function handleCancel() {
  emit('cancel')
  open.value = false
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    title="Delete Message"
    description="This action cannot be undone."
    icon="i-lucide-trash-2"
    icon-color="error"
    confirm-label="Delete"
    confirm-color="error"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <UAlert
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="This cannot be undone"
      description="The message will be permanently deleted."
    />
    <p class="text-sm text-[var(--ui-text-muted)] mt-4">
      Are you sure you want to delete this message? This action is permanent and cannot be reversed.
    </p>
  </BaseModal>
</template>
