<script setup lang="ts">
import { computed, useAttrs } from 'vue'

interface Props {
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  type?: string
  required?: boolean
  disabled?: boolean
  icon?: string
  trailingIcon?: string
  autocomplete?: string
  name?: string
  inputClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  autocomplete: undefined,
  name: undefined,
  inputClass: ''
})

const model = defineModel<string>({ default: '' })
const attrs = useAttrs()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  enter: [value: string]
}>()

const fieldClass = computed(() => {
  const base = 'w-full rounded-2xl border-0 bg-[var(--ui-bg)]/88 text-[var(--ui-text)] ring-0 transition-all duration-300'
  const state = props.error
    ? '!shadow-[inset_0_0_0_1px_rgba(var(--ui-error-rgb),0.45)]'
    : 'hover:bg-[var(--ui-bg)] focus-within:bg-[var(--ui-bg)] !shadow-[inset_0_0_0_1px_rgba(55,27,23,0.09)] focus-within:!shadow-[inset_0_0_0_1px_rgba(var(--ui-primary-rgb),0.28),0_0_0_4px_rgba(var(--ui-primary-rgb),0.08)]'
  const spacing = 'min-h-12 text-sm'

  return [base, state, spacing, props.inputClass].filter(Boolean).join(' ')
})
</script>

<template>
  <UFormField
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :required="props.required"
    :ui="{
      label: 'mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ui-text-dimmed)]',
      hint: 'mt-1 text-xs text-[var(--ui-text-muted)]',
      error: 'mt-1 text-xs font-medium text-[var(--ui-error)]'
    }"
  >
    <UInput
      v-bind="attrs"
      v-model="model"
      :type="props.type"
      :name="props.name"
      :autocomplete="props.autocomplete"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :leading-icon="props.icon"
      :trailing-icon="props.trailingIcon"
      :color="props.error ? 'error' : undefined"
      :class="fieldClass"
      :ui="{
        root: 'w-full',
        base: 'min-h-12 border-0 bg-transparent px-4 py-3 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-dimmed)] focus:ring-0',
        leading: 'ps-4',
        leadingIcon: 'size-4 text-[var(--ui-text-dimmed)]',
        trailing: 'pe-3',
        trailingIcon: 'size-4 text-[var(--ui-text-dimmed)]'
      }"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @keyup.enter="emit('enter', model)"
    >
      <template v-if="$slots.leading" #leading>
        <slot name="leading" />
      </template>

      <template v-if="$slots.trailing" #trailing>
        <slot name="trailing" />
      </template>
    </UInput>
  </UFormField>
</template>
