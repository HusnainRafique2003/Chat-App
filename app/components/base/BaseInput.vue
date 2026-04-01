<script setup lang="ts">
import { useAttrs } from 'vue'

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

withDefaults(defineProps<Props>(), {
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
</script>

<template>
  <UFormField :label="label" :hint="hint" :error="error" :required="required">
    <UInput
      v-bind="attrs"
      v-model="model"
      :type="type"
      :name="name"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :disabled="disabled"
      :leading-icon="icon"
      :trailing-icon="trailingIcon"
      :color="error ? 'error' : undefined"
      :class="['w-full', inputClass]"
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
