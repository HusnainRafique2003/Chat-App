<script setup lang="ts">
import { ref } from 'vue'
import MessageList from '~/components/messages/MessageList.vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useMessageStore } from '~/stores/useMessageStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: 'dashboard'
})

const userStore = useUserStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const messageStore = useMessageStore()

const editingChannelId = ref<string | null>(null)
const editingChannelName = ref('')
const showMessaging = ref(false)

function startEdit(channelId: string, currentName: string) {
  editingChannelId.value = channelId
  editingChannelName.value = currentName
}

async function saveEdit() {
  if (!editingChannelId.value || !editingChannelName.value.trim()) {
    return
  }

  const result = await channelStore.updateChannel(editingChannelId.value, editingChannelName.value.trim())

  if (result.success) {
    editingChannelId.value = null
    editingChannelName.value = ''
  }
}

function cancelEdit() {
  editingChannelId.value = null
  editingChannelName.value = ''
}

function selectChannel(channelId: string) {
  channelStore.setCurrentChannel(channelId)
  showMessaging.value = true
}

async function handleMessageSent(data: { content: string; file?: File }) {
  if (!channelStore.currentChannelId) return

  const result = await messageStore.createMessage(
    channelStore.currentChannelId,
    data.content,
    data.file
  )

  if (!result.success) {
    console.error('Failed to send message:', result.error)
  }
}

async function handleMessageEdited(data: { messageId: string; content: string; file?: File }) {
  if (!channelStore.currentChannelId) return

  const result = await messageStore.updateMessage(
    channelStore.currentChannelId,
    data.messageId,
    data.content,
    data.file
  )

  if (!result.success) {
    console.error('Failed to edit message:', result.error)
  }
}
</script>

<template>
  <div class="flex h-full gap-6">
    <!-- Sidebar -->
    <div class="w-80 flex-shrink-0 overflow-y-auto border-r border-[var(--ui-border)] pr-4">
      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)] sm:p-8 mb-6">
        <div class="max-w-3xl">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-dimmed)]">
            <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
            Team workspace
          </div>
          <h2 class="text-3xl font-black text-[var(--ui-text-highlighted)] sm:text-4xl">
            Welcome
          </h2>
          <p class="mt-4 max-w-2xl text-base leading-7 text-[var(--ui-text-muted)]">
            {{ userStore.user?.name }}
          </p>
        </div>
      </section>

      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)] sm:p-8 mb-6">
        <h3 class="text-xl font-black text-[var(--ui-text-highlighted)]">Teams</h3>
        <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
          {{ teamStore.teams.length > 0 ? `${teamStore.teams.length} team(s)` : 'No teams' }}
        </p>

        <div v-if="teamStore.teams.length > 0" class="mt-6 space-y-2">
          <div
            v-for="team in teamStore.teams"
            :key="team.id"
            class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4 cursor-pointer hover:bg-[var(--ui-bg-elevated)] transition-colors"
            :class="team.id === teamStore.currentTeamId ? 'ring-2 ring-[var(--ui-primary)]' : ''"
          >
            <h4 class="font-semibold text-[var(--ui-text-highlighted)]">{{ team.name }}</h4>
            <p class="mt-1 text-xs text-[var(--ui-text-dimmed)]">
              👥 {{ team.members_count }}
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 shadow-[var(--shadow-md)] sm:p-8">
        <h3 class="text-xl font-black text-[var(--ui-text-highlighted)]">Channels</h3>
        <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
          {{ channelStore.channels.length > 0 ? `${channelStore.channels.length} channel(s)` : 'No channels' }}
        </p>

        <div v-if="channelStore.channels.length > 0" class="mt-6 space-y-2">
          <div
            v-for="channel in channelStore.channels"
            :key="channel.id"
            class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4 cursor-pointer hover:bg-[var(--ui-bg-elevated)] transition-colors"
            :class="channel.id === channelStore.currentChannelId ? 'ring-2 ring-[var(--ui-primary)]' : ''"
            @click="selectChannel(channel.id)"
          >
            <div v-if="editingChannelId === channel.id" class="space-y-3">
              <input
                v-model="editingChannelName"
                type="text"
                class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-[var(--ui-text)]"
                @keyup.enter="saveEdit"
                @click.stop
              />
              <div class="flex gap-2">
                <button
                  @click.stop="saveEdit"
                  class="flex-1 rounded-lg bg-[var(--ui-primary)] px-3 py-1 text-sm font-semibold text-[var(--ui-primary-foreground)] hover:opacity-90"
                >
                  Save
                </button>
                <button
                  @click.stop="cancelEdit"
                  class="flex-1 rounded-lg border border-[var(--ui-border)] px-3 py-1 text-sm font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg-muted)]"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div v-else>
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-semibold text-[var(--ui-text-highlighted)]"># {{ channel.name }}</h4>
                  <p class="mt-1 text-xs text-[var(--ui-text-dimmed)]">{{ channel.type }}</p>
                </div>
                <button
                  @click.stop="startEdit(channel.id, channel.name)"
                  class="text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors"
                  title="Edit channel"
                >
                  <UIcon name="i-lucide-edit-2" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <div v-if="showMessaging && channelStore.currentChannelId" class="flex-1 flex flex-col rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-[var(--shadow-md)] overflow-hidden">
        <!-- Channel Header -->
        <div class="border-b border-[var(--ui-border)] bg-[var(--ui-bg-muted)] px-6 py-4">
          <h2 class="text-xl font-bold text-[var(--ui-text-highlighted)]">
            # {{ channelStore.currentChannel?.name }}
          </h2>
          <p class="text-sm text-[var(--ui-text-muted)]">
            {{ messageStore.unreadCount }} unread message{{ messageStore.unreadCount !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Messages -->
        <MessageList
          :channel-id="channelStore.currentChannelId"
          :loading="messageStore.loading"
          @message-sent="handleMessageSent"
          @message-edited="handleMessageEdited"
        />
      </div>

      <div v-else class="flex-1 flex items-center justify-center rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-[var(--shadow-md)]">
        <div class="text-center">
          <UIcon name="i-mdi-chat-outline" class="w-16 h-16 text-[var(--ui-text-dimmed)] mx-auto mb-4" />
          <p class="text-[var(--ui-text-muted)]">Select a channel to start messaging</p>
        </div>
      </div>
    </div>
  </div>
</template>
