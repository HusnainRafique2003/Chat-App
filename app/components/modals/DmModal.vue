<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface DmMember {
  id: string
  name: string
  email: string
}

interface Props {
  members: DmMember[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{
  select: [member: DmMember]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })
const searchQuery = ref('')

// Clear the search query every time the modal is closed
watch(open, (val) => {
  if (!val) {
    searchQuery.value = ''
  }
})

// Filter members based on search input
const filteredMembers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return props.members
  
  return props.members.filter(m => 
    m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
  )
})

function handleSelect(member: DmMember) {
  emit('select', member)
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    title="New Direct Message"
    description="Search workspace members to start a private chat."
    icon="i-mdi-account-search"
    icon-color="primary"
    :hide-footer="true"
    @cancel="emit('cancel')"
  >
    <div class="flex flex-col gap-4">
      
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Search members by name or email..."
        class="w-full"
        autofocus
      />

      <div class="flex-1 overflow-y-auto space-y-1 max-h-[40vh] min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div v-if="filteredMembers.length === 0" class="text-center py-8 text-sm text-[var(--ui-text-muted)]">
          No members found
        </div>
        
        <button
          v-for="member in filteredMembers"
          :key="member.id"
          @click="handleSelect(member)"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--ui-bg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)]"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] font-bold">
            {{ member.name.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-[var(--ui-text-highlighted)]">{{ member.name }}</p>
            <p class="truncate text-xs text-[var(--ui-text-muted)]">{{ member.email }}</p>
          </div>
        </button>
      </div>

    </div>
  </BaseModal>
</template>