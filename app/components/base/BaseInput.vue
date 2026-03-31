<script setup lang="ts">
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
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

const model = defineModel<string>({ default: '' })

const emit = defineEmits<{
  enter: [value: string]
}>()
</script>

<template>
  <UFormField :label="label" :hint="hint" :error="error" :required="required">
    <UInput
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :leading-icon="icon"
      :trailing-icon="trailingIcon"
      :color="error ? 'error' : undefined"
      class="w-full"
      @keyup.enter="emit('enter', model)"
    />
  </UFormField>
</template>