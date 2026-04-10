<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import { useTeamStore } from '~/stores/useTeamStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import { addTeamMember, removeTeamMember } from '~/composables/useTeamsApi'

const props = defineProps<{
  teamId: string
  teamName: string
}>()

const open = defineModel<boolean>('open', { default: false })

const teamStore = useTeamStore()
const workspaceStore = useWorkspaceStore()
const userStore = useUserStore()
const toast = useToast()

const searchQuery = ref('')
const addingMemberId = ref<string | null>(null)
const removingMemberId = ref<string | null>(null)

const currentUserId = computed(() => userStore.user?.id || (userStore.user as any)?._id || '')

function isCreator(userId: string) {
  if (!userId) return false
  const t = teamStore.currentTeam
  if (!t) return false
  return t.creator_id === userId || (t as any).created_id === userId || (t as any).owner_id === userId || (t as any).user_id === userId
}

const isCurrentUserCreator = computed(() => {
  if (!currentUserId.value) return false
  return isCreator(currentUserId.value)
})

// === SMART MAPPING: Match Team IDs to Workspace User Details ===
const currentMembers = computed(() => {
  const tMembers = teamStore.currentTeam?.members || []
  const wMembers = workspaceStore.currentWorkspace?.members || []

  return tMembers
    .map((tMember: any) => {
      const tUserId = tMember.user_id || tMember.id || tMember._id || (typeof tMember === 'string' ? tMember : '')
      const foundUser = wMembers.find((w: any) => (w.id || w._id || w.user_id) === tUserId)

      return {
        id: tUserId,
        name: foundUser?.name || tMember?.user?.name || '',
        email: foundUser?.email || tMember?.user?.email || '',
        avatar: foundUser?.avatar || tMember?.user?.avatar || '',
        role: tMember.role || 'member'
      }
    })
    .filter((member: any) => member.id && member.name)
})

const availableMembers = computed(() => {
  const workspaceMembers = workspaceStore.currentWorkspace?.members || []
  const teamMemberIds = new Set(currentMembers.value.map((m: any) => m.id))
  
  return workspaceMembers.filter((wMember: any) => {
    const id = wMember.id || wMember._id || wMember.user_id
    if (teamMemberIds.has(id)) return false
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const name = (wMember.name || '').toLowerCase()
      const email = (wMember.email || '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    return true
  })
})

const getInitials = (name: string) => name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)

const getAvatarColor = (index: number) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500']
  return colors[index % colors.length]
}

async function handleAddMember(userId: string) {
  addingMemberId.value = userId
  try {
    const response = await addTeamMember({ 
      team_id: props.teamId, 
      workspace_id: workspaceStore.currentWorkspaceId || '',
      user_ids: [userId] 
    })
    toast.add({ title: 'Member added to team', color: 'success' })
    
    // ⚡ INSTANT UI UPDATE: Use the exact array the backend just gave us! ⚡
    if (response.data?.data?.members && teamStore.currentTeam) {
      teamStore.currentTeam.members = response.data.data.members
    } else if (teamStore.currentTeam) {
      // Bulletproof fallback: push the string ID
      if (!teamStore.currentTeam.members) teamStore.currentTeam.members = []
      teamStore.currentTeam.members.push(userId)
    }

    if (workspaceStore.currentWorkspaceId) {
      teamStore.fetchTeams(workspaceStore.currentWorkspaceId)
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message || 'Failed to add member', color: 'error' })
  } finally {
    addingMemberId.value = null
  }
}

async function handleRemoveMember(userId: string) {
  removingMemberId.value = userId
  try {
    const response = await removeTeamMember({ 
      team_id: props.teamId, 
      workspace_id: workspaceStore.currentWorkspaceId || '',
      user_ids: [userId] 
    })
    toast.add({ title: 'Member removed from team', color: 'success' })
    if (response.data?.data?.members && teamStore.currentTeam) {
      teamStore.currentTeam.members = response.data.data.members
    } else if (teamStore.currentTeam && teamStore.currentTeam.members) {
      // Bulletproof fallback: handle both strings and objects
      teamStore.currentTeam.members = teamStore.currentTeam.members.filter(
        (m: any) => {
          const id = typeof m === 'string' ? m : (m.id || m._id || m.user_id)
          return id !== userId
        }
      )
    }

    if (workspaceStore.currentWorkspaceId) {
      teamStore.fetchTeams(workspaceStore.currentWorkspaceId)
    }
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message || 'Failed to remove member', color: 'error' })
  } finally {
    removingMemberId.value = null
  }
}

watch(open, (newVal) => {
  if (newVal) searchQuery.value = ''
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="isCurrentUserCreator ? `Manage Team - ${teamName}` : `Team Members - ${teamName}`"
    icon="i-lucide-users"
    icon-color="primary"
    :hide-footer="true"
    @cancel="open = false"
  >
    <div class="flex flex-col gap-4">
      <div v-if="isCurrentUserCreator" class="shrink-0">
        <label class="block text-sm font-medium text-[var(--ui-text)]">Search Workspace Members</label>
        <div class="relative mt-2">
          <UInput v-model="searchQuery" type="search" placeholder="Search by name or email..." >
            <template #leading><UIcon name="i-lucide-search" class="h-4 w-4" /></template>
          </UInput>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div v-if="isCurrentUserCreator" class="flex flex-col gap-3">
          <div>
            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-3">Available to Add ({{ availableMembers.length }})</h3>
            <div class="space-y-2 max-h-[28vh] overflow-y-auto pr-2 pb-1 [scrollbar-width:thin]">
              <div v-for="(member, index) in availableMembers" :key="member.id || member._id || member.user_id" class="flex items-center justify-between p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] hover:bg-[var(--ui-bg-muted)]/80 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold" :class="getAvatarColor(index)">{{ getInitials(member.name || 'U') }}</div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-[var(--ui-text)] truncate">{{ member.name }}</p>
                    <p class="text-xs text-[var(--ui-text-muted)] truncate">{{ member.email }}</p>
                  </div>
                </div>
                <button type="button" @click="handleAddMember(member.id || member._id || member.user_id)" :disabled="addingMemberId !== null" class="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--ui-primary)] text-white text-xs font-medium hover:bg-[var(--ui-primary)]/90 transition-colors disabled:opacity-50">
                  <span v-if="addingMemberId !== (member.id || member._id || member.user_id)">Add</span>
                  <UIcon v-else name="i-lucide-loader" class="h-3 w-3 animate-spin" />
                </button>
              </div>
              <p v-if="availableMembers.length === 0" class="text-sm text-[var(--ui-text-muted)] text-center py-4">No workspace members left to add.</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3" :class="{ 'border-t border-[var(--ui-border)] pt-4': isCurrentUserCreator }">
          <h3 class="text-sm font-semibold text-[var(--ui-text)] shrink-0">Team Members ({{ currentMembers.length }})</h3>
          <div class="space-y-2 overflow-y-auto pr-2 pb-1 [scrollbar-width:thin]" :class="isCurrentUserCreator ? 'max-h-[35vh]' : 'max-h-[50vh]'">
            <div v-for="(member, index) in currentMembers" :key="member.id" class="flex items-center justify-between p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]">
              <div class="flex items-center gap-3 min-w-0">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold" :class="getAvatarColor(index)">{{ getInitials(member.name) }}</div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-[var(--ui-text)] truncate">{{ member.name }}</p>
                    <span v-if="isCreator(member.id)" class="shrink-0 rounded-full bg-[var(--ui-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--ui-primary)]">Creator</span>
                  </div>
                  <p class="text-xs text-[var(--ui-text-muted)] truncate">{{ member.email }}</p>
                </div>
              </div>
              <button v-if="isCurrentUserCreator && !isCreator(member.id)" type="button" @click="handleRemoveMember(member.id)" :disabled="removingMemberId !== null" class="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                <span v-if="removingMemberId !== member.id">Remove</span>
                <UIcon v-else name="i-lucide-loader" class="h-3 w-3 animate-spin" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>