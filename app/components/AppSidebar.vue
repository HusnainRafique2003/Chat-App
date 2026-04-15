<script setup lang="ts">
import { useToast } from '#ui/composables/useToast'
import { computed, onMounted, ref } from 'vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

import ChannelModal from './modals/ChannelModal.vue'
import ConfirmDeleteModal from './modals/ConfirmDeleteModal.vue'
import DmModal from './modals/DmModal.vue'
import TeamModal from './modals/TeamModal.vue'
import WorkspaceModal from './modals/WorkspaceModal.vue'

import type { ChannelPayload } from './modals/ChannelModal.vue'
import type { DmMember } from './modals/DmModal.vue'
import type { TeamPayload } from './modals/TeamModal.vue'
import type { WorkspacePayload } from './modals/WorkspaceModal.vue'

// const emit = defineEmits(['navigate']) // unused

const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const userStore = useUserStore()
const toast = useToast()

const isWorkspaceDropdownOpen = ref(false)
const isTeamDropdownOpen = ref(false)

// Modals State
const showCreateChannelModal = ref(false)
const showEditChannelModal = ref(false)
const showDeleteChannelModal = ref(false)
const activeChannelForAction = ref<any>(null)

const showDmModal = ref(false)

const showWorkspaceModal = ref(false)
const workspaceModalMode = ref<'create' | 'update'>('create')
const activeWorkspaceForAction = ref<any>(null)
const showDeleteWorkspaceModal = ref(false)

const showTeamModal = ref(false)
const teamModalMode = ref<'create' | 'update'>('create')
const activeTeamForAction = ref<{ id: string; name: string; description: string; color: string } | null>(null)
const showDeleteTeamModal = ref(false)

// Track DMs opened during this session (Persisted to LocalStorage)
const activeDmIds = ref<string[]>([])

onMounted(() => {
  try {
    const saved = localStorage.getItem('chat-active-dms')
    if (saved) {
      activeDmIds.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load active DMs')
  }
})

// === PERMISSION COMPUTEDS ===
const workspaceItems = computed(() => {
  const myId = userStore.user?.id || (userStore.user as any)?._id
  return workspaceStore.workspaces.map((w) => {
    const isCreator = w.creator_id === myId || (w as any).created_id === myId || (w as any).created_by === myId || (w as any).owner_id === myId || (w as any).user_id === myId
    const isAdmin = w.members?.some((m: any) => (m.user_id === myId || m.id === myId || m._id === myId) && ['admin', 'owner', 'creator'].includes(m.role?.toLowerCase()))

    return {
      id: w.id,
      name: w.name,
      label: w.name.slice(0, 2).toUpperCase(),
      active: w.id === workspaceStore.currentWorkspaceId,
      canManage: Boolean(myId && (isCreator || isAdmin))
    }
  })
})

const teamItems = computed(() => {
  const myId = userStore.user?.id || (userStore.user as any)?._id
  return teamStore.teams.map((t) => {
    const isCreator = t.creator_id === myId || (t as any).created_id === myId || (t as any).created_by === myId || (t as any).owner_id === myId || (t as any).user_id === myId
    const isAdmin = t.members?.some((m: any) => (m.user_id === myId || m.id === myId || m._id === myId) && ['admin', 'owner', 'creator'].includes(m.role?.toLowerCase()))

    return {
      id: t.id,
      name: t.name,
      label: t.name.slice(0, 2).toUpperCase(),
      active: t.id === teamStore.currentTeamId,
      canManage: Boolean(myId && (isCreator || isAdmin))
    }
  })
})

const channelItems = computed(() => {
  const myId = userStore.user?.id || (userStore.user as any)?._id
  return channelStore.channels
    .filter(c => c.type !== 'direct' && c.team_id === teamStore.currentTeamId)
    .map((c) => {
      const isCreator = c.created_id === myId || (c as any).creator_id === myId || (c as any).created_by === myId || (c as any).owner_id === myId || (c as any).user_id === myId
      const isAdmin = c.members?.some((m: any) => (m.user_id === myId || m.id === myId || m._id === myId) && ['admin', 'owner', 'creator'].includes(m.role?.toLowerCase()))

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        active: c.id === channelStore.currentChannelId,
        canManage: Boolean(myId && (isCreator || isAdmin))
      }
    })
})

const workspaceMemberNameMap = computed(() => {
  const map = new Map<string, string>()

  for (const member of workspaceStore.currentWorkspace?.members || []) {
    const ids = [member?.id, (member as any)?._id, (member as any)?.user_id].filter(Boolean)
    const name = member?.name || 'Unknown User'

    ids.forEach(id => map.set(String(id), name))
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

const directMessages = computed(() =>
  channelStore.channels
    .filter(c =>
      c.type === 'direct'
      && c.team_id === teamStore.currentTeamId
      && (activeDmIds.value.includes(c.id) || c.id === channelStore.currentChannelId)
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

// === Channel Actions ===
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

// === Direct Messages ===
function openDmModal() {
  showDmModal.value = true
  if (workspaceStore.currentWorkspaceId) {
    workspaceStore.refreshWorkspaceMembers(workspaceStore.currentWorkspaceId).catch(console.error)
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
    if (!activeDmIds.value.includes(result.channel.id)) {
      activeDmIds.value.push(result.channel.id)
      localStorage.setItem('chat-active-dms', JSON.stringify(activeDmIds.value))
    }
    showDmModal.value = false
  }
}

// === Workspace Actions ===
function openCreateWorkspace() {
  workspaceModalMode.value = 'create'
  activeWorkspaceForAction.value = null
  showWorkspaceModal.value = true
  isWorkspaceDropdownOpen.value = false
}

function openEditWorkspace(workspace: any) {
  workspaceModalMode.value = 'update'
  activeWorkspaceForAction.value = workspace
  showWorkspaceModal.value = true
  isWorkspaceDropdownOpen.value = false
}

function openDeleteWorkspace(workspace: any) {
  activeWorkspaceForAction.value = workspace
  showDeleteWorkspaceModal.value = true
  isWorkspaceDropdownOpen.value = false
}

async function submitWorkspace(payload: WorkspacePayload) {
  if (workspaceModalMode.value === 'create') {
    const res = await workspaceStore.createWorkspace({ name: payload.name, description: payload.description })
    if (res.success) {
      showWorkspaceModal.value = false
      toast.add({ title: 'Workspace created', color: 'success' })
    } else {
      toast.add({ title: res.error || 'Error', color: 'error' })
    }
  } else {
    const res = await workspaceStore.updateWorkspace(activeWorkspaceForAction.value.id, { name: payload.name, description: payload.description })
    if (res.success) {
      showWorkspaceModal.value = false
      toast.add({ title: 'Workspace updated', color: 'success' })
    } else {
      toast.add({ title: res.error || 'Error', color: 'error' })
    }
  }
}

async function submitDeleteWorkspace() {
  if (!activeWorkspaceForAction.value) return
  const res = await workspaceStore.deleteWorkspace(activeWorkspaceForAction.value.id)
  if (res.success) {
    showDeleteWorkspaceModal.value = false
    toast.add({ title: 'Workspace deleted', color: 'success' })
  } else {
    toast.add({ title: res.error || 'Error', color: 'error' })
  }
}

// === Team Actions ===
function openCreateTeam() {
  teamModalMode.value = 'create'
  activeTeamForAction.value = null
  showTeamModal.value = true
  isTeamDropdownOpen.value = false
}

function openEditTeam(teamId: string) {
  const fullTeam = teamStore.teams.find(t => t.id === teamId)
  if (fullTeam) {
    teamModalMode.value = 'update'
    activeTeamForAction.value = fullTeam
    showTeamModal.value = true
    isTeamDropdownOpen.value = false
  }
}

function openDeleteTeam(teamId: string) {
  const fullTeam = teamStore.teams.find(t => t.id === teamId)
  if (fullTeam) {
    activeTeamForAction.value = fullTeam
    showDeleteTeamModal.value = true
    isTeamDropdownOpen.value = false
  }
}

async function submitTeam(payload: TeamPayload) {
  if (!workspaceStore.currentWorkspaceId) {
    toast.add({ title: 'Select a workspace first', color: 'error' })
    return
  }

  if (teamModalMode.value === 'create') {
    const res = await teamStore.createTeam({
      workspace_id: workspaceStore.currentWorkspaceId,
      name: payload.name,
      description: payload.description,
      color: payload.color
    })
    if (res.success) {
      showTeamModal.value = false
      toast.add({ title: 'Team created', color: 'success' })
    } else {
      toast.add({ title: res.error || 'Error', color: 'error' })
    }
  } else {
    const res = await teamStore.updateTeam(activeTeamForAction.value.id, {
      name: payload.name,
      description: payload.description,
      color: payload.color
    })
    if (res.success) {
      showTeamModal.value = false
      toast.add({ title: 'Team updated', color: 'success' })
    } else {
      toast.add({ title: res.error || 'Error', color: 'error' })
    }
  }
}

async function submitDeleteTeam() {
  if (!activeTeamForAction.value) return
  const res = await teamStore.deleteTeam(activeTeamForAction.value.id)
  if (res.success) {
    showDeleteTeamModal.value = false
    toast.add({ title: 'Team deleted', color: 'success' })
  } else {
    toast.add({ title: res.error || 'Error', color: 'error' })
  }
}

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
    <div class="relative z-50 flex w-16 flex-col items-center border-r border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 py-5 shrink-0">
      <p class="mb-3 text-[7px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Workspace
      </p>

      <div class="relative flex flex-col items-center mb-6 shrink-0 w-full gap-2">
        <button
          type="button"
          :title="workspaceStore.currentWorkspace?.name"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)] ring-2 ring-transparent hover:ring-[var(--ui-primary)]/50 relative z-[101]"
          @click="isWorkspaceDropdownOpen = !isWorkspaceDropdownOpen; isTeamDropdownOpen = false"
        >
          {{ workspaceStore.currentWorkspace?.name?.slice(0, 2).toUpperCase() || 'WS' }}
        </button>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[var(--ui-border)] text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
          title="Create Workspace"
          @click="openCreateWorkspace"
        >
          <UIcon
            name="i-lucide-plus"
            class="h-4 w-4"
          />
        </button>

        <ClientOnly>
          <Teleport to="body">
            <div
              v-if="isWorkspaceDropdownOpen"
              class="fixed left-[76px] top-[114px] z-[100] w-64 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
            >
              <div class="px-4 py-3 text-[10px] font-bold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/50">
                Switch Workspace
              </div>

              <div class="max-h-[60vh] overflow-y-auto p-1.5 space-y-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div
                  v-for="workspace in workspaceItems"
                  :key="workspace.id"
                  class="group relative w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left"
                  :class="workspace.active
                    ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-bold'
                    : 'text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)]'"
                >
                  <button
                    class="flex-1 truncate pr-2 text-left outline-none"
                    @click="workspaceStore.setCurrentWorkspace(workspace.id); isWorkspaceDropdownOpen = false"
                  >
                    {{ workspace.name }}
                  </button>

                  <div class="shrink-0 flex items-center min-h-[24px]">
                    <UIcon
                      v-if="workspace.active"
                      name="i-lucide-check-circle-2"
                      class="h-4 w-4 shrink-0 transition-opacity group-hover:opacity-0 absolute right-3"
                    />

                    <div
                      v-if="workspace.canManage"
                      class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 bg-[var(--ui-bg)]/90 backdrop-blur-sm rounded-md relative z-10"
                    >
                      <button
                        class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors"
                        title="Edit Workspace"
                        @click.stop="openEditWorkspace(workspace)"
                      >
                        <UIcon
                          name="i-mdi-pencil"
                          class="h-3.5 w-3.5"
                        />
                      </button>
                      <button
                        class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/10 text-[var(--ui-text-muted)] hover:text-red-500 transition-colors"
                        title="Delete Workspace"
                        @click.stop="openDeleteWorkspace(workspace)"
                      >
                        <UIcon
                          name="i-mdi-trash-can-outline"
                          class="h-3.5 w-3.5"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="isWorkspaceDropdownOpen"
              class="fixed inset-0 z-[90]"
              @click="isWorkspaceDropdownOpen = false"
            />
          </Teleport>
        </ClientOnly>
      </div>

      <p class="mb-3 text-[7px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)] shrink-0">
        Teams
      </p>

      <div class="relative flex flex-col items-center mb-6 shrink-0 w-full gap-2">
        <button
          type="button"
          :title="teamStore.currentTeam?.name"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)] ring-2 ring-transparent hover:ring-[var(--ui-primary)]/50 relative z-[101]"
          @click="isTeamDropdownOpen = !isTeamDropdownOpen; isWorkspaceDropdownOpen = false"
        >
          {{ teamStore.currentTeam?.name?.slice(0, 2).toUpperCase() || 'TM' }}
        </button>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[var(--ui-border)] text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
          title="Create Team"
          @click="openCreateTeam"
        >
          <UIcon
            name="i-lucide-plus"
            class="h-4 w-4"
          />
        </button>

        <ClientOnly>
          <Teleport to="body">
            <div
              v-if="isTeamDropdownOpen"
              class="fixed left-[76px] top-[240px] z-[100] w-64 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
            >
              <div class="px-4 py-3 text-[10px] font-bold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/50">
                Switch Team
              </div>

              <div class="max-h-[60vh] overflow-y-auto p-1.5 space-y-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div
                  v-for="team in teamItems"
                  :key="team.id"
                  class="group relative w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors text-left"
                  :class="team.active
                    ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-bold'
                    : 'text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)]'"
                >
                  <button
                    class="flex-1 truncate pr-2 text-left outline-none"
                    @click="teamStore.setCurrentTeam(team.id); isTeamDropdownOpen = false"
                  >
                    {{ team.name }}
                  </button>

                  <div class="shrink-0 flex items-center min-h-[24px]">
                    <UIcon
                      v-if="team.active"
                      name="i-lucide-check-circle-2"
                      class="h-4 w-4 shrink-0 transition-opacity group-hover:opacity-0 absolute right-3"
                    />

                    <div
                      v-if="team.canManage"
                      class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 bg-[var(--ui-bg)]/90 backdrop-blur-sm rounded-md relative z-10"
                    >
                      <button
                        class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors"
                        title="Edit Team"
                        @click.stop="openEditTeam(team.id)"
                      >
                        <UIcon
                          name="i-mdi-pencil"
                          class="h-3.5 w-3.5"
                        />
                      </button>
                      <button
                        class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/10 text-[var(--ui-text-muted)] hover:text-red-500 transition-colors"
                        title="Delete Team"
                        @click.stop="openDeleteTeam(team.id)"
                      >
                        <UIcon
                          name="i-mdi-trash-can-outline"
                          class="h-3.5 w-3.5"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="isTeamDropdownOpen"
              class="fixed inset-0 z-[90]"
              @click="isTeamDropdownOpen = false"
            />
          </Teleport>
        </ClientOnly>
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
            class="text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] transition-colors shrink-0"
            title="Create channel"
            @click="showCreateChannelModal = true"
          >
            <UIcon
              name="i-lucide-plus-circle"
              class="h-4 w-4"
            />
          </button>
        </div>

        <div class="space-y-1 max-h-[120px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div
            v-if="channelItems.length === 0"
            class="text-sm text-[var(--ui-text-muted)] pl-3"
          >
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
              class="flex flex-1 items-center gap-2 truncate text-left px-1 py-1"
              @click="channelStore.setCurrentChannel(channel.id)"
            >
              <span class="opacity-50 shrink-0 flex items-center justify-center w-3 h-3">
                <UIcon
                  v-if="channel.type === 'private'"
                  name="i-lucide-lock"
                  class="h-3 w-3"
                />
                <span v-else>#</span>
              </span>
              <span class="truncate">{{ channel.name }}</span>
            </button>

            <div
              v-if="channel.canManage"
              class="shrink-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              :class="{ 'opacity-100': channel.active }"
            >
              <button
                type="button"
                class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors cursor-pointer"
                title="Edit Channel"
                @click.stop="openEditModal(channel)"
              >
                <UIcon
                  name="i-mdi-pencil"
                  class="h-3.5 w-3.5 pointer-events-none"
                />
              </button>

              <button
                type="button"
                class="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/10 text-[var(--ui-text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                title="Delete Channel"
                @click.stop="openDeleteModal(channel)"
              >
                <UIcon
                  name="i-mdi-trash-can-outline"
                  class="h-3.5 w-3.5 pointer-events-none"
                />
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
            class="text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] transition-colors shrink-0"
            title="Search members to message"
            @click="openDmModal"
          >
            <UIcon
              name="i-lucide-search"
              class="h-4 w-4"
            />
          </button>
        </div>

        <div class="space-y-1 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div
            v-if="directMessages.length === 0"
            class="text-sm text-[var(--ui-text-muted)] pl-3"
          >
            No direct messages
          </div>

          <button
            v-for="dm in directMessages"
            :key="dm.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="dm.active
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]'
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
            @click="channelStore.setCurrentChannel(dm.id)"
          >
            <span
              class="h-2.5 w-2.5 rounded-full shrink-0"
              :class="dm.online ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-border-accented)]'"
            />
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
    :initial="{
      name: activeChannelForAction?.name || '',
      description: activeChannelForAction?.description || '',
      type: activeChannelForAction?.type as any,
      isPrivate: activeChannelForAction?.type === 'private'
    }"
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

  <WorkspaceModal
    v-model:open="showWorkspaceModal"
    :mode="workspaceModalMode"
    :initial="{ name: activeWorkspaceForAction?.name || '', description: activeWorkspaceForAction?.description || '' }"
    :loading="workspaceStore.loading"
    @submit="submitWorkspace"
    @cancel="showWorkspaceModal = false"
  />
  <ConfirmDeleteModal
    v-model:open="showDeleteWorkspaceModal"
    entity-type="workspace"
    :entity-name="activeWorkspaceForAction?.name || ''"
    :loading="workspaceStore.loading"
    @confirm="submitDeleteWorkspace"
    @cancel="showDeleteWorkspaceModal = false"
  />

  <TeamModal
    v-model:open="showTeamModal"
    :mode="teamModalMode"
    :workspace-name="workspaceStore.currentWorkspace?.name"
    :initial="{ name: activeTeamForAction?.name || '', description: activeTeamForAction?.description || '', color: activeTeamForAction?.color || 'bg-indigo-500' }"
    :loading="teamStore.loading"
    @submit="submitTeam"
    @cancel="showTeamModal = false"
  />
  <ConfirmDeleteModal
    v-model:open="showDeleteTeamModal"
    entity-type="team"
    :entity-name="activeTeamForAction?.name || ''"
    :loading="teamStore.loading"
    @confirm="submitDeleteTeam"
    @cancel="showDeleteTeamModal = false"
  />
</template>
