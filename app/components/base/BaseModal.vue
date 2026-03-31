<script setup lang="ts">
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

withDefaults(defineProps<Props>(), {
  size: 'md',
  loading: false,
  hideFooter: false,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmColor: 'primary',
  confirmDisabled: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UModal v-model:open="open" :dismissible="!loading">
    <template #content>
      <div class="p-6 flex flex-col gap-4">

        <!-- Header -->
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
            <p v-if="title" class="font-bold text-lg text-default">{{ title }}</p>
            <p v-if="description" class="text-sm text-muted mt-0.5">{{ description }}</p>
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

        <!-- Body slot -->
        <slot />

        <!-- Footer -->
        <div v-if="!hideFooter" class="flex gap-2 justify-end pt-2 border-t border-default">
          <slot name="footer">
            <UButton
              :label="cancelLabel"
              color="neutral"
              variant="outline"
              :disabled="loading"
              @click="emit('cancel'); open = false"
            />
            <UButton
              :label="confirmLabel"
              :color="confirmColor"
              :loading="loading"
              :disabled="confirmDisabled"
              @click="emit('confirm')"
            />
          </slot>
        </div>

      </div>
    </template>
  </UModal>
</template>