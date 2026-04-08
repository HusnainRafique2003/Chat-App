<script setup lang="ts">
import { ref, watch } from 'vue'

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
  isPrivate: false,
})
const errors = ref({ name: '' })

watch(open, (val) => {
  if (val && props.initial) form.value = { ...form.value, ...props.initial }
  if (!val) {
    errors.value = { name: '' }
    if (props.mode === 'create')
      form.value = { name: '', description: '', type: 'public', isPrivate: false }
  }
})

function validate() {
  errors.value.name = ''
  if (!form.value.name.trim()) { errors.value.name = 'Channel name is required.'; return false }
  if (/\s/.test(form.value.name)) { errors.value.name = 'Channel name cannot contain spaces.'; return false }
  return true
}

function handleSubmit() {
  if (!validate()) return
  
  // Automatically set the type based on the toggle before emitting
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
    :icon="mode === 'create' ? 'i-mdi-pound' : 'i-mdi-pencil'"
    :icon-color="mode === 'create' ? 'primary' : 'warning'"
    :confirm-label="mode === 'create' ? 'Create Channel' : 'Save Changes'"
    :confirm-color="mode === 'create' ? 'primary' : 'warning'"
    :loading="loading"
    @confirm="handleSubmit"
    @cancel="emit('cancel')"
  >
    <div class="flex flex-col gap-4">

      <UFormField label="Channel Name" :error="errors.name" required>
        <UInput
          v-model="form.name"
          placeholder="e.g. general"
          :color="errors.name ? 'error' : undefined"
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
          <p class="text-sm font-medium text-[var(--ui-text)]">Private Channel</p>
          <p class="text-xs text-[var(--ui-text-muted)]">Only selected members can view this channel.</p>
        </div>
        <USwitch v-model="form.isPrivate" color="primary" />
      </div>

    </div>
  </BaseModal>
</template>