<script setup lang="ts">
import { navigateTo } from '#app'
import { onMounted, watch } from 'vue'
import AppSidebar from '~/components/AppSidebar.vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()

async function handleLogout() {
  await userStore.logout()
  await navigateTo('/auth/login')
}

onMounted(() => {
  if (userStore.token && userStore.user) {
    console.log('Dashboard - Token available, fetching workspaces')
    workspaceStore.fetchWorkspaces()
  } else {
    console.log('Dashboard - No token yet, waiting...')
    const unwatch = watch(
      () => userStore.token,
      (token) => {
        if (token) {
          console.log('Dashboard - Token now available, fetching workspaces')
          workspaceStore.fetchWorkspaces()
          unwatch()
        }
      }
    )
  }
})

watch(
  () => workspaceStore.currentWorkspaceId,
  (workspaceId) => {
    if (workspaceId) {
      console.log('Dashboard - Workspace changed, fetching teams for:', workspaceId)
      teamStore.fetchTeams(workspaceId)
      channelStore.clearChannels()
    } else {
      teamStore.clearTeams()
      channelStore.clearChannels()
    }
  }
)

watch(
  () => teamStore.currentTeamId,
  (teamId) => {
    if (teamId) {
      console.log('Dashboard - Team changed, fetching channels for:', teamId)
      channelStore.fetchChannels(teamId, workspaceStore.currentWorkspaceId || undefined)
    } else {
      channelStore.clearChannels()
    }
  }
)
</script>

<template>
  <div class="h-screen h-[100dvh] w-full overflow-hidden bg-[var(--ui-bg-muted)] text-[var(--ui-text)]">
    <div class="grid h-full w-full lg:grid-cols-[240px_minmax(0,1fr)]">
      
      <aside class="flex h-full flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg)] min-h-0">
        
        <div class="shrink-0 border-b border-[var(--ui-border)] px-5 py-4">
          <NuxtLink to="/dashboard" class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]">
              <UIcon name="i-mdi-message-draw" class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="font-black text-[var(--ui-text-highlighted)] truncate">ChatSphere</p>
              <p class="text-xs text-[var(--ui-text-muted)] truncate">Dashboard shell</p>
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
        <header class="shrink-0 border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/90 px-5 py-3 backdrop-blur-md sm:px-8">
          <div class="flex items-center justify-between gap-4">
            
            <div>
              <h1 class="text-xl font-black text-[var(--ui-text-highlighted)] truncate max-w-[400px]">
                {{ workspaceStore.currentWorkspace?.name || 'No workspace selected' }}
              </h1>
              <p class="mt-0.5 text-sm font-medium text-[var(--ui-text-muted)] truncate max-w-[300px]">
                {{ teamStore.currentTeam?.name || 'Dashboard' }}
              </p>
            </div>
            
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-[var(--ui-text)]">{{ userStore.user?.name || 'Team member' }}</p>
              <p class="text-xs text-[var(--ui-text-muted)]">{{ userStore.user?.email || 'Signed in' }}</p>
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