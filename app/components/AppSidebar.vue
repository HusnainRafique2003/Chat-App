<script setup lang="ts">
import { computed, ref } from 'vue'
import WorkspaceModal from '~/components/modals/WorkspaceModal.vue'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const workspaceStore = useWorkspaceStore()
const openCreateModal = ref<boolean>(false)

const workspaceItems = computed(() => 
  workspaceStore.workspaces.map(w => ({
    id: w.id,
    label: w.name.slice(0,2).toUpperCase(),
    active: w.id === workspaceStore.currentWorkspaceId
  }))
)

interface SidebarItem {
  id: string
  name?: string
  active?: boolean
  online?: boolean
  label?: string
}

const channelItems: SidebarItem[] = []
const directMessages: SidebarItem[] = []

</script>

<template>
  <aside class="flex h-screen w-[320px] border-r border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)]">
    <div class="flex w-24 flex-col items-center border-r border-[var(--ui-border)] px-4 py-6">
      <p class="mb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ui-text-dimmed)]">
        Workspaces
      </p>

      <div class="flex flex-col items-center gap-3">
        <button
          v-for="workspace in workspaceItems"
          :key="workspace.id"
          type="button"
          @click="workspaceStore.setCurrentWorkspace(workspace.id)"
          class="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold transition-all"
          :class="workspace.active
            ? 'bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]'
            : 'bg-[var(--ui-bg-muted)] text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'"
        >
          {{ workspace.label }}
        </button>
        <button
          @click="openCreateModal = true"
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ui-bg-muted)] text-[var(--ui-text-dimmed)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)] transition-all"
          title="Create workspace"
        >
          <UIcon name="i-lucide-plus" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col px-4 py-6">
      <div class="mb-8">
        <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">
          Workspace
        </p>
        <h2 class="mt-2 text-lg font-black text-[var(--ui-text-highlighted)]">{{ workspaceStore.currentWorkspace?.name || 'No workspace selected' }}</h2>
        <p class="mt-2 text-sm leading-6 text-[var(--ui-text-muted)]">
          {{ workspaceStore.currentWorkspace?.description || 'Loading...' }}
        </p>
      </div>

      <div class="mb-8">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">
            Channels
          </p>
          <UIcon name="i-lucide-plus-circle" class="h-4 w-4 text-[var(--ui-text-dimmed)]" />
        </div>

        <div class="space-y-1">
          <div v-if="channelItems.length === 0" class="text-sm text-[var(--ui-text-muted)]">
            No channels yet
          </div>
          <button
            v-for="channel in channelItems"
            :key="channel.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="channel.active
              ? 'bg-[var(--ui-bg-muted)] font-semibold text-[var(--ui-text-highlighted)]'
              : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-muted)]/70'"
          >
            <span class="opacity-50">#</span>
            <span class="truncate">{{ channel.name }}</span>
          </button>
        </div>
      </div>

      <div class="mt-auto">
        <p class="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">
          Direct messages
        </p>

        <div class="space-y-2">
          <div
            v-for="dm in directMessages"
            :key="dm.id"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--ui-text-muted)]"
          >
            <span class="h-2.5 w-2.5 rounded-full" :class="dm.online ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-border-accented)]'" />
            <span class="truncate">{{ dm.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <WorkspaceModal 
    v-model:open="openCreateModal"
    mode="create"
    @submit="(payload) => {
      const { name, description } = payload
      workspaceStore.createWorkspace({ name, description }).then((result) => {
        if (result?.success) {
          console.log('Workspace created:', result)
          openCreateModal.value = false
        } else {
          console.error('Create error:', result?.error)
        }
      })
    }"
    @cancel="openCreateModal = false"
  />

</template>

