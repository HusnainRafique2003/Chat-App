<script setup lang="ts">
interface Props {
  label?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  leadingIcon?: string
  trailingIcon?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <UButton
    :color="color"
    :variant="variant"
    :size="size"
    :icon="icon"
    :leading-icon="leadingIcon"
    :trailing-icon="trailingIcon"
    :loading="loading"
    :disabled="disabled"
    :block="block"
    @click="emit('click', $event)"
  >
    <slot>{{ label }}</slot>
  </UButton>
</template>