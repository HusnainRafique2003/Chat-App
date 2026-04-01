<script setup lang="ts">
import type { ChatMessage } from '~/composables/useMessagesApi'

const props = defineProps<{
  message: ChatMessage
  own: boolean
  editing?: boolean
}>()

const emit = defineEmits<{
  react: [emoji: string]
  edit: []
  remove: []
  download: [path: string]
}>()

const defaultReactions = ['👍', '🔥', '✅', '🎉']

const formattedTime = computed(() => {
  return new Date(props.message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const attachmentPath = computed(() => {
  return props.message.file_path || props.message.file_download_url || ''
})
</script>

<template>
  <article class="flex gap-3" :class="own ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-[82%] gap-3" :class="own ? 'flex-row-reverse' : 'flex-row'">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-[var(--shadow-sm)]"
        :class="own
          ? 'bg-[var(--ui-secondary)] text-[var(--ui-secondary-foreground)]'
          : 'bg-[var(--ui-bg-accented)] text-[var(--ui-text-highlighted)]'"
      >
        {{ (message.sender?.name || 'U').slice(0, 2).toUpperCase() }}
      </div>

      <div
        class="max-w-full rounded-[1.5rem] border px-4 py-3 shadow-[var(--shadow-sm)]"
        :class="own
          ? 'border-[var(--ui-primary)]/20 bg-[var(--ui-primary)] text-[var(--ui-primary-foreground)]'
          : 'border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-text)]'"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold" :class="own ? 'text-[var(--ui-primary-foreground)]' : 'text-[var(--ui-text-highlighted)]'">
              {{ message.sender?.name || 'Unknown sender' }}
            </p>
            <p class="text-xs" :class="own ? 'text-white/70' : 'text-[var(--ui-text-dimmed)]'">{{ formattedTime }}</p>
          </div>

          <div v-if="own" class="flex items-center gap-1">
            <BaseButton label="Edit" size="xs" color="neutral" variant="ghost" @click="emit('edit')" />
            <BaseButton label="Delete" size="xs" color="error" variant="ghost" @click="emit('remove')" />
          </div>
        </div>

        <div class="message-html text-sm leading-7" v-html="message.content" />

        <div
          v-if="message.file_name"
          class="mt-3 rounded-xl border px-3 py-2"
          :class="own ? 'border-white/15 bg-white/10' : 'border-[var(--ui-border)] bg-[var(--ui-bg-muted)]/75'"
        >
          <p class="font-medium">{{ message.file_name }}</p>
          <p class="text-xs" :class="own ? 'text-white/75' : 'text-[var(--ui-text-muted)]'">{{ message.file_mime || 'Attachment' }}</p>
          <BaseButton
            v-if="attachmentPath"
            label="Download"
            size="sm"
            color="secondary"
            variant="soft"
            class="mt-2"
            @click="emit('download', attachmentPath)"
          />
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="reaction in message.reactions_summary"
            :key="`${message.id}-${reaction.emoji}`"
            type="button"
            class="rounded-full border px-2.5 py-1 text-xs font-medium"
            :class="reaction.reacted_by_me
              ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/12 text-[var(--ui-primary)]'
              : 'border-[var(--ui-border)] bg-[var(--ui-bg-muted)] text-[var(--ui-text-muted)]'"
            @click="emit('react', reaction.emoji)"
          >
            {{ reaction.emoji }} {{ reaction.count }}
          </button>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <BaseButton
            v-for="emoji in defaultReactions"
            :key="emoji"
            :label="emoji"
            size="xs"
            color="neutral"
            variant="soft"
            @click="emit('react', emoji)"
          />
        </div>
      </div>
    </div>
  </article>
</template>
