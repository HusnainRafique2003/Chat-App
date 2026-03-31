<script setup lang="ts">
import WorkspaceModal from '~/components/modals/WorkspaceModal.vue'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const workspaceCreateOpen = ref(false)
const workspaceUpdateOpen = ref(false)

const toast = useToast()

if (!userStore.isLoggedIn) {
  await navigateTo('/auth/login')
}

// Auto-fetch on mount + debug token
onMounted(() => {
  console.log('Dashboard token:', userStore.token)
  console.log('Dashboard user:', userStore.user)
  workspaceStore.fetchWorkspaces()
})

async function handleCreateWorkspace(payload: any) {
  const result = await workspaceStore.createWorkspace({ name: payload.name, description: payload.description })
  if (result.success) {
    toast.success('Workspace created!')
    workspaceCreateOpen.value = false
  } else {
    toast.error(result.error || 'Failed to create workspace')
  }
}

async function handleUpdateWorkspace(payload: any) {
  const result = await workspaceStore.updateWorkspace({ workspace_id: payload.id, name: payload.name, description: payload.description })
  if (result.success) {
    $toast.success('Workspace updated!')
    workspaceUpdateOpen.value = false
  } else {
    $toast.error(result.error || 'Failed to update workspace')
  }
}

function selectWorkspace(id: string) {
  workspaceStore.setCurrentWorkspace(id)
}
</script>

<template>
  <div class="h-screen flex bg-[var(--ui-bg-muted)]">
    <!-- Slack-like Sidebar -->
    <aside class="w-72 border-r border-[var(--ui-border)] bg-[var(--ui-bg)] flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-[var(--ui-border-muted)] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="i-mdi-rocket-launch" class="w-8 h-8 text-[var(--ui-success)]" />
          <span class="font-bold text-lg text-[var(--ui-text)]">Workspaces</span>
        </div>
        <BaseButton 
          label="+" 
          size="sm" 
          color="primary" 
          variant="ghost"
          square
          @click="workspaceCreateOpen = true"
        />
      </div>

      <!-- Workspaces List -->
      <div class="flex-1 overflow-auto p-2 space-y-1">
        <div v-if="workspaceStore.loading" class="flex items-center justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--ui-text-muted)]" />
        </div>
        <template v-else>
          <div 
            v-for="workspace in workspaceStore.workspaces" 
            :key="workspace.id"
            class="group flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--ui-bg-elevated)] cursor-pointer transition-colors"
            :class="{ 'bg-[var(--ui-primary)]/10 ring-2 ring-[var(--ui-primary)] ring-inset text-[var(--ui-primary)]': workspaceStore.currentWorkspaceId === workspace.id }"
            @click="selectWorkspace(workspace.id)"
          >
            <Icon :name="workspace.icon || 'i-mdi-briefcase'" class="w-6 h-6 flex-shrink-0 opacity-80 group-hover:opacity-100" />
            <div class="min-w-0 flex-1">
              <p class="font-medium truncate">{{ workspace.name }}</p>
              <p class="text-xs text-[var(--ui-text-muted)] truncate">{{ workspace.members.length }} members</p>
            </div>
            <Icon name="i-mdi-chevron-right" class="w-4 h-4 text-[var(--ui-text-muted)] opacity-0 group-hover:opacity-100 ml-auto" />
          </div>
          <p v-if="!workspaceStore.loading && workspaceStore.workspaces.length === 0" class="text-center text-[var(--ui-text-muted)] py-8">
            No workspaces yet. Create one to get started!
          </p>
        </template>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="border-b border-[var(--ui-border)] p-4 bg-[var(--ui-bg)] flex items-center gap-4">
        <BaseButton 
          icon="i-mdi-menu" 
          size="sm" 
          color="neutral" 
          variant="ghost"
          square
        />
        <div class="flex items-center gap-2">
          <Icon name="i-mdi-briefcase" class="w-5 h-5 text-[var(--ui-primary)]" />
          <div>
            <h1 class="font-semibold text-[var(--ui-text)]">{{ workspaceStore.currentWorkspace?.name || 'Select a workspace' }}</h1>
            <p class="text-xs text-[var(--ui-text-muted)]">Workspace • {{ workspaceStore.currentWorkspace?.members.length || 0 }} members</p>
          </div>
        </div>
        <div class="flex-1" />
        <BaseButton label="New Channel" color="primary" size="sm" />
      </header>

      <!-- Workspace Content -->
      <div class="flex-1 overflow-auto p-8">
        <div v-if="!workspaceStore.currentWorkspace" class="flex flex-col items-center justify-center h-full text-[var(--ui-text-muted)]">
          <Icon name="i-mdi-briefcase-off-outline" class="w-16 h-16 mb-4 opacity-50" />
          <h2 class="text-2xl font-semibold mb-2">Select a workspace</h2>
          <p class="text-lg mb-8">Choose a workspace from the sidebar to start chatting</p>
          <BaseButton label="Create First Workspace" color="success" @click="workspaceCreateOpen = true" />
        </div>

        <div v-else class="max-w-4xl mx-auto">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-3xl font-black text-[var(--ui-text)]">{{ workspaceStore.currentWorkspace.name }}</h1>
              <p class="text-lg text-[var(--ui-text-muted)]">{{ workspaceStore.currentWorkspace.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <BaseButton label="Invite Members" color="secondary" size="sm" />
              <BaseButton label="Settings" color="neutral" size="sm" variant="ghost" />
            </div>
          </div>

          <!-- Channels List Stub -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BaseCard title="Channels" icon="i-mdi-pound" color="primary">
              <div class="space-y-2">
                <div v-for="i in 8" :key="i" class="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--ui-bg-elevated)] cursor-pointer">
                  <div class="w-2 h-2 bg-[var(--ui-success)] rounded-full" />
                  <span class="font-medium"># general</span>
                  <div class="flex-1" />
                  <span class="text-xs text-[var(--ui-text-muted)]">24 new</span>
                </div>
              </div>
            </BaseCard>

            <BaseCard title="Team Members" icon="i-mdi-account-group" color="secondary">
              <div class="space-y-2">
                <div v-for="member in workspaceStore.currentWorkspace.members.slice(0, 6)" :key="member.id" class="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--ui-bg-elevated)]">
                  <div class="w-10 h-10 bg-[var(--ui-primary)] rounded-full flex items-center justify-center text-white font-semibold">
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium truncate">{{ member.name }}</p>
                    <p class="text-xs text-[var(--ui-text-muted)] truncate">{{ member.email }}</p>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
<WorkspaceModal 
      v-model:open="workspaceCreateOpen" 
      mode="create"
      :loading="workspaceStore.loading"
      @submit="handleCreateWorkspace"
      @cancel="workspaceCreateOpen = false"
    />
  </div>
</template>

