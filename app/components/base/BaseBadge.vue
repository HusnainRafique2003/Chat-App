<script setup lang="ts">
interface Props {
  label: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
  icon?: string
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'soft',
  size: 'md'
})
</script>

<template>
  <UBadge
    :color="color"
    :variant="variant"
    :size="size"
    class="rounded-full px-2.5 py-1 font-semibold tracking-[0.08em] uppercase"
  >
    <UIcon
      v-if="icon"
      :name="icon"
      class="mr-1"
    />
    {{ label }}
  </UBadge>
</template>
