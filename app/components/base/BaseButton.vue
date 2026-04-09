<script setup lang="ts">
import { computed } from 'vue'

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
  type?: 'button' | 'submit' | 'reset'
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
  type: 'button',
  to: undefined
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => {
  const layout = props.block ? 'w-full' : ''
  const shape = 'rounded-2xl font-semibold tracking-[0.01em]'
  const motion = 'transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:opacity-60'
  const shadow = props.variant === 'solid'
    ? 'shadow-[0_14px_34px_rgba(var(--ui-primary-rgb),0.14)] hover:shadow-[0_18px_38px_rgba(var(--ui-primary-rgb),0.18)]'
    : 'hover:shadow-[var(--shadow-sm)]'
  const sizing = {
    xs: 'min-h-8 px-3 text-xs',
    sm: 'min-h-9 px-3.5 text-sm',
    md: 'min-h-10 px-4 text-sm',
    lg: 'min-h-11 px-5 text-sm',
    xl: 'min-h-12 px-6 text-sm sm:text-base'
  }[props.size]

  return [layout, shape, motion, shadow, sizing].filter(Boolean).join(' ')
})

async function handleClick(event: MouseEvent) {
  emit('click', event)

  if (event.defaultPrevented || props.disabled || props.loading || !props.to) {
    return
  }

  await navigateTo(props.to)
}
</script>

<template>
  <UButton
    :type="type"
    :color="props.color"
    :variant="props.variant"
    :size="props.size"
    :icon="props.icon"
    :leading-icon="props.leadingIcon"
    :trailing-icon="props.trailingIcon"
    :loading="props.loading"
    :disabled="props.disabled"
    :block="props.block"
    :class="buttonClass"
    @click="handleClick"
  >
    <slot>{{ props.label }}</slot>
  </UButton>
</template>
