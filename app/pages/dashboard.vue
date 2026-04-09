<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import { useScheduledMessages, type ScheduledMessageJob } from '~/composables/useScheduledMessages'
import MessageList from '~/components/messages/MessageList.vue'
import type { Message } from '~/composables/useMessagesApi'
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
const { enqueueScheduledMessage, getScheduledMessages, processDueScheduledMessages } = useScheduledMessages()

const showMessaging = ref(false)
let scheduledMessageInterval: ReturnType<typeof setInterval> | null = null

// Auto-open the chat area when channels finish loading and a current channel becomes available.
watch(
  () => channelStore.currentChannelId,
  (channelId) => {
    if (channelId) {
      showMessaging.value = true
    }
  }
)

async function sendScheduledJob(job: ScheduledMessageJob) {
  const result = await messageStore.createMessage(
    job.channelId,
    job.content,
    undefined
  )

  if (!result.success) {
    toast.add({
      title: result.error || 'Failed to send scheduled message',
      color: 'error'
    })
    return false
  }

  messageStore.removeLocalScheduledMessage(job.id)
  return true
}

function toLocalScheduledMessage(job: ScheduledMessageJob): Message {
  return {
    id: job.id,
    _id: job.id,
    workspace_id: job.workspaceId,
    sender_id: job.senderId,
    receiver_id: null,
    channel_id: job.channelId,
    message_type: 'text',
    content: job.content,
    file_path: null,
    file_name: null,
    file_mime: null,
    file_download_url: null,
    schedule_time: job.scheduledAt,
    status: 'scheduled',
    sender: {
      id: job.senderId,
      name: job.senderName || 'You',
      email: job.senderEmail,
      is_active: true
    },
    receiver: null,
    channel: {
      id: job.channelId,
      name: job.channelName || 'Scheduled message'
    },
    created_at: job.createdAt,
    updated_at: job.createdAt,
    read_by_count: 0,
    is_read_by_me: true,
    reactions_summary: [],
    is_local_only: true
  }
}

function syncScheduledMessagesFromStorage() {
  const jobs = getScheduledMessages()
  messageStore.setLocalScheduledMessages(jobs.map(toLocalScheduledMessage))
}

async function handleMessageSent(data: { content: string; file?: File; scheduledAt?: Date }) {
  if (!channelStore.currentChannelId) return

  if (data.scheduledAt) {
    if (data.file) {
      toast.add({
        title: 'Scheduled attachments are not supported yet',
        description: 'Send the file now or schedule a text-only message.',
        color: 'warning'
      })
      return
    }

    const createdAt = new Date().toISOString()
    const scheduledJob = enqueueScheduledMessage({
      channelId: channelStore.currentChannelId,
      content: data.content,
      scheduledAt: data.scheduledAt.toISOString(),
      createdAt,
      workspaceId: workspaceStore.currentWorkspace?.id || (workspaceStore.currentWorkspace as any)?._id || '',
      senderId: userStore.user?.id || '',
      senderName: userStore.user?.name || 'You',
      senderEmail: userStore.user?.email || '',
      channelName: channelStore.currentChannel?.name || ''
    })
    messageStore.addLocalScheduledMessage(toLocalScheduledMessage(scheduledJob))

    toast.add({
      title: 'Message scheduled',
      description: `It will send at ${data.scheduledAt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}.`,
      color: 'success'
    })
    return
  }

  if (data.file?.type.startsWith('audio/')) {
    toast.add({
      title: 'Voice notes are not supported by the current server',
      description: 'The API is rejecting audio uploads with "File type not allowed." Please enable audio file types on the backend to send voice notes.',
      color: 'warning'
    })
    return
  }

  const result = await messageStore.createMessage(
    channelStore.currentChannelId,
    data.content,
    data.file,
    data.scheduledAt
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

onMounted(() => {
  syncScheduledMessagesFromStorage()
  processDueScheduledMessages(sendScheduledJob)
  scheduledMessageInterval = setInterval(() => {
    processDueScheduledMessages(sendScheduledJob)
  }, 1000)
})

onUnmounted(() => {
  if (scheduledMessageInterval) {
    clearInterval(scheduledMessageInterval)
    scheduledMessageInterval = null
  }
})
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <div
      v-if="showMessaging && channelStore.currentChannelId"
      class="flex h-full w-full flex-col overflow-hidden"
    >
      <div class="flex-1 min-h-0 overflow-hidden">
        <MessageList
          :channel-id="channelStore.currentChannelId"
          :loading="messageStore.loading"
          @message-sent="handleMessageSent"
          @message-edited="handleMessageEdited"
        />
      </div>
    </div>

    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center px-6 text-center"
    >
      <div class="max-w-md">
        <UIcon name="i-mdi-chat-outline" class="mx-auto mb-4 h-16 w-16 text-[var(--ui-text-dimmed)]" />
        <p class="text-sm text-[var(--ui-text-muted)] sm:text-base">Select a channel from the sidebar to open messages</p>
      </div>
    </div>
  </div>
</template>
