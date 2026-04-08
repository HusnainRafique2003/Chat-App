<script setup lang="ts">
import { navigateTo } from '#app'
import { onMounted, watch, computed, ref } from 'vue'
import AppSidebar from '~/components/AppSidebar.vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()

// --- State for Workspace Member Dropdown ---
const isWorkspaceMenuOpen = ref(false)

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
  isWorkspaceMenuOpen.value = false
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
    <div class="grid h-full w-full lg:grid-cols-[240px_minmax(0,1fr)]">
      
      <aside class="flex h-full flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg)] min-h-0">
        <div class="shrink-0 border-b border-[var(--ui-border)] px-5 py-4">
          <NuxtLink to="/dashboard" class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]">
              <UIcon name="i-mdi-message-draw" class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="font-black text-[var(--ui-text-highlighted)] truncate">ChatSphere</p>
              <p class="text-xs text-[var(--ui-text-muted)] truncate">Communication App</p>
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
          <div class="flex items-center justify-between gap-4">
            
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-xl font-black text-[var(--ui-text-highlighted)] truncate max-w-[400px]">
                  {{ workspaceStore.currentWorkspace?.name || 'No workspace selected' }}
                </h1>
                
                <div class="relative">
                  <button 
                    @click="isWorkspaceMenuOpen = !isWorkspaceMenuOpen"
                    type="button" 
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--ui-primary)]/10 border border-[var(--ui-primary)]/20 shadow-sm shrink-0 hover:bg-[var(--ui-primary)]/20 transition-all cursor-pointer outline-none"
                  >
                    <span class="text-[10px] font-bold text-[var(--ui-primary)] uppercase tracking-tight">
                      {{ workspaceMembers.length }} members
                    </span>
                    <UIcon name="i-lucide-chevron-down" class="h-3 w-3 text-[var(--ui-primary)] transition-transform" :class="{'rotate-180': isWorkspaceMenuOpen}" />
                  </button>

                  <div v-if="isWorkspaceMenuOpen" class="absolute top-full left-0 mt-2 w-64 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div class="px-3 py-2 border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/50 text-[10px] font-bold uppercase text-[var(--ui-text-dimmed)]">Workspace Members</div>
                    <div class="p-1.5 max-h-64 overflow-y-auto">
                      <div v-for="m in workspaceMembers" :key="m.id" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--ui-bg-muted)] transition-colors group">
                        <div class="h-8 w-8 rounded-full bg-[var(--ui-primary)]/10 flex items-center justify-center text-[var(--ui-primary)] font-bold text-xs">
                          {{ (m.name || m.user?.name || 'U').charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-[var(--ui-text)] truncate">{{ m.name || m.user?.name }}</p>
                          <p class="text-[10px] text-[var(--ui-text-muted)] truncate">{{ m.email || m.user?.email }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="isWorkspaceMenuOpen" @click="isWorkspaceMenuOpen = false" class="fixed inset-0 z-[55]"></div>
                </div>
              </div>

              <div class="mt-0.5">
                <p class="text-sm font-medium text-[var(--ui-text-muted)] truncate max-w-[300px]">
                  {{ teamStore.currentTeam?.name || 'Dashboard' }}
                </p>
              </div>
            </div>
            
            <div class="text-right shrink-0 border-l border-[var(--ui-border)] pl-4 ml-2">
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