<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  fallback?: string
}

withDefaults(defineProps<Props>(), {
  fallback: 'Something went wrong. Please try again.'
})

const hasError = ref(false)
const errorMessage = ref('')

const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
}

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  return false
})
</script>

<template>
  <div v-if="hasError" class="flex items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <div class="text-center">
      <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
      <p class="text-red-800 dark:text-red-200 font-medium mb-2">{{ fallback }}</p>
      <p class="text-sm text-red-600 dark:text-red-300 mb-4">{{ errorMessage }}</p>
      <UButton size="sm" color="red" @click="resetError">Try Again</UButton>
    </div>
  </div>
  <slot v-else />
</template>
