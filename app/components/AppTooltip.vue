<script setup lang="ts">
interface Props {
  text?: string | null
  delayDuration?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  delayDuration: 150,
  side: 'top',
  disabled: false
})

const isDisabled = computed(() => props.disabled || !props.text)
</script>

<template>
  <UTooltip
    :text="props.text || undefined"
    :delay-duration="props.delayDuration"
    :side="props.side"
    :disabled="isDisabled"
    :content="{ align: 'center', sideOffset: 8 }"
    :ui="{
      content: 'rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-1.5 text-xs font-medium text-[var(--ui-text)] shadow-[var(--shadow-md)]'
    }"
  >
    <slot />
  </UTooltip>
</template>
