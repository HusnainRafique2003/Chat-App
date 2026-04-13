<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import { useToast } from '#ui/composables/useToast'

import ChannelModal from './modals/ChannelModal.vue'
import DmModal from './modals/DmModal.vue'
import ConfirmDeleteModal from './modals/ConfirmDeleteModal.vue'
import type { ChannelPayload } from './modals/ChannelModal.vue'
import type { DmMember } from './modals/DmModal.vue'

defineEmits<{
  navigate: []
}>()

const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const userStore = useUserStore()
const toast = useToast()

const showCreateChannelModal = ref(false)
const isWorkspaceDropdownOpen = ref(false)
const showDmModal = ref(false)

// Edit & Delete state
const showEditChannelModal = ref(false)
const showDeleteChannelModal = ref(false)
const activeChannelForAction = ref<any>(null)

// Track DMs opened during this session (Persisted to LocalStorage)
const activeDmIds = ref<string[]>([])

onMounted(() => {
  // Load saved DMs from the browser so they survive a refresh
  try {
    const saved = localStorage.getItem('chat-active-dms')
    if (saved) {
      activeDmIds.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load active DMs')
  }
})

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

function getDirectChannelName(channel: { name: string, members?: Array<{ user_id?: string, id?: string }>, direct_user_id?: string, user_id?: string }) {
  const currentUserId = userStore.user?.id || (userStore.user as any)?._id
  const fallbackName = channel.name.replace('DM: ', '')

  let otherMemberId = channel.direct_user_id || channel.user_id

  if (!otherMemberId && channel.members) {
    const otherMember = channel.members.find((member: any) => {
      const memberId = member.user_id || member.id || member._id
      return memberId && memberId !== currentUserId
    })
    if (otherMember) {
      otherMemberId = otherMember.user_id || otherMember.id || otherMember._id
    }
  }

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
    .filter(c => c.type !== 'direct' && c.team_id === teamStore.currentTeamId)
    .map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type,
      active: c.id === channelStore.currentChannelId
    }))
)

const directMessages = computed(() =>
  channelStore.channels
    .filter(c => 
      c.type === 'direct' && 
      c.team_id === teamStore.currentTeamId && 
      // Changed to .includes()
      (activeDmIds.value.includes(c.id) || c.id === channelStore.currentChannelId)
    )
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
    .filter(member => member && (member.id !== myId && (member as any)._id !== myId))
    .map(member => ({
      id: member.id || (member as any)._id || '',
      name: member.name || 'Unknown User',
      email: member.email || 'No email provided'
    }))
})

function openDmModal() {
  showDmModal.value = true 
  if (workspaceStore.currentWorkspaceId) {
    workspaceStore.refreshWorkspaceMembers(workspaceStore.currentWorkspaceId).catch(console.error)
  }
}

// Actions
async function handleCreateChannel(payload: ChannelPayload) {
  if (!teamStore.currentTeamId || !workspaceStore.currentWorkspaceId) return

  const result = await channelStore.createChannel({
    name: payload.name,
    description: payload.description,
    workspace_id: workspaceStore.currentWorkspaceId,
    team_id: teamStore.currentTeamId,
    type: payload.type as any,
    isPrivate: payload.isPrivate
  } as any)

  if (result.success) showCreateChannelModal.value = false
}

async function submitUpdateChannel(payload: ChannelPayload) {
  if (!activeChannelForAction.value) return
  const result = await channelStore.updateChannel(activeChannelForAction.value.id, payload.name)
  if (result.success) {
    showEditChannelModal.value = false
    toast.add({ title: 'Channel updated successfully', color: 'success' })
  } else {
    toast.add({ title: result.error || 'Failed to update channel', color: 'error' })
  }
}

async function submitDeleteChannel() {
  if (!activeChannelForAction.value) return
  const result = await channelStore.deleteChannel(activeChannelForAction.value.id)
  if (result.success) {
    showDeleteChannelModal.value = false
    toast.add({ title: 'Channel deleted successfully', color: 'success' })
  } else {
    toast.add({ title: result.error || 'Failed to delete channel', color: 'error' })
  }
}

async function handleStartDm(member: DmMember) {
  if (!workspaceStore.currentWorkspaceId || !teamStore.currentTeamId) return
  
  const result = await channelStore.createDirectChannel(
    workspaceStore.currentWorkspaceId,
    teamStore.currentTeamId,
    member.id,
    member.name
  )
  
  if (result.success && result.channel) {
    // Save the new DM to LocalStorage so it persists
    if (!activeDmIds.value.includes(result.channel.id)) {
      activeDmIds.value.push(result.channel.id)
      localStorage.setItem('chat-active-dms', JSON.stringify(activeDmIds.value))
    }
    showDmModal.value = false
  }
}

// Open modals for a specific channel
function openEditModal(channel: any) {
  activeChannelForAction.value = channel
  showEditChannelModal.value = true
}

function openDeleteModal(channel: any) {
  activeChannelForAction.value = channel
  showDeleteChannelModal.value = true
}
</script>

<template>
  <div class="flex flex-1 min-h-0 h-full w-full text-[var(--ui-text)]">
    
    <div class="flex w-16 flex-col items-center border-r border-[var(--ui-border)] px-2 py-5 overflow-y-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      <p class="mb-3 text-[7px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Workspace
      </p>
      
      <div class="flex flex-col items-center mb-6 shrink-0 w-full">
        <button
          type="button"
          @click="isWorkspaceDropdownOpen = !isWorkspaceDropdownOpen"
          :title="workspaceStore.currentWorkspace?.name"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)] ring-2 ring-transparent hover:ring-[var(--ui-primary)]/50 relative z-[101]"
        >
          {{ workspaceStore.currentWorkspace?.name?.slice(0,2).toUpperCase() || 'WS' }}
        </button>

        <div 
          v-if="isWorkspaceDropdownOpen" 
          class="fixed left-16 top-5 z-[100] ml-2 w-56 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
        >
          <div class="px-4 py-3 text-[10px] font-bold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/50">
            Switch Workspace
          </div>
          
          <div class="max-h-[400px] overflow-y-auto p-1.5 space-y-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              v-for="workspace in workspaceStore.workspaces"
              :key="workspace.id"
              @click="workspaceStore.setCurrentWorkspace(workspace.id); isWorkspaceDropdownOpen = false"
              class="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left"
              :class="workspace.id === workspaceStore.currentWorkspaceId 
                ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-bold' 
                : 'text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)]'"
            >
              <span class="truncate pr-2">{{ workspace.name }}</span>
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

    <div class="flex min-w-0 flex-1 flex-col px-4 py-5 overflow-hidden">
      
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
          
          <div
            v-for="channel in channelItems"
            :key="channel.id"
            class="group flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm transition-colors relative"
            :class="channel.active
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]'
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
          >
            <button
              type="button"
              @click="channelStore.setCurrentChannel(channel.id)"
              class="flex flex-1 items-center gap-2 truncate text-left px-1 py-1"
            >
              <span class="opacity-50 shrink-0">#</span>
              <span class="truncate">{{ channel.name }}</span>
            </button>

            <div 
              class="shrink-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              :class="{ 'opacity-100': channel.active }"
            >
              <button
                type="button"
                @click.stop="openEditModal(channel)"
                class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors cursor-pointer"
                title="Edit Channel"
              >
                <UIcon name="i-mdi-pencil" class="h-3.5 w-3.5 pointer-events-none" />
              </button>
              
              <button
                type="button"
                @click.stop="openDeleteModal(channel)"
                class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/10 text-[var(--ui-text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                title="Delete Channel"
              >
                <UIcon name="i-mdi-trash-can-outline" class="h-3.5 w-3.5 pointer-events-none" />
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <div class="flex flex-col flex-1 min-h-0">
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

        <div class="space-y-1 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

  <ChannelModal
    v-model:open="showEditChannelModal"
    mode="update"
    :initial="{ name: activeChannelForAction?.name || '', description: activeChannelForAction?.description || '', type: activeChannelForAction?.type as any }"
    :loading="channelStore.loading"
    @submit="submitUpdateChannel"
    @cancel="showEditChannelModal = false"
  />

  <ConfirmDeleteModal
    v-model:open="showDeleteChannelModal"
    entity-type="channel"
    :entity-name="activeChannelForAction?.name || ''"
    :loading="channelStore.loading"
    @confirm="submitDeleteChannel"
    @cancel="showDeleteChannelModal = false"
  />

  <DmModal
    v-model:open="showDmModal"
    :members="availableWorkspaceMembers"
    :loading="channelStore.loading"
    @select="handleStartDm"
    @cancel="showDmModal = false"
  />
</template>