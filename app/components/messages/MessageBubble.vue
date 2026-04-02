<script setup lang="ts">
import type { Message } from '~/composables/useMessagesApi'
import { useUserStore } from '~/stores/useUserStore'

interface Props {
  message: Message
}

interface Emits {
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'react', emoji: string): void
}

defineProps<Props>()
defineEmits<Emits>()

const userStore = useUserStore()
const showReactions = ref(false)
const showMenu = ref(false)

const isOwn = computed(() => message.sender_id === userStore.user?.id)

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '✨']

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div :class="['flex gap-3 group', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-secondary)] flex items-center justify-center text-xs font-bold text-white">
        {{ message.sender.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Message Content -->
    <div :class="['flex flex-col gap-1', isOwn ? 'items-end' : 'items-start']">
      <!-- Header -->
      <div :class="['flex items-center gap-2 text-xs', isOwn ? 'flex-row-reverse' : 'flex-row']">
        <span class="font-semibold text-[var(--ui-text-highlighted)]">{{ message.sender.name }}</span>
        <span class="text-[var(--ui-text-dimmed)]">{{ formatTime(message.created_at) }}</span>
      </div>

      <!-- Message Bubble -->
      <div :class="[
        'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl break-words',
        isOwn
          ? 'bg-[var(--ui-primary)] text-white rounded-br-none'
          : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] rounded-bl-none'
      ]">
        <p class="text-sm leading-relaxed">{{ message.content }}</p>

        <!-- File Attachment -->
        <div v-if="message.file_name" class="mt-2 pt-2 border-t border-current border-opacity-20">
          <a
            :href="message.file_download_url"
            target="_blank"
            class="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
          >
            <UIcon name="i-mdi-file-download" class="w-4 h-4" />
            {{ message.file_name }}
          </a>
        </div>
      </div>

      <!-- Reactions -->
      <div v-if="message.reactions_summary.length > 0" class="flex flex-wrap gap-1 mt-1">
        <button
          v-for="reaction in message.reactions_summary"
          :key="reaction.emoji"
          class="px-2 py-1 rounded-full text-xs bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-muted)] transition-colors"
          :title="`${reaction.reacted_by.length} reaction${reaction.reacted_by.length !== 1 ? 's' : ''}`"
        >
          {{ reaction.emoji }} {{ reaction.count }}
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <UButton
          icon="i-mdi-emoticon-plus-outline"
          size="xs"
          color="gray"
          variant="ghost"
          @click="showReactions = !showReactions"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-pencil"
          size="xs"
          color="gray"
          variant="ghost"
          @click="$emit('edit')"
        />
        <UButton
          v-if="isOwn"
          icon="i-mdi-trash-can-outline"
          size="xs"
          color="red"
          variant="ghost"
          @click="$emit('delete')"
        />
      </div>

      <!-- Emoji Picker -->
      <div v-if="showReactions" class="flex flex-wrap gap-2 mt-2 p-2 bg-[var(--ui-bg-elevated)] rounded-lg">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          class="text-lg hover:scale-125 transition-transform cursor-pointer"
          @click="$emit('react', emoji); showReactions = false"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
