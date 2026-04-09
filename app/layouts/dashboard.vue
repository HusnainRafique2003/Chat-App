<script setup lang="ts">
import { navigateTo, useRoute } from '#app'
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
const route = useRoute()

// --- State for Workspace Member Dropdown ---
const isWorkspaceMenuOpen = ref(false)
const isMobileSidebarOpen = ref(false)

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
    <div class="relative flex h-full w-full overflow-hidden">
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
        @click="closeMobilePanels"
      />

      <aside
        class="fixed inset-y-0 left-0 z-50 flex h-full w-[min(22rem,calc(100vw-1rem))] flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg)] min-h-0 shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[240px] lg:translate-x-0 lg:shadow-none"
        :class="isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="shrink-0 border-b border-[var(--ui-border)] px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <NuxtLink to="/dashboard" class="flex min-w-0 items-center gap-3" @click="closeMobilePanels">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]">
                <UIcon name="i-mdi-message-draw" class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <p class="truncate font-black text-[var(--ui-text-highlighted)]">ChatSphere</p>
                <p class="truncate text-xs text-[var(--ui-text-muted)]">Communication App</p>
              </div>
            </NuxtLink>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ui-border)] text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-bg-muted)] hover:text-[var(--ui-text)] lg:hidden"
              @click="closeMobilePanels"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
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

      <div class="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <header class="relative z-30 shrink-0 border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/92 px-4 py-3 backdrop-blur-md sm:px-6">
          <div class="flex items-start justify-between gap-3 sm:items-center">
            <div class="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <button
                type="button"
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-bg-elevated)] lg:hidden"
                @click="toggleMobileSidebar"
              >
                <UIcon name="i-lucide-menu" class="h-5 w-5" />
              </button>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <AppTooltip :text="currentWorkspaceName">
                    <h1 class="max-w-full truncate text-lg font-black text-[var(--ui-text-highlighted)] sm:text-xl">
                      {{ currentWorkspaceName }}
                    </h1>
                  </AppTooltip>

                  <div class="relative">
                    <button
                      @click="isWorkspaceMenuOpen = !isWorkspaceMenuOpen"
                      type="button"
                      class="flex items-center gap-1 rounded-full border border-[var(--ui-primary)]/20 bg-[var(--ui-primary)]/10 px-2 py-1 shadow-sm transition-all hover:bg-[var(--ui-primary)]/20"
                    >
                      <span class="text-[10px] font-bold uppercase tracking-tight text-[var(--ui-primary)]">
                        {{ workspaceMembers.length }} members
                      </span>
                      <UIcon name="i-lucide-chevron-down" class="h-3 w-3 text-[var(--ui-primary)] transition-transform" :class="{ 'rotate-180': isWorkspaceMenuOpen }" />
                    </button>

                    <div
                      v-if="isWorkspaceMenuOpen"
                      class="absolute left-0 top-full z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-2xl"
                    >
                      <div class="border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/50 px-3 py-2 text-[10px] font-bold uppercase text-[var(--ui-text-dimmed)]">
                        Workspace Members
                      </div>
                      <div class="max-h-64 overflow-y-auto p-1.5">
                        <div v-for="m in workspaceMembers" :key="m.id" class="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--ui-bg-muted)]">
                          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ui-primary)]/10 text-xs font-bold text-[var(--ui-primary)]">
                            {{ (m.name || m.user?.name || 'U').charAt(0).toUpperCase() }}
                          </div>
                          <div class="min-w-0">
                            <AppTooltip :text="m.name || m.user?.name">
                              <p class="truncate text-sm font-medium text-[var(--ui-text)]">{{ m.name || m.user?.name }}</p>
                            </AppTooltip>
                            <AppTooltip :text="m.email || m.user?.email">
                              <p class="truncate text-[10px] text-[var(--ui-text-muted)]">{{ m.email || m.user?.email }}</p>
                            </AppTooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="isWorkspaceMenuOpen" @click="isWorkspaceMenuOpen = false" class="fixed inset-0 z-[55]" />
                  </div>
                </div>

                <div class="mt-0.5">
                  <AppTooltip :text="currentTeamName">
                    <p class="max-w-[16rem] truncate text-xs font-medium text-[var(--ui-text-muted)] sm:max-w-[22rem] sm:text-sm">
                      {{ currentTeamName }}
                    </p>
                  </AppTooltip>
                </div>
              </div>
            </div>

            <div class="hidden shrink-0 border-l border-[var(--ui-border)] pl-4 text-right sm:block">
              <AppTooltip :text="userStore.user?.name">
                <p class="max-w-[170px] truncate text-sm font-semibold text-[var(--ui-text)]">{{ userStore.user?.name }}</p>
              </AppTooltip>
              <AppTooltip :text="userStore.user?.email">
                <p class="max-w-[170px] truncate text-xs text-[var(--ui-text-muted)]">{{ userStore.user?.email }}</p>
              </AppTooltip>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-3 border-t border-[var(--ui-border)]/70 pt-3 sm:hidden">
            <div class="min-w-0">
              <AppTooltip :text="userStore.user?.name">
                <p class="truncate text-sm font-semibold text-[var(--ui-text)]">{{ userStore.user?.name }}</p>
              </AppTooltip>
              <AppTooltip :text="userStore.user?.email">
                <p class="truncate text-xs text-[var(--ui-text-muted)]">{{ userStore.user?.email }}</p>
              </AppTooltip>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text)] transition-colors hover:bg-[var(--ui-bg-muted)]"
              @click="handleLogout"
            >
              <UIcon name="i-lucide-log-out" class="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <main class="flex-1 min-h-0 overflow-hidden">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
