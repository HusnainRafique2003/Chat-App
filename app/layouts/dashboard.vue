<script setup lang="ts">
import { onMounted } from 'vue'
import { navigateTo } from '#app'
import AppSidebar from '~/components/AppSidebar.vue'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const userStore = useUserStore()
const workspaceStore = useWorkspaceStore()

async function handleLogout() {
  await userStore.logout()
  await navigateTo('/auth/login')
}

onMounted(() => {
  if (userStore.user) {
    workspaceStore.fetchWorkspaces()
  }
})
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg-muted)] text-[var(--ui-text)]">
    <div class="grid min-h-screen lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="border-r border-[var(--ui-border)] bg-[var(--ui-bg)]">
        <div class="flex h-full flex-col">
          <div class="border-b border-[var(--ui-border)] px-6 py-5">
            <NuxtLink to="/dashboard" class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)]">
                <Icon name="i-mdi-message-draw" class="h-5 w-5" />
              </div>
              <div>
                <p class="font-black text-[var(--ui-text-highlighted)]">ChatSphere</p>
                <p class="text-sm text-[var(--ui-text-muted)]">Dashboard shell</p>
              </div>
            </NuxtLink>
          </div>

          <AppSidebar />

          <div class="border-t border-[var(--ui-border)] px-5 py-4">
            <BaseButton
              label="Logout"
              color="neutral"
              variant="soft"
              :block="true"
              @click="handleLogout"
            />
          </div>
        </div>
      </aside>

      <div class="flex min-h-screen flex-col">
        <header class="border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/90 px-5 py-4 backdrop-blur-md sm:px-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-dimmed)]">Workspace app</p>
              <h1 class="mt-1 text-2xl font-black text-[var(--ui-text-highlighted)]">Dashboard</h1>
            </div>
            <div class="text-right">
              <p class="font-semibold text-[var(--ui-text)]">{{ userStore.user?.name || 'Team member' }}</p>
              <p class="text-sm text-[var(--ui-text-muted)]">{{ userStore.user?.email || 'Signed in' }}</p>
            </div>
          </div>
        </header>

        <main class="flex-1 p-5 sm:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
