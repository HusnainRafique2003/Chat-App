<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  entityType: 'workspace' | 'team' | 'channel'
  entityName: string
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
const inputValue = ref('')

const isMatch = computed(() =>
  inputValue.value.trim() === props.entityName.trim()
)

const inputError = computed(() => {
  if (inputValue.value.length > 0 && !isMatch.value)
    return `Name doesn't match. Please type "${props.entityName}" exactly.`
  return ''
})

function handleConfirm() {
  if (!isMatch.value) return
  emit('confirm')
}

function handleCancel() {
  inputValue.value = ''
  emit('cancel')
  open.value = false
}

// reset input when modal closes
watch(open, (val) => {
  if (!val) inputValue.value = ''
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="`Delete ${entityType}`"
    :description="`This action is permanent and cannot be undone.`"
    icon="i-lucide-trash-2"
    icon-color="error"
    confirm-label="Delete"
    confirm-color="error"
    :confirm-disabled="!isMatch"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <!-- Warning Box -->
    <UAlert
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="This cannot be undone"
      :description="`The ${entityType} '${entityName}' and all its data will be permanently deleted.`"
    />

    <!-- Confirmation Input -->
    <div class="flex flex-col gap-2 mt-2">
      <p class="text-sm text-muted">
        Type <span class="font-bold text-default font-mono">{{ entityName }}</span> to confirm:
      </p>
      <UInput
        v-model="inputValue"
        :placeholder="entityName"
        :color="inputError ? 'error' : isMatch ? 'success' : undefined"
        :trailing-icon="isMatch ? 'i-lucide-check' : undefined"
        :disabled="loading"
        @keyup.enter="handleConfirm"
      />
      <p
        v-if="inputError"
        class="text-xs text-error"
      >
        {{ inputError }}
      </p>
      <p
        v-if="isMatch"
        class="text-xs text-success"
      >
        ✓ Name matches — you can now delete this {{ entityType }}.
      </p>
    </div>
  </BaseModal>
</template>
