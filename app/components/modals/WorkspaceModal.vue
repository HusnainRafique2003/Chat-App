<script setup lang="ts">
import { ref, watch } from 'vue'

export interface WorkspacePayload {
  name: string
  description: string
  icon?: string
  isPrivate?: boolean
}

interface Props {
  mode: 'create' | 'update'
  initial?: Partial<WorkspacePayload>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  submit: [payload: WorkspacePayload]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

const form = ref<WorkspacePayload>({
  name: '',
  description: ''
})

const errors = ref({ name: '', description: '' })

const iconOptions = [
  'i-mdi-briefcase', 'i-mdi-rocket-launch', 'i-mdi-lightning-bolt',
  'i-mdi-star', 'i-mdi-heart', 'i-mdi-fire', 'i-mdi-leaf', 'i-mdi-diamond'
]

// Populate form when updating
watch(open, (val) => {
  if (val && props.initial) {
    form.value = { ...form.value, ...props.initial }
  }
  if (!val) {
    errors.value = { name: '', description: '' }
    if (props.mode === 'create') {
      form.value = { name: '', description: '', icon: 'i-mdi-briefcase', isPrivate: false }
    }
  }
})

function validate() {
  errors.value = { name: '', description: '' }
  if (!form.value.name.trim()) {
    errors.value.name = 'Workspace name is required.'
    return false
  }
  if (form.value.name.length < 3) {
    errors.value.name = 'Name must be at least 3 characters.'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', { ...form.value })
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="mode === 'create' ? 'Create Workspace' : 'Update Workspace'"
    :description="mode === 'create' ? 'Set up a new workspace for your team.' : 'Edit workspace details.'"
    :icon="mode === 'create' ? 'i-lucide-plus-circle' : 'i-lucide-pencil'"
    :icon-color="mode === 'create' ? 'primary' : 'warning'"
    :confirm-label="mode === 'create' ? 'Create' : 'Save Changes'"
    :confirm-color="mode === 'create' ? 'primary' : 'warning'"
    :loading="loading"
    @confirm="handleSubmit"
    @cancel="emit('cancel')"
  >
    <div class="flex flex-col gap-4">
      <!-- Name -->
      <UFormField
        label="Workspace Name"
        :error="errors.name"
        required
      >
        <UInput
          v-model="form.name"
          placeholder="e.g. Engineering Team"
          :color="errors.name ? 'error' : undefined"
          class="w-full"
        />
      </UFormField>

      <!-- Description -->
      <UFormField
        label="Description"
        :error="errors.description"
      >
        <UTextarea
          v-model="form.description"
          placeholder="What is this workspace for?"
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <!-- Private Toggle -->
      <!-- Removed as not in API spec -->
    </div>
  </BaseModal>
</template>
