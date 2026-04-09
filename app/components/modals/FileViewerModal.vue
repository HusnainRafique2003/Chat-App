<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '~/components/base/BaseModal.vue'

interface Props {
  fileName: string | null
  filePath: string | null
  fileMime: string | null
  imageUrl: string | null
  loading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  download: []
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

/**
 * Detect if the file is an image based on MIME type or common extensions[cite: 807].
 */
const isImage = computed(() => {
  if (props.fileMime?.startsWith('image/')) return true
  const ext = props.fileName?.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="fileName || 'File Preview'"
    size="xl" 
    icon="i-mdi-file-eye-outline"
    icon-color="primary"
    confirm-label="Download File"
    :loading="loading"
    @confirm="emit('download')"
    @cancel="open = false"
  >
    <div class="flex flex-col items-center justify-center min-h-[400px] bg-[var(--ui-bg-muted)] rounded-2xl overflow-hidden p-2 sm:p-4">
      
      <template v-if="isImage">
        <div v-if="imageUrl" class="relative group w-full flex justify-center items-center">
          <img 
            :src="imageUrl" 
            :alt="fileName || 'Image preview'" 
            class="max-h-[65vh] w-auto object-contain rounded-lg shadow-xl transition-all duration-500 animate-in fade-in zoom-in-95"
            @error="(e) => console.error('Modal Image Error: URL might be revoked or invalid.', { fileName, imageUrl })"
          />
          
          <div class="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-white text-[11px] font-bold uppercase tracking-wider">
              {{ fileName }}
            </div>
          </div>
        </div>
        
        <div v-else class="flex flex-col items-center gap-3">
           <UIcon name="i-lucide-loader" class="h-8 w-8 animate-spin text-[var(--ui-primary)]" />
           <p class="text-xs text-[var(--ui-text-muted)]">Loading preview...</p>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col items-center gap-6 text-center py-16">
          <div class="h-24 w-24 rounded-[2rem] bg-[var(--ui-primary)]/10 flex items-center justify-center text-[var(--ui-primary)] shadow-inner">
            <UIcon name="i-mdi-file-document-outline" class="h-12 w-12" />
          </div>
          <div class="max-w-xs px-4">
            <p class="text-lg font-black text-[var(--ui-text-highlighted)] truncate">{{ fileName }}</p>
            <p class="text-xs text-[var(--ui-text-muted)] mt-2 leading-relaxed">
              Preview is not supported for this file type. Use the button below to download and view the file locally.
            </p>
          </div>
        </div>
      </template>
      
    </div>
  </BaseModal>
</template>