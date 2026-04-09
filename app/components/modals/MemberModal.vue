<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  role?: 'admin' | 'member' | 'guest'
}

interface Props {
  mode: 'add' | 'remove'
  entityType: 'workspace' | 'team' | 'channel'
  entityName: string
  existingMembers?: Member[]
  targetMember?: Member
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  existingMembers: () => [],
})

const emit = defineEmits<{
  add: [emails: string[], role: string]
  remove: [memberId: string]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

// ── Add mode ──────────────────────────────────────────────
const emailInput = ref('')
const emailList = ref<string[]>([])
const selectedRole = ref<'admin' | 'member' | 'guest'>('member')
const emailError = ref('')

const roles = [
  { value: 'admin',  label: 'Admin',  icon: 'i-mdi-shield-crown',  desc: 'Full control' },
  { value: 'member', label: 'Member', icon: 'i-mdi-account',        desc: 'Standard access' },
  { value: 'guest',  label: 'Guest',  icon: 'i-mdi-account-clock',  desc: 'Read-only access' },
]

function addEmail() {
  const email = emailInput.value.trim()
  if (!email) return
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.value = 'Please enter a valid email address.'
    return
  }
  if (emailList.value.includes(email)) {
    emailError.value = 'This email has already been added.'
    return
  }
  emailList.value.push(email)
  emailInput.value = ''
  emailError.value = ''
}

function removeEmail(email: string) {
  emailList.value = emailList.value.filter(e => e !== email)
}

const canSubmitAdd = computed(() => emailList.value.length > 0)

function handleSubmit() {
  if (props.mode === 'add') {
    if (!canSubmitAdd.value) return
    emit('add', [...emailList.value], selectedRole.value)
  } else {
    if (!props.targetMember) return
    emit('remove', props.targetMember.id)
  }
}

watch(open, (val) => {
  if (!val) {
    emailInput.value = ''
    emailList.value = []
    emailError.value = ''
    selectedRole.value = 'member'
  }
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="mode === 'add' ? `Add Members` : `Remove Member`"
    :description="mode === 'add'
      ? `Invite people to ${entityType}: ${entityName}`
      : `Remove from ${entityType}: ${entityName}`"
    :icon="mode === 'add' ? 'i-mdi-account-plus' : 'i-mdi-account-remove'"
    :icon-color="mode === 'add' ? 'primary' : 'error'"
    :confirm-label="mode === 'add' ? `Invite (${emailList.length})` : 'Remove Member'"
    :confirm-color="mode === 'add' ? 'primary' : 'error'"
    :confirm-disabled="mode === 'add' ? !canSubmitAdd : false"
    :loading="loading"
    @confirm="handleSubmit"
    @cancel="emit('cancel')"
  >

    <!-- ADD MODE -->
    <div v-if="mode === 'add'" class="flex flex-col gap-4">

      <!-- Email Input -->
      <UFormField label="Email Addresses" :error="emailError">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
          <BaseInput
            v-model="emailInput"
            placeholder="colleague@example.com"
            type="email"
            input-class="w-full"
            class="flex-1"
            @enter="addEmail"
          />
          <UButton icon="i-lucide-plus" color="primary" class="min-h-12 justify-center rounded-2xl px-4 sm:self-start" @click="addEmail" />
        </div>
      </UFormField>

      <!-- Email Tags -->
      <div v-if="emailList.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="email in emailList"
          :key="email"
          class="flex items-center gap-1.5 rounded-full border border-[var(--ui-primary)]/12 bg-[var(--ui-primary)]/8 px-3 py-1.5 text-xs font-medium text-[var(--ui-primary)]"
        >
          <UIcon name="i-mdi-email" class="shrink-0 text-sm" />
          <span class="break-all">{{ email }}</span>
          <button
            type="button"
            class="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--ui-error)]/10 hover:text-[var(--ui-error)]"
            @click="removeEmail(email)"
          >
            <UIcon name="i-lucide-x" class="text-sm" />
          </button>
        </div>
      </div>

      <!-- Role Selector -->
      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium text-default">Assign Role</p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            v-for="role in roles"
            :key="role.value"
            class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all sm:flex-col sm:items-center sm:gap-1 sm:text-center"
            :class="selectedRole === role.value
              ? 'border-primary bg-primary/5'
              : 'border-default bg-muted hover:border-primary/40'"
            @click="selectedRole = role.value as any"
          >
            <UIcon :name="role.icon" class="text-xl"
              :class="selectedRole === role.value ? 'text-primary' : 'text-muted'" />
            <p class="text-xs font-medium text-default">{{ role.label }}</p>
            <p class="text-[10px] text-muted">{{ role.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Existing Members Preview -->
      <div v-if="existingMembers.length > 0">
        <p class="text-sm font-medium text-muted mb-2">
          Current Members ({{ existingMembers.length }})
        </p>
        <div class="flex max-h-40 flex-col gap-1 overflow-y-auto">
          <div
            v-for="m in existingMembers"
            :key="m.id"
            class="flex flex-wrap items-center gap-2 rounded bg-muted p-2"
          >
            <UAvatar :alt="m.name" size="xs" />
            <span class="min-w-0 text-xs text-default sm:flex-1">{{ m.name }}</span>
            <span class="w-full text-xs text-muted sm:w-auto">{{ m.email }}</span>
            <UBadge :label="m.role ?? 'member'" variant="soft" size="sm" class="sm:ml-auto" />
          </div>
        </div>
      </div>

    </div>

    <!-- REMOVE MODE -->
    <div v-else-if="targetMember" class="flex flex-col gap-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-triangle-alert"
        title="Confirm removal"
        :description="`${targetMember.name} will lose all access to ${entityType}: ${entityName}.`"
      />
      <div class="flex flex-col gap-3 rounded-lg bg-muted p-3 sm:flex-row sm:items-center">
        <UAvatar :alt="targetMember.name" size="md" />
        <div>
          <p class="text-sm font-semibold text-default">{{ targetMember.name }}</p>
          <p class="text-xs text-muted">{{ targetMember.email }}</p>
          <UBadge :label="targetMember.role ?? 'member'" variant="soft" size="sm" class="mt-1" />
        </div>
      </div>
    </div>

  </BaseModal>
</template>
