<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  description?: string
  icon?: string
  iconColor?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  loading?: boolean
  hideFooter?: boolean
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  confirmDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  loading: false,
  hideFooter: false,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmColor: 'primary',
  confirmDisabled: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-md'
    case 'lg':
      return 'max-w-3xl'
    case 'xl':
      return 'max-w-5xl'
    case 'full':
      return 'max-w-[min(96vw,72rem)]'
    case 'md':
    default:
      return 'max-w-xl'
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="!loading"
  >
    <template #content>
      <div
        :class="sizeClass"
        class="flex w-full max-h-[min(88vh,52rem)] flex-col gap-4 overflow-y-auto p-4 sm:p-6"
      >
        <div class="flex items-start gap-3">
          <div
            v-if="icon"
            class="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            :class="`bg-${iconColor ?? 'primary'}/10`"
          >
            <UIcon
              :name="icon"
              class="text-xl"
              :class="`text-${iconColor ?? 'primary'}`"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p
              v-if="title"
              class="font-bold text-lg text-[var(--ui-text)]"
            >
              {{ title }}
            </p>
            <p
              v-if="description"
              class="text-sm text-[var(--ui-text-muted)] mt-0.5"
            >
              {{ description }}
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="loading"
            @click="emit('cancel'); open = false"
          />
        </div>

        <slot />

        <div
          v-if="!hideFooter"
          class="flex flex-col-reverse justify-end gap-2 border-t border-[var(--ui-border)] pt-4 mt-2 sm:flex-row"
        >
          <slot name="footer">
            <UButton
              :label="cancelLabel"
              color="neutral"
              variant="outline"
              :disabled="loading"
              class="justify-center"
              @click="emit('cancel'); open = false"
            />
            <UButton
              :label="confirmLabel"
              :color="confirmColor"
              :loading="loading"
              :disabled="confirmDisabled"
              class="justify-center"
              @click="emit('confirm')"
            />
          </slot>
        </div>
      </div>
    </template>
  </UModal>
</template>
