<script setup lang="ts">
import { navigateTo } from '#app'
import { onMounted, watch, computed, ref } from 'vue'
import AppSidebar from '~/components/AppSidebar.vue'
import ChannelHeader from '~/components/ChannelHeader.vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()

// --- Computed Member List ---
const workspaceMembers = computed(() => workspaceStore.currentWorkspace?.members || [])

// --- Logic ---
async function handleLogout() {
  await userStore.logout()
  await navigateTo('/auth/login')
}

onMounted(() => {
  if (userStore.token && userStore.user) {
    workspaceStore.fetchWorkspaces()
  } else {
    const unwatch = watch(
      () => userStore.token,
      (token) => {
        if (token) {
          workspaceStore.fetchWorkspaces()
          unwatch()
        }
      }
    )
  }
})

watch(() => workspaceStore.currentWorkspaceId, (workspaceId) => {
  if (workspaceId) {
    teamStore.fetchTeams(workspaceId)
    channelStore.clearChannels()
  } else {
    teamStore.clearTeams()
    channelStore.clearChannels()
  }
})

watch(() => teamStore.currentTeamId, (teamId) => {
  if (teamId) {
    channelStore.fetchChannels(teamId, workspaceStore.currentWorkspaceId || undefined)
  } else {
    channelStore.clearChannels()
  }
})
</script>

<template>
  <div class="h-screen h-[100dvh] w-full overflow-hidden bg-[var(--ui-bg-muted)] text-[var(--ui-text)]">
    <div class="grid h-full w-full lg:grid-cols-[275px_minmax(0,1fr)]">
      <aside class="flex h-full flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg)] min-h-0">
        <div class="shrink-0 border-b border-[var(--ui-border)] px-5 py-4">
          <NuxtLink to="/dashboard" class="flex items-center">
            <div class="min-w-0 flex-1">
              <p class="font-black text-[var(--ui-text-highlighted)] truncate" :title="workspaceStore.currentWorkspace?.name">
                {{ workspaceStore.currentWorkspace?.name || 'No Workspace' }}
              </p>
              <p class="text-xs text-[var(--ui-text-muted)] truncate" :title="teamStore.currentTeam?.name">
                {{ teamStore.currentTeam?.name || 'No Team' }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AppSidebar />
        </div>

        <div class="shrink-0 border-t border-[var(--ui-border)] px-5 py-3">
          <BaseButton
            label="Logout"
            color="neutral"
            variant="soft"
            :block="true"
            class="hover:!bg-red-500 hover:!text-white transition-colors"
            @click="handleLogout"
          />
        </div>
      </aside>

      <div class="flex h-full flex-col min-w-0 min-h-0">
        <header class="shrink-0 border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/90 px-5 py-3 backdrop-blur-md sm:px-8 relative z-50">
          <div class="flex items-center justify-between gap-8">
            
            <!-- Channel Header (Left side - larger flex) -->
            <div class="min-w-0 flex-1">
              <ChannelHeader />
            </div>

            <!-- User Info (Right side - fixed width) -->
            <div class="text-right shrink-0 border-l border-[var(--ui-border)] pl-4">
              <p class="text-sm font-semibold text-[var(--ui-text)] truncate max-w-[150px]">{{ userStore.user?.name }}</p>
              <p class="text-xs text-[var(--ui-text-muted)] truncate max-w-[150px]">{{ userStore.user?.email }}</p>
            </div>
          </div>
        </header>

        <main class="flex-1 min-h-0 overflow-hidden">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>