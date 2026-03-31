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
    class="rounded-xl border border-default bg-elevated shadow-sm w-full"
    :class="hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''"
  >
    <!-- Header -->
    <div
      v-if="$slots.header || title || icon"
      class="px-4 py-3 border-b border-default flex items-center gap-2"
    >
      <slot name="header">
        <UIcon
          v-if="icon"
          :name="icon"
          class="text-xl shrink-0"
          :class="`text-${color}`"
        />
        <div class="flex flex-col">
          <p v-if="title" class="font-semibold text-default leading-tight">
            {{ title }}
          </p>
          <p v-if="description" class="text-sm text-muted leading-tight">
            {{ description }}
          </p>
        </div>
      </slot>
    </div>

    <!-- Body -->
    <div class="px-4 py-4">
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
      class="px-4 py-3 border-t border-default"
    >
      <slot name="footer" />
    </div>
  </div>
</template>