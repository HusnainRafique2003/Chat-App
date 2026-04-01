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
    @click="handleClick"
  >
    <slot>{{ props.label }}</slot>
  </UButton>
</template>
