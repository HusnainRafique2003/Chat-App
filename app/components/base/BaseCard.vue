<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  loading?: boolean
  hoverable?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
  hoverable: false,
  color: 'primary',
})
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-[1.4rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.68))] shadow-[var(--shadow-md)] transition-all duration-300 dark:bg-[linear-gradient(180deg,rgba(15,21,33,0.9),rgba(12,18,32,0.82))]"
    :class="hoverable ? 'cursor-pointer hover:-translate-y-1 hover:border-[var(--ui-border-accented)] hover:shadow-[var(--shadow-lg)]' : ''"
  >
    <!-- Header -->
    <div
      v-if="$slots.header || title || icon"
      class="flex items-start gap-3 border-b border-[var(--ui-border)] px-5 py-4"
    >
      <slot name="header">
        <UIcon
          v-if="icon"
          :name="icon"
          class="shrink-0 text-xl"
          :class="`text-${color}`"
        />
        <div class="min-w-0 flex flex-col">
          <p v-if="title" class="leading-tight font-semibold text-[var(--ui-text-highlighted)]">
            {{ title }}
          </p>
          <p v-if="description" class="mt-0.5 text-sm leading-tight text-[var(--ui-text-muted)]">
            {{ description }}
          </p>
        </div>
      </slot>
    </div>

    <!-- Body -->
    <div class="min-w-0 px-5 py-5">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <UIcon
          name="i-lucide-loader-2"
          class="text-2xl text-muted animate-spin"
        />
      </div>
      <slot v-else />
    </div>

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      class="border-t border-[var(--ui-border)] px-5 py-4"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
