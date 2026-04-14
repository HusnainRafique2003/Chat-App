<script setup lang="ts">
import { navigateTo, useRoute } from '#app'
import { computed, onMounted, ref, watch } from 'vue'

// 1. Explicitly importing the modals to bypass any Nuxt auto-prefixing issues
import AppSidebar from '~/components/AppSidebar.vue'
import WorkspaceMemberModal from '~/components/modals/WorkspaceMemberModal.vue'
import TeamMemberModal from '~/components/modals/TeamMemberModal.vue'

import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const route = useRoute()

// --- State for Workspace Member Dropdown & Mobile ---
const isWorkspaceMenuOpen = ref(false)
const isMobileSidebarOpen = ref(false)

// --- State for Add Member Modals ---
const showWorkspaceMemberModal = ref(false)
const showTeamMemberModal = ref(false)

// --- Computed Member List ---
const workspaceMembers = computed(() => workspaceStore.currentWorkspace?.members || [])
const currentWorkspaceName = computed(() => workspaceStore.currentWorkspace?.name || 'No workspace selected')
const currentTeamName = computed(() => teamStore.currentTeam?.name || 'Dashboard')

// --- Logic ---
async function handleLogout() {
  isMobileSidebarOpen.value = false
  await userStore.logout()
  await navigateTo('/auth/login')
}

function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function closeMobilePanels() {
  isMobileSidebarOpen.value = false
  isWorkspaceMenuOpen.value = false
}

// Added a quick diagnostic function to ensure the click is registering!
function triggerWorkspaceModal() {
  console.log('Opening Workspace Modal...')
  showWorkspaceMemberModal.value = true
}

function triggerTeamModal() {
  console.log('Opening Team Modal...')
  showTeamMemberModal.value = true
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
      },
      { immediate: true }
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
  isMobileSidebarOpen.value = false
})

watch(() => teamStore.currentTeamId, (teamId) => {
  if (teamId) {
    channelStore.fetchChannels(teamId, workspaceStore.currentWorkspaceId || undefined)
  } else {
    channelStore.clearChannels()
  }
})

watch(() => route.fullPath, () => {
  closeMobilePanels()
})
</script>

<template>
  <div class="h-screen h-[100dvh] w-full overflow-hidden bg-[var(--ui-bg-muted)] text-[var(--ui-text)]">
    <div class="flex h-full w-full relative">
      
      <!-- Mobile Backdrop Overlay -->
      <div 
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
        @click="closeMobilePanels"
      ></div>

      <aside 
        class="absolute inset-y-0 left-0 z-50 flex h-full w-[275px] flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0"
        :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        
        <div class="shrink-0 flex flex-col justify-center border-b border-[var(--ui-border)] px-5 h-[72px]">
          
          <div class="group flex items-center justify-between min-w-0 w-full mb-0.5">
            <NuxtLink to="/dashboard" class="min-w-0 truncate pr-2 hover:opacity-80 transition-opacity relative z-10">
              <p class="font-black text-[var(--ui-text-highlighted)] truncate" :title="workspaceStore.currentWorkspace?.name">
                {{ workspaceStore.currentWorkspace?.name || 'No Workspace' }}
              </p>
            </NuxtLink>
            <button
              v-if="workspaceStore.currentWorkspaceId"
              @click.stop.prevent="triggerWorkspaceModal"
              class="opacity-0 group-hover:opacity-100 flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all cursor-pointer relative z-50"
              title="Add member to workspace"
            >
              <UIcon name="i-lucide-user-plus" class="h-4 w-4" />
            </button>
          </div>

          <div class="group flex items-center justify-between min-w-0 w-full">
            <NuxtLink to="/dashboard" class="min-w-0 truncate pr-2 hover:opacity-80 transition-opacity relative z-10">
              <p class="text-xs text-[var(--ui-text-muted)] truncate" :title="teamStore.currentTeam?.name">
                {{ teamStore.currentTeam?.name || 'No Team' }}
              </p>
            </NuxtLink>
            <button
              v-if="teamStore.currentTeamId"
              @click.stop.prevent="triggerTeamModal"
              class="opacity-0 group-hover:opacity-100 flex h-5 w-5 shrink-0 items-center justify-center rounded-md hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-all cursor-pointer relative z-50"
              title="Add member to team"
            >
              <UIcon name="i-lucide-user-plus" class="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <AppSidebar @navigate="closeMobilePanels" />
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

      <div class="flex-1 flex h-full w-full flex-col min-w-0 min-h-0">
        <header class="shrink-0 flex items-center border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/90 px-5 sm:px-8 h-[72px] backdrop-blur-md relative z-30">
          <div class="flex items-center justify-between gap-4 w-full">
            
            <div class="min-w-0 flex items-center gap-3 flex-1">
              <button
                type="button"
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-bg-elevated)] lg:hidden"
                @click="toggleMobileSidebar"
              >
                <UIcon name="i-lucide-menu" class="h-5 w-5" />
              </button>

              <div class="min-w-0 flex-1">
                <ChannelHeader />
              </div>
            </div>
            
            <div class="text-right shrink-0 border-l border-[var(--ui-border)] pl-4 ml-2 hidden sm:block">
              <p class="text-sm font-semibold text-[var(--ui-text)] truncate max-w-[150px]">{{ userStore.user?.name }}</p>
              <p class="text-xs text-[var(--ui-text-muted)] truncate max-w-[150px]">{{ userStore.user?.email }}</p>
            </div>
            
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-bg-muted)] sm:hidden"
              @click="handleLogout"
            >
              <UIcon name="i-lucide-log-out" class="h-4 w-4" />
            </button>

          </div>
        </header>

        <main class="flex-1 min-h-0 overflow-hidden">
          <slot />
        </main>
      </div>

    </div>

    <WorkspaceMemberModal
      v-if="workspaceStore.currentWorkspaceId"
      v-model:open="showWorkspaceMemberModal"
      :workspace-id="workspaceStore.currentWorkspaceId"
      :workspace-name="workspaceStore.currentWorkspace?.name || ''"
    />

    <TeamMemberModal
      v-if="teamStore.currentTeamId"
      v-model:open="showTeamMemberModal"
      :team-id="teamStore.currentTeamId"
      :team-name="teamStore.currentTeam?.name || ''"
    />

  </div>
</template>