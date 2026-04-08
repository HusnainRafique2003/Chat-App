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

const showCreateChannelModal = ref(false)
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
    .filter(c => c.type === 'direct')
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
</script>

<template>
  <div class="flex flex-1 min-h-0 h-full w-full text-[var(--ui-text)]">
    
    <div class="flex w-16 flex-col items-center border-r border-[var(--ui-border)] px-2 py-5 overflow-y-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      <p class="mb-3 text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Workspace
      </p>
      <div class="flex flex-col items-center gap-3 mb-6 shrink-0">
        <button
          v-for="workspace in workspaceItems"
          :key="workspace.id"
          type="button"
          :title="workspace.name"
          @click="workspaceStore.setCurrentWorkspace(workspace.id)"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all"
          :class="workspace.active
            ? 'bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]'
            : 'bg-[var(--ui-bg-muted)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'"
        >
          {{ workspace.label }}
        </button>
      </div>

      <p class="mb-3 text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Teams
      </p>
      <div class="flex flex-col items-center gap-3 shrink-0">
        <button
          v-for="team in teamItems"
          :key="team.id"
          type="button"
          :title="team.name"
          @click="teamStore.setCurrentTeam(team.id)"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all"
          :class="team.active
            ? 'bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]'
            : 'bg-[var(--ui-bg-muted)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'"
        >
          {{ team.label }}
        </button>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col px-4 py-5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
            @click="channelStore.setCurrentChannel(channel.id)"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="channel.active
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]'
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
          >
            <span class="opacity-50 shrink-0">#</span>
            <span class="truncate">{{ channel.name }}</span>
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
            @click="channelStore.setCurrentChannel(dm.id)"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="dm.active 
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]' 
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
          >
            <span class="h-2.5 w-2.5 rounded-full shrink-0" :class="dm.online ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-border-accented)]'" />
            <span class="truncate">{{ dm.name }}</span>
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
