<script setup lang="ts">
import { useUserStore } from '~/stores/useUserStore';
const userStore = useUserStore()

if (!userStore.isLoggedIn) {
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-4xl font-black text-[var(--ui-text-highlighted)]">Dashboard</h1>
        <p class="text-xl text-[var(--ui-text-muted)]">{{ userStore.fullGreeting }}</p>
      </div>
      <BaseButton label="New Workspace" color="success" icon="i-mdi-plus" />
    </div>

    <!-- Workspaces Grid Stub -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard 
        v-for="i in 6" 
        :key="i"
        title="Frontend Team"
        icon="i-mdi-briefcase"
        color="primary"
        hoverable
        class="cursor-pointer group"
      >
        <template #description>
          <p class="text-[var(--ui-text-muted)] mb-4">12 members • 45 channels</p>
          <div class="flex items-center justify-between">
            <BaseBadge label="Active" color="success" />
            <span class="text-sm text-[var(--ui-text-muted)] group-hover:hidden">Click to enter</span>
            <Icon name="i-mdi-chevron-right" class="w-5 h-5 text-[var(--ui-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto hidden group-hover:block" />
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>

