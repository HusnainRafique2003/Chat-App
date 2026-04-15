<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  badge?: string
  gradient?: string
}

withDefaults(defineProps<Props>(), {
  badge: 'Secure workspace access',
  gradient: 'from-[var(--ui-primary)]/6 via-transparent to-[var(--ui-secondary)]/8'
})
</script>

<template>
  <div :class="['auth-shell min-h-screen overflow-hidden bg-gradient-to-br p-4 sm:p-6 lg:p-8', gradient]">
    <div class="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-stretch gap-5 lg:grid-cols-[1.02fr_0.98fr]">
      <section class="auth-showcase relative overflow-hidden rounded-[2rem] border border-[var(--ui-border)]/60 bg-[var(--ui-bg)]/84 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--ui-primary-rgb),0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(var(--ui-secondary-rgb),0.08),transparent_28%)]" />
        <div class="relative z-10 flex h-full flex-col justify-between gap-8">
          <div>
            <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)]/82 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">
              <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
              {{ badge }}
            </div>

            <NuxtLink
              to="/"
              class="group mb-8 inline-flex items-center gap-3"
            >
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)] shadow-[var(--shadow-md)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.02]">
                <Icon
                  name="i-mdi-message-draw"
                  class="h-5 w-5"
                />
              </div>
              <div>
                <p class="text-base font-black text-[var(--ui-text-highlighted)]">ChatSphere</p>
                <p class="text-xs text-[var(--ui-text-muted)]">Workspace communication platform</p>
              </div>
            </NuxtLink>

            <h1 class="max-w-xl text-3xl font-black leading-[1.04] text-[var(--ui-text-highlighted)] sm:text-[2.6rem] lg:text-[3.1rem]">
              {{ title }}
            </h1>
            <p
              v-if="subtitle"
              class="mt-4 max-w-xl text-base leading-7 text-[var(--ui-text-muted)] sm:text-[1.02rem]"
            >
              {{ subtitle }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="flex h-full flex-col justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ui-border-accented)] hover:bg-[var(--ui-bg)]/90">
              <p class="text-xs uppercase tracking-[0.14em] text-[var(--ui-text-dimmed)]">
                Secure access
              </p>
              <p class="mt-2 font-semibold text-[var(--ui-text-highlighted)]">
                Protected auth flow
              </p>
            </div>
            <div class="flex h-full flex-col justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ui-border-accented)] hover:bg-[var(--ui-bg)]/90">
              <p class="text-xs uppercase tracking-[0.14em] text-[var(--ui-text-dimmed)]">
                Workspace ready
              </p>
              <p class="mt-2 font-semibold text-[var(--ui-text-highlighted)]">
                Built for teams
              </p>
            </div>
            <div class="flex h-full flex-col justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ui-border-accented)] hover:bg-[var(--ui-bg)]/90">
              <p class="text-xs uppercase tracking-[0.14em] text-[var(--ui-text-dimmed)]">
                Clean onboarding
              </p>
              <p class="mt-2 font-semibold text-[var(--ui-text-highlighted)]">
                Professional first step
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="flex items-center justify-center">
        <div class="auth-form-panel w-full max-w-lg rounded-[2rem] border border-[var(--ui-border)]/60 bg-[var(--ui-bg)]/90 p-5 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-7 lg:p-8">
          <slot />
        </div>
      </section>
    </div>
  </div>
</template>
