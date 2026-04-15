<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

// --- Improved Zoom Logic ---
const scale = ref(1)
function zoomIn() { if (scale.value < 4) scale.value += 0.25 }
function zoomOut() { if (scale.value > 0.5) scale.value -= 0.25 }
function resetZoom() { scale.value = 1 }

// Reset zoom whenever the modal closes or a new file is loaded
watch(open, (val) => { if (!val) resetZoom() })

// --- File Type Logic  ---
const extension = computed(() => props.fileName?.split('.').pop()?.toLowerCase() || '')

const isImage = computed(() => {
  return props.fileMime?.startsWith('image/')
    || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'jif'].includes(extension.value)
})

const isPDF = computed(() => props.fileMime === 'application/pdf' || extension.value === 'pdf')

const isVideo = computed(() => props.fileMime?.startsWith('video/') || extension.value === 'mp4')

const isAudio = computed(() => props.fileMime?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'webm'].includes(extension.value))

const isDoc = computed(() => ['doc', 'docx'].includes(extension.value))
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="fileName || 'File Preview'"
    size="xl"
    icon="i-mdi-file-eye-outline"
    confirm-label="Download"
    :loading="loading"
    @confirm="emit('download')"
    @cancel="open = false"
  >
    <div class="flex flex-col items-center justify-center min-h-[500px] max-h-[75vh] bg-[var(--ui-bg-muted)] rounded-2xl overflow-hidden relative">
      <template v-if="isImage && imageUrl">
        <div class="absolute top-4 right-4 z-20 flex gap-2 bg-[var(--ui-bg)]/80 backdrop-blur-md p-1.5 rounded-xl border border-[var(--ui-border)] shadow-sm">
          <UButton
            icon="i-mdi-plus"
            size="xs"
            color="neutral"
            variant="ghost"
            title="Zoom In"
            @click="zoomIn"
          />
          <div class="w-px h-4 bg-[var(--ui-border)] self-center" />
          <UButton
            icon="i-mdi-refresh"
            size="xs"
            color="neutral"
            variant="ghost"
            title="Reset"
            @click="resetZoom"
          />
          <div class="w-px h-4 bg-[var(--ui-border)] self-center" />
          <UButton
            icon="i-mdi-minus"
            size="xs"
            color="neutral"
            variant="ghost"
            title="Zoom Out"
            @click="zoomOut"
          />
          <span class="px-2 text-[10px] font-bold self-center min-w-[35px] text-center">{{ Math.round(scale * 100) }}%</span>
        </div>

        <div class="w-full h-full overflow-auto flex items-center justify-center p-6 custom-scrollbar">
          <img
            :src="imageUrl"
            class="max-w-full h-auto transition-transform duration-200 ease-out shadow-lg rounded-sm origin-center"
            :style="{ transform: `scale(${scale})` }"
          >
        </div>
      </template>

      <template v-else-if="isPDF && imageUrl">
        <iframe
          :src="imageUrl"
          class="w-full h-[70vh] border-none rounded-lg"
        />
      </template>

      <template v-else-if="isVideo && imageUrl">
        <video
          controls
          class="max-h-[65vh] w-full bg-black rounded-lg"
        >
          <source
            :src="imageUrl"
            :type="fileMime || 'video/mp4'"
          >
          Your browser does not support the video tag.
        </video>
      </template>

      <template v-else-if="isAudio && imageUrl">
        <div class="flex flex-col items-center gap-6 p-12 w-full">
          <div class="h-24 w-24 rounded-3xl bg-[var(--ui-primary)]/10 flex items-center justify-center text-[var(--ui-primary)] animate-pulse">
            <UIcon
              name="i-mdi-volume-high"
              class="h-12 w-12"
            />
          </div>
          <audio
            controls
            class="w-full max-w-md"
          >
            <source
              :src="imageUrl"
              :type="fileMime || 'audio/mpeg'"
            >
          </audio>
          <p class="text-sm font-medium text-[var(--ui-text-muted)]">
            {{ fileName }}
          </p>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col items-center gap-6 text-center py-20">
          <div class="h-24 w-24 rounded-[2rem] bg-[var(--ui-primary)]/10 flex items-center justify-center text-[var(--ui-primary)] shadow-inner">
            <UIcon
              :name="isDoc ? 'i-mdi-file-word' : 'i-mdi-file-document-outline'"
              class="h-12 w-12"
            />
          </div>
          <div class="max-w-xs px-4">
            <p class="text-lg font-black text-[var(--ui-text-highlighted)] truncate">
              {{ fileName }}
            </p>
            <p class="text-xs text-[var(--ui-text-muted)] mt-2 leading-relaxed">
              {{ isDoc ? 'Word documents cannot be previewed in the browser.' : 'Preview is not available for this file type.' }}
              Please download the file to view it.
            </p>
          </div>
        </div>
      </template>
    </div>
  </BaseModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--ui-primary-rgb), 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--ui-primary-rgb), 0.4);
}
</style>
