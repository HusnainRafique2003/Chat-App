<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ChannelPayload {
  name: string
  description: string
  type: 'text' | 'announcement' | 'voice'
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

const channelTypes = [
  { value: 'text',         label: 'Text',         icon: 'i-mdi-pound',      desc: 'Regular text conversations' },
  { value: 'announcement', label: 'Announcement',  icon: 'i-mdi-bullhorn',   desc: 'Broadcast messages to members' },
  { value: 'voice',        label: 'Voice',         icon: 'i-mdi-microphone', desc: 'Voice and video calls' },
]

const form = ref<ChannelPayload>({
  name: '', description: '', type: 'text', isPrivate: false,
})
const errors = ref({ name: '' })

watch(open, (val) => {
  if (val && props.initial) form.value = { ...form.value, ...props.initial }
  if (!val) {
    errors.value = { name: '' }
    if (props.mode === 'create')
      form.value = { name: '', description: '', type: 'text', isPrivate: false }
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
  emit('submit', { ...form.value })
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

      <!-- Channel Type -->
      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium text-default">Channel Type</p>
        <div class="flex flex-col gap-2">
          <button
            v-for="t in channelTypes"
            :key="t.value"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all text-left"
            :class="form.type === t.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-default bg-muted hover:border-primary/50'"
            @click="form.type = t.value as ChannelPayload['type']"
          >
            <UIcon :name="t.icon" class="text-xl shrink-0" />
            <div>
              <p class="text-sm font-medium">{{ t.label }}</p>
              <p class="text-xs text-muted">{{ t.desc }}</p>
            </div>
            <UIcon
              v-if="form.type === t.value"
              name="i-lucide-check-circle"
              class="ml-auto text-primary"
            />
          </button>
        </div>
      </div>

      <!-- Name -->
      <UFormField label="Channel Name" :error="errors.name" required>
        <UInput
          v-model="form.name"
          placeholder="e.g. general"
          :color="errors.name ? 'error' : undefined"
          class="w-full"
        >
          <template #leading>
            <span class="text-muted">#</span>
          </template>
        </UInput>
      </UFormField>

      <!-- Description -->
      <UFormField label="Description">
        <UInput
          v-model="form.description"
          placeholder="What is this channel for?"
          class="w-full"
        />
      </UFormField>

      <!-- Private -->
      <div class="flex items-center justify-between p-3 rounded-lg bg-muted">
        <div>
          <p class="text-sm font-medium text-default">Private Channel</p>
          <p class="text-xs text-muted">Only selected members can view this channel.</p>
        </div>
        <USwitch v-model="form.isPrivate" color="primary" />
      </div>

    </div>
  </BaseModal>
</template>
