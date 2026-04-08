<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import MessageList from '~/components/messages/MessageList.vue'
import { useChannelStore } from '~/stores/useChannelStore'
import { useMessageStore } from '~/stores/useMessageStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: 'dashboard'
})

const userStore = useUserStore()
const teamStore = useTeamStore()
const channelStore = useChannelStore()
const messageStore = useMessageStore()
const workspaceStore = useWorkspaceStore()
const toast = useToast()

const showMessaging = ref(false)

// Auto-open the chat area when channels finish loading and a current channel becomes available.
watch(
  () => channelStore.currentChannelId,
  (channelId) => {
    if (channelId) {
      showMessaging.value = true
    }
  }
)

async function handleMessageSent(data: { content: string; file?: File }) {
  if (!channelStore.currentChannelId) return

  const result = await messageStore.createMessage(
    channelStore.currentChannelId,
    data.content,
    data.file
  )

  if (!result.success) {
    if (result.error?.includes('no longer a member of this direct channel')) {
      toast.add({
        title: 'This direct message is no longer available',
        description: 'The other user is no longer a member of that conversation.',
        color: 'warning'
      })
      return
    }

    toast.add({
      title: result.error || 'Failed to send message',
      color: 'error'
    })
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

function looksLikeUserId(value?: string | null) {
  return Boolean(value && /^[a-f0-9]{24}$/i.test(value))
}

function getCurrentChannelDisplayName() {
  const channel = channelStore.currentChannel
  if (!channel) return channelStore.currentChannelId || ''

  if (channel.type !== 'direct') {
    return channel.name || channel.id
  }

  const currentUserId = userStore.user?.id || (userStore.user as any)?._id
  const otherMemberId = channel.members?.find(member => member.user_id && member.user_id !== currentUserId)?.user_id
  const workspaceMembers = workspaceStore.currentWorkspace?.members || []

  if (otherMemberId) {
    const otherMember = workspaceMembers.find((member: any) =>
      member?.id === otherMemberId || member?._id === otherMemberId || member?.user_id === otherMemberId
    )

    if (otherMember?.name) {
      return otherMember.name
    }
  }

  const fallbackName = channel.name?.replace('DM: ', '') || channel.id
  return looksLikeUserId(fallbackName) ? channel.id : fallbackName
}
</script>

<template>
  <!-- AppSidebar is already rendered by `layouts/dashboard.vue`. This page renders only the chat area. -->
  <div class="h-full w-full flex flex-col overflow-hidden">
    <!-- Chat Messages Area -->
    <div
      v-if="showMessaging && channelStore.currentChannelId"
      class="flex h-full w-full flex-col overflow-hidden"
    >
      <!-- Messages List (takes remaining space with overflow) -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <MessageList
          :channel-id="channelStore.currentChannelId"
          :loading="messageStore.loading"
          @message-sent="handleMessageSent"
          @message-edited="handleMessageEdited"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center"
    >
      <div class="text-center">
        <UIcon name="i-mdi-chat-outline" class="mx-auto mb-4 h-16 w-16 text-[var(--ui-text-dimmed)]" />
        <p class="text-[var(--ui-text-muted)]">Select a channel from the sidebar to open messages</p>
      </div>
    </div>
  </div>
</template>
