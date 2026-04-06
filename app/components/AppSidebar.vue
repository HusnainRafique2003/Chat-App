<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()

const showCreateChannelModal = ref(false)
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
    label: t.name.slice(0,2).toUpperCase(), // Added 2-letter label for the new UI
    active: t.id === teamStore.currentTeamId
  }))
)

const channelItems = computed(() =>
  channelStore.channels.map(c => ({
    id: c.id,
    name: c.name,
    active: c.id === channelStore.currentChannelId
  }))
)

interface SidebarItem {
  id: string
  name?: string
  active?: boolean
  online?: boolean
  label?: string
}

const directMessages: SidebarItem[] = []

async function handleCreateChannel() {
  if (!newChannelName.value.trim() || !teamStore.currentTeamId || !workspaceStore.currentWorkspaceId) {
    return
  }

  const result = await channelStore.createChannel({
    name: newChannelName.value.trim(),
    workspace_id: workspaceStore.currentWorkspaceId,
    team_id: teamStore.currentTeamId
  })

  if (result.success) {
    newChannelName.value = ''
    showCreateChannelModal.value = false
  }
}
</script>
<template>
  <div class="flex flex-1 min-h-0 w-full text-[var(--ui-text)]">
    
    <div class="flex w-16 flex-col items-center border-r border-[var(--ui-border)] px-2 py-5 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
      
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

    <div class="flex min-w-0 flex-1 flex-col px-4 py-5 overflow-y-auto">
      
      <div class="mb-8 shrink-0 min-w-0">
        <h2 class="text-lg font-black leading-tight text-[var(--ui-text-highlighted)] truncate" :title="workspaceStore.currentWorkspace?.name">
          {{ workspaceStore.currentWorkspace?.name || 'No workspace selected' }}
        </h2>
        <p class="mt-1 text-sm font-semibold text-[var(--ui-text-muted)] truncate" :title="teamStore.currentTeam?.name">
          {{ teamStore.currentTeam?.name || 'No team selected' }}
        </p>
      </div>

      <div class="mb-8 shrink-0 flex flex-col min-w-0">
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

        <div class="space-y-1 max-h-[152px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div v-if="channelItems.length === 0" class="text-sm text-[var(--ui-text-muted)]">
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
        <p class="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">
          Direct messages
        </p>

        <div class="space-y-2 max-h-[152px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div
            v-for="dm in directMessages"
            :key="dm.id"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--ui-text-muted)]"
          >
            <span class="h-2.5 w-2.5 rounded-full shrink-0" :class="dm.online ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-border-accented)]'" />
            <span class="truncate">{{ dm.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showCreateChannelModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-lg w-96">
      <h3 class="text-lg font-bold text-[var(--ui-text-highlighted)]">Create Channel</h3>
      <p class="mt-2 text-sm text-[var(--ui-text-muted)]">Create a new public channel in this team</p>

      <input
        v-model="newChannelName"
        type="text"
        placeholder="Channel name"
        class="mt-4 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-3 py-2 text-[var(--ui-text)] placeholder-[var(--ui-text-muted)]"
        @keyup.enter="handleCreateChannel"
      />

      <div class="mt-6 flex gap-3">
        <button
          @click="handleCreateChannel"
          class="flex-1 rounded-lg bg-[var(--ui-primary)] px-4 py-2 font-semibold text-[var(--ui-primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Create
        </button>
        <button
          @click="showCreateChannelModal = false"
          class="flex-1 rounded-lg border border-[var(--ui-border)] px-4 py-2 font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>