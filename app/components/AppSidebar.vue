<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import ChannelModal from './modals/ChannelModal.vue'
import DmModal from './modals/DmModal.vue'
import type { ChannelPayload } from './modals/ChannelModal.vue'
import type { DmMember } from './modals/DmModal.vue'

const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const userStore = useUserStore()
const emit = defineEmits<{
  navigate: []
}>()

const showCreateChannelModal = ref(false)
const isWorkspaceDropdownOpen = ref(false)
const showDmModal = ref(false)
const newChannelName = ref('')

const workspaceItems = computed(() =>
  workspaceStore.workspaces.map(w => ({
    id: w.id,
    name: w.name,
    label: w.name.slice(0,2).toUpperCase(),
    active: w.id === workspaceStore.currentWorkspaceId
  }))
)

const teamItems = computed(() =>
  teamStore.teams.map(t => ({
    id: t.id,
    name: t.name,
    label: t.name.slice(0,2).toUpperCase(),
    active: t.id === teamStore.currentTeamId
  }))
)

const workspaceMemberNameMap = computed(() => {
  const map = new Map<string, string>()

  for (const member of workspaceStore.currentWorkspace?.members || []) {
    const ids = [member?.id, (member as any)?._id, (member as any)?.user_id].filter(Boolean)
    const name = member?.name || 'Unknown User'

    ids.forEach((id) => map.set(String(id), name))
  }

  return map
})

function looksLikeUserId(value?: string | null) {
  return Boolean(value && /^[a-f0-9]{24}$/i.test(value))
}

function getDirectChannelName(channel: { name: string, members?: Array<{ user_id?: string, id?: string }> }) {
  const currentUserId = userStore.user?.id || (userStore.user as any)?._id
  const fallbackName = channel.name.replace('DM: ', '')

  const otherMemberId = channel.members?.find(member => {
    const memberId = member.user_id || member.id
    return memberId && memberId !== currentUserId
  })?.user_id || channel.members?.find(member => {
    const memberId = member.user_id || member.id
    return memberId && memberId !== currentUserId
  })?.id

  if (otherMemberId) {
    return workspaceMemberNameMap.value.get(otherMemberId) || fallbackName
  }

  if (looksLikeUserId(fallbackName)) {
    return workspaceMemberNameMap.value.get(fallbackName) || 'Unknown User'
  }

  return fallbackName
}

const channelItems = computed(() =>
  channelStore.channels
    // STRICT FILTER: Only show public/private channels that belong to the active team!
    .filter(c => c.type !== 'direct' && c.team_id === teamStore.currentTeamId)
    .map(c => ({
      id: c.id,
      name: c.name,
      active: c.id === channelStore.currentChannelId
    }))
)

const directMessages = computed(() =>
  channelStore.channels
    // Add the team_id check here to hide DMs from other teams
    .filter(c => c.type === 'direct' && c.team_id === teamStore.currentTeamId)
    .map(c => ({
      id: c.id,
      name: getDirectChannelName(c),
      active: c.id === channelStore.currentChannelId,
      online: true
    }))
)

const availableWorkspaceMembers = computed(() => {
  const workspace = workspaceStore.currentWorkspace
  if (!workspace || !workspace.members) return []
  
  const myId = userStore.user?.id || (userStore.user as any)?._id
  
  return workspace.members
    // Filter out the logged-in user
    .filter(member => member && (member.id !== myId && (member as any)._id !== myId))
    // Standardize the object shape for the DmModal
    .map(member => ({
      id: member.id || (member as any)._id || '',
      name: member.name || 'Unknown User',
      email: member.email || 'No email provided'
    }))
})
// Formats workspaces into Nuxt UI Dropdown items
const workspaceDropdownItems = computed(() => {
  return [
    workspaceStore.workspaces.map(w => ({
      label: w.name,
      // Adds a checkmark next to the active one
      icon: w.id === workspaceStore.currentWorkspaceId ? 'i-lucide-check-circle' : 'i-lucide-building',
      click: () => workspaceStore.setCurrentWorkspace(w.id)
    }))
  ]
})

// INSTANT OPEN - Fetches data in the background
function openDmModal() {
  showDmModal.value = true 
  
  if (workspaceStore.currentWorkspaceId) {
    workspaceStore.refreshWorkspaceMembers(workspaceStore.currentWorkspaceId).catch(console.error)
  }
}

async function handleCreateChannel(payload: ChannelPayload) {
  if (!teamStore.currentTeamId || !workspaceStore.currentWorkspaceId) {
    return
  }

  const result = await channelStore.createChannel({
    name: payload.name,
    description: payload.description,
    workspace_id: workspaceStore.currentWorkspaceId,
    team_id: teamStore.currentTeamId,
    type: payload.type as any,
    isPrivate: payload.isPrivate
  } as any)

  if (result.success) {
    showCreateChannelModal.value = false
  }
}

async function handleStartDm(member: DmMember) {
  if (!workspaceStore.currentWorkspaceId) return
  
  const result = await channelStore.createDirectChannel(
    workspaceStore.currentWorkspaceId,
    member.id,
    member.name
  )
  
  if (result.success) {
    showDmModal.value = false
  }
}

function handleWorkspaceChange(workspaceId: string) {
  workspaceStore.setCurrentWorkspace(workspaceId)
  isWorkspaceDropdownOpen.value = false
  emit('navigate')
}

function handleTeamChange(teamId: string) {
  teamStore.setCurrentTeam(teamId)
  emit('navigate')
}

function handleChannelSelect(channelId: string) {
  channelStore.setCurrentChannel(channelId)
  emit('navigate')
}
</script>

<template>
  <div class="flex h-full min-h-0 w-full flex-1 text-[var(--ui-text)]">
    
    <div class="flex w-16 shrink-0 flex-col items-center overflow-y-auto border-r border-[var(--ui-border)] px-2 py-4 sm:py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      <p class="mb-3 text-[7px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Workspace
      </p>
      
      <div class="flex flex-col items-center mb-6 shrink-0 w-full">
        
        <AppTooltip :text="workspaceStore.currentWorkspace?.name" side="right">
          <button
            type="button"
            @click="isWorkspaceDropdownOpen = !isWorkspaceDropdownOpen"
            class="relative z-[101] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ui-primary)] text-xs font-bold text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)] ring-2 ring-transparent transition-all hover:ring-[var(--ui-primary)]/50"
          >
            {{ workspaceStore.currentWorkspace?.name?.slice(0,2).toUpperCase() || 'WS' }}
          </button>
        </AppTooltip>

        <div 
          v-if="isWorkspaceDropdownOpen" 
          class="absolute left-full top-4 z-[100] ml-2 w-56 overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-xl"
        >
          <div class="px-4 py-3 text-[10px] font-bold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/50">
            Switch Workspace
          </div>
          
          <div class="max-h-[400px] overflow-y-auto p-1.5 space-y-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              v-for="workspace in workspaceStore.workspaces"
              :key="workspace.id"
              @click="handleWorkspaceChange(workspace.id)"
              class="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left"
              :class="workspace.id === workspaceStore.currentWorkspaceId 
                ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-bold' 
                : 'text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)]'"
            >
              <AppTooltip :text="workspace.name" side="right">
                <span class="truncate pr-2">{{ workspace.name }}</span>
              </AppTooltip>
              <UIcon 
                v-if="workspace.id === workspaceStore.currentWorkspaceId" 
                name="i-lucide-check-circle-2" 
                class="h-4 w-4 shrink-0" 
              />
            </button>
          </div>
        </div>

        <div 
          v-if="isWorkspaceDropdownOpen" 
          @click="isWorkspaceDropdownOpen = false" 
          class="fixed inset-0 z-[90]"
        ></div>
      </div>

      <p class="mb-3 text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Teams
      </p>
      <div class="flex flex-col items-center gap-3 shrink-0">
        <AppTooltip
          v-for="team in teamItems"
          :key="team.id"
          :text="team.name"
          side="right"
        >
          <button
            type="button"
            @click="handleTeamChange(team.id)"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all"
            :class="team.active
              ? 'bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]'
              : 'bg-[var(--ui-bg-muted)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'"
          >
            {{ team.label }}
          </button>
        </AppTooltip>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div class="mb-4 shrink-0 flex flex-col min-w-0">
        <div class="mb-3 flex items-center justify-between shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">
            Channels
          </p>
          <button
            v-if="teamStore.currentTeamId"
            type="button"
            @click="showCreateChannelModal = true"
            class="text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] transition-colors shrink-0"
            title="Create channel"
          >
            <UIcon name="i-lucide-plus-circle" class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-1 max-h-[120px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div v-if="channelItems.length === 0" class="text-sm text-[var(--ui-text-muted)] pl-3">
            No channels yet
          </div>
          <button
            v-for="channel in channelItems"
            :key="channel.id"
            type="button"
            @click="handleChannelSelect(channel.id)"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="channel.active
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]'
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
          >
            <span class="opacity-50 shrink-0">#</span>
            <AppTooltip :text="channel.name" side="right">
              <span class="truncate">{{ channel.name }}</span>
            </AppTooltip>
          </button>
        </div>
      </div>

      <div class="shrink-0 min-w-0">
        <div class="mb-3 flex items-center justify-between shrink-0">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">
            Direct messages
          </p>
          <button
            v-if="workspaceStore.currentWorkspaceId"
            type="button"
            @click="openDmModal" 
            class="text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] transition-colors shrink-0"
            title="Search members to message"
          >
            <UIcon name="i-lucide-search" class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-1 max-h-[120px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div v-if="directMessages.length === 0" class="text-sm text-[var(--ui-text-muted)] pl-3">
            No direct messages
          </div>
          
          <button
            v-for="dm in directMessages"
            :key="dm.id"
            type="button"
            @click="handleChannelSelect(dm.id)"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="dm.active 
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]' 
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
          >
            <span class="h-2.5 w-2.5 rounded-full shrink-0" :class="dm.online ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-border-accented)]'" />
            <AppTooltip :text="dm.name" side="right">
              <span class="truncate">{{ dm.name }}</span>
            </AppTooltip>
          </button>
        </div>
      </div>
    </div>
  </div>

  <ChannelModal
    v-model:open="showCreateChannelModal"
    mode="create"
    :team-name="teamStore.currentTeam?.name"
    :loading="channelStore.loading"
    @submit="handleCreateChannel"
    @cancel="showCreateChannelModal = false"
  />

  <DmModal
    v-model:open="showDmModal"
    :members="availableWorkspaceMembers"
    :loading="channelStore.loading"
    @select="handleStartDm"
    @cancel="showDmModal = false"
  />
</template>
