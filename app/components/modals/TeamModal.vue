<script setup lang="ts">
import { ref, watch } from 'vue'

export interface TeamPayload {
  name: string
  description: string
  color: string
}

interface Props {
  mode: 'create' | 'update'
  workspaceName?: string
  initial?: Partial<TeamPayload>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{
  submit: [payload: TeamPayload]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

const colorOptions = [
  { label: 'Indigo', value: 'bg-indigo-500' },
  { label: 'Violet', value: 'bg-violet-500' },
  { label: 'Sky', value: 'bg-sky-500' },
  { label: 'Emerald', value: 'bg-emerald-500' },
  { label: 'Amber', value: 'bg-amber-500' },
  { label: 'Rose', value: 'bg-rose-500' },
  { label: 'Pink', value: 'bg-pink-500' },
  { label: 'Teal', value: 'bg-teal-500' }
]

const form = ref<TeamPayload>({ name: '', description: '', color: 'bg-indigo-500' })
const errors = ref({ name: '' })

watch(open, (val) => {
  if (val && props.initial) form.value = { ...form.value, ...props.initial }
  if (!val) {
    errors.value = { name: '' }
    if (props.mode === 'create')
      form.value = { name: '', description: '', color: 'bg-indigo-500' }
  }
})

function validate() {
  errors.value.name = ''
  if (!form.value.name.trim()) { errors.value.name = 'Team name is required.'; return false }
  if (form.value.name.length < 2) { errors.value.name = 'Name must be at least 2 characters.'; return false }
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
    :title="mode === 'create' ? 'Create Team' : 'Update Team'"
    :description="workspaceName ? `In workspace: ${workspaceName}` : undefined"
    :icon="mode === 'create' ? 'i-mdi-account-group' : 'i-mdi-account-edit'"
    :icon-color="mode === 'create' ? 'primary' : 'warning'"
    :confirm-label="mode === 'create' ? 'Create Team' : 'Save Changes'"
    :confirm-color="mode === 'create' ? 'primary' : 'warning'"
    :loading="loading"
    @confirm="handleSubmit"
    @cancel="emit('cancel')"
  >
    <div class="flex flex-col gap-4">
      <!-- Color Picker -->
      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium text-default">
          Team Color
        </p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="c in colorOptions"
            :key="c.value"
            class="w-7 h-7 rounded-full transition-all"
            :class="[c.value, form.color === c.value
              ? 'ring-2 ring-offset-2 ring-primary scale-125'
              : 'hover:scale-110']"
            :aria-label="c.label"
            @click="form.color = c.value"
          />
        </div>
      </div>

      <!-- Name -->
      <UFormField
        label="Team Name"
        :error="errors.name"
        required
      >
        <UInput
          v-model="form.name"
          placeholder="e.g. Frontend Squad"
          :color="errors.name ? 'error' : undefined"
          class="w-full"
        />
      </UFormField>

      <!-- Description -->
      <UFormField label="Description">
        <UTextarea
          v-model="form.description"
          placeholder="What does this team work on?"
          :rows="3"
          class="w-full"
        />
      </UFormField>
    </div>
  </BaseModal>
</template>
