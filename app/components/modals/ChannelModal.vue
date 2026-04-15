<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface ChannelPayload {
  name: string
  description: string
  type: 'public' | 'private'
  isPrivate: boolean
}

interface Props {
  mode: 'create' | 'update'
  teamName?: string
  initial?: Partial<ChannelPayload>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{
  submit: [payload: ChannelPayload]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

const form = ref<ChannelPayload>({
  name: '',
  description: '',
  type: 'public',
  isPrivate: false
})
// 1. Dynamic Error State
const nameError = computed(() => {
  // If the input is completely empty, don't show the red error text yet
  if (!form.value.name || form.value.name === '') {
    return undefined
  }

  const trimmedName = form.value.name.trim()

  // If they have typed something, but it's less than 3 characters (excluding trailing spaces)
  if (form.value.name.length > 0 && trimmedName.length < 3) {
    return 'Channel name must be at least 3 characters.'
  }

  return undefined
})

// 2. Dynamic Submit Button State
const isSubmitDisabled = computed(() => {
  // Disable if the name is empty, under 3 characters, OR if there is an active error
  return !form.value.name || form.value.name.trim().length < 3 || nameError.value !== undefined
})

watch(open, (val) => {
  if (val && props.initial) {
    form.value = { ...form.value, ...props.initial }
  }
  if (!val && props.mode === 'create') {
    form.value = { name: '', description: '', type: 'public', isPrivate: false }
  }
})

function handleSubmit() {
  // Safety check just in case they bypass the disabled button
  if (isSubmitDisabled.value) return

  const finalPayload: ChannelPayload = {
    ...form.value,
    type: form.value.isPrivate ? 'private' : 'public'
  }

  emit('submit', finalPayload)
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="mode === 'create' ? 'Create Channel' : 'Update Channel'"
    :description="teamName ? `In team: ${teamName}` : undefined"
    :icon="mode === 'create' ? 'i-lucide-hash' : 'i-lucide-pencil'"
    :icon-color="mode === 'create' ? 'primary' : 'warning'"
    :confirm-label="mode === 'create' ? 'Create Channel' : 'Save Changes'"
    :confirm-color="mode === 'create' ? 'primary' : 'warning'"
    :loading="loading"
    :confirm-disabled="isSubmitDisabled"
    @confirm="handleSubmit"
    @cancel="emit('cancel')"
  >
    <div class="flex flex-col gap-4">
      <UFormField
        label="Channel Name"
        :error="nameError"
        required
      >
        <UInput
          v-model="form.name"
          placeholder="e.g. general"
          :color="nameError ? 'error' : undefined"
          class="w-full"
        >
          <template #leading>
            <span class="text-[var(--ui-text-muted)]">#</span>
          </template>
        </UInput>
      </UFormField>

      <UFormField label="Description">
        <UInput
          v-model="form.description"
          placeholder="What is this channel for?"
          class="w-full"
        />
      </UFormField>

      <div class="flex items-center justify-between p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]">
        <div>
          <p class="text-sm font-medium text-[var(--ui-text)]">
            Private Channel
          </p>
          <p class="text-xs text-[var(--ui-text-muted)]">
            Only selected members can view this channel.
          </p>
        </div>
        <USwitch
          v-model="form.isPrivate"
          color="primary"
        />
      </div>
    </div>
  </BaseModal>
</template>
