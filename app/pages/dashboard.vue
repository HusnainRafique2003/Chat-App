<script setup lang="ts">
import MessageWorkspace from '~/components/messages/MessageWorkspace.vue'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: 'dashboard'
})

const userStore = useUserStore()

// Protected by auth middleware

</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)] sm:p-8">
      <div class="max-w-3xl">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-dimmed)]">
          <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
          Team workspace
        </div>
        <h2 class="text-3xl font-black text-[var(--ui-text-highlighted)] sm:text-4xl">
          Dashboard layout is ready for feature integration.
        </h2>
        <p class="mt-4 max-w-2xl text-base leading-7 text-[var(--ui-text-muted)]">
          Your authentication flow now lands inside a protected app shell. This page is intentionally structured as a clean handoff point so your teammate can add the sidebar, and you can keep building the main workspace experience separately.
        </p>
      </div>
    </section>

    <MessageWorkspace />
  </div>
</template>
