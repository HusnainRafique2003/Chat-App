import { defineStore } from 'pinia'
import { addChannelMember } from '~/composables/useChannelsApi'
import { getUserFriendlyError } from '~/composables/useApiErrorHandler'
import { useAppToast } from '~/composables/useToast'
import {
  createMessageRequest,
  createOptimisticMessage,
  deleteMessageRequest,
  markMessagesAsReadRequest,
  reactToMessageRequest,
  readMessagesRequest,
  searchMessagesRequest,
  updateMessageRequest
} from '~/services/messageService'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import type { ApiPagination } from '~/types/api'
import type { Message } from '~/types/message'
import {
  createUserNameMap,
  extractMessagesFromPayload,
  extractPagination,
  mergeMessages,
  normalizeMessage,
  normalizeMessages
} from '~/utils/messageNormalizer'
import {
  canDeleteMessage,
  canEditMessage,
  deduplicateReactions,
  formatLocalForBackend
} from '~/utils/messageHelpers'

interface MessageState {
  messages: Message[]
  localScheduledMessages: Message[]
  loading: boolean
  loadingMore: boolean
  searching: boolean
  currentChannelId: string | null
  userNameCache: Record<string, string>
  pagination: ApiPagination
}

interface StoreActionResult {
  success: boolean
  error?: string
}

interface MessageActionResult extends StoreActionResult {
  message?: Message
}

interface SearchMessagesResult extends StoreActionResult {
  messages?: Message[]
}

interface MessageServicePayload {
  success?: boolean
  message?: string
  data?: Record<string, unknown>
}

const messageFetchRequests = new Map<string, Promise<StoreActionResult>>()

function emptyPagination(): ApiPagination {
  return {
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1
  }
}

export const useMessageStore = defineStore('messages', {
  state: (): MessageState => ({
    messages: [],
    localScheduledMessages: [],
    loading: false,
    loadingMore: false,
    searching: false,
    currentChannelId: null,
    userNameCache: {},
    pagination: emptyPagination()
  }),

  getters: {
    sortedMessages: (state) => {
      const activeChannelId = state.currentChannelId
      const userStore = useUserStore()
      const currentUserId = userStore.user?.id || (userStore.user as { _id?: string } | null)?._id
      const now = Date.now()

      return [...state.messages, ...state.localScheduledMessages]
        .filter(message => !activeChannelId || message.channel_id === activeChannelId)
        .filter((message) => {
          if (!message.schedule_time) return true

          const scheduleTime = new Date(message.schedule_time.includes(' ') ? message.schedule_time.replace(' ', 'T') : message.schedule_time).getTime()
          if (scheduleTime <= now) return true

          const senderId = message.sender?.id || message.sender_id
          if (senderId !== currentUserId) return false

          message.status = 'scheduled'
          return true
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    },

    unreadCount: state => state.messages.filter(message => !message.is_read_by_me).length,
    hasMoreMessages: state => state.pagination.current_page < state.pagination.last_page,
    isMessageOwner: () => {
      return (message: Message): boolean => {
        const userStore = useUserStore()
        return canEditMessage(message, userStore.user?.id || '')
      }
    }
  },

  actions: {
    buildUserNameCache() {
      const workspaceStore = useWorkspaceStore()
      const currentWorkspace = workspaceStore.workspaces.find(workspace => workspace.id === workspaceStore.currentWorkspaceId)
      const userNameMap = createUserNameMap(currentWorkspace?.members || [])
      this.userNameCache = Object.fromEntries(userNameMap)
    },

    setLocalScheduledMessages(messages: Message[]) {
      this.localScheduledMessages = messages
    },

    addLocalScheduledMessage(message: Message) {
      const exists = this.localScheduledMessages.some(existing => existing.id === message.id)
      if (!exists) {
        this.localScheduledMessages.push(message)
      }
    },

    removeLocalScheduledMessage(messageId: string) {
      this.localScheduledMessages = this.localScheduledMessages.filter(message => message.id !== messageId)
    },

    getSenderName(senderId: string, senderName?: string, isCurrentUser?: boolean): string {
      const userStore = useUserStore()

      if (senderName) return senderName
      if (isCurrentUser) return userStore.user?.name || 'You'
      return this.userNameCache[senderId] || senderId || 'Unknown'
    },

    async fetchMessages(channelId: string, page = 1, retryCount = 0, silent = false): Promise<StoreActionResult> {
      const { showError } = useAppToast()
      const errCtx = { action: 'fetch-messages', entityId: channelId }
      const requestKey = `${channelId}:${page}:${silent ? 'silent' : 'normal'}`

      if (messageFetchRequests.has(requestKey)) {
        return await messageFetchRequests.get(requestKey)!
      }

      if (!silent) {
        this.loading = true
      }

      if (this.currentChannelId && this.currentChannelId !== channelId) {
        this.messages = []
        this.pagination = emptyPagination()
      }

      this.currentChannelId = channelId
      this.buildUserNameCache()

      const request = (async (): Promise<StoreActionResult> => {
        const apiResult = await readMessagesRequest({
          channel_id: channelId,
          page,
          per_page: 20
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to fetch messages' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        const userStore = useUserStore()
        const workspaceStore = useWorkspaceStore()
        const currentWorkspace = workspaceStore.workspaces.find(workspace => workspace.id === workspaceStore.currentWorkspaceId)
        const normalizedMessages = normalizeMessages(extractMessagesFromPayload(payload), {
          channelId: channelId,
          currentUserId: userStore.user?.id,
          currentUserName: userStore.user?.name,
          workspaceMembers: currentWorkspace?.members || []
        })

        this.messages = mergeMessages(this.messages, normalizedMessages, silent)

        const unreadIds = this.messages.filter(message => !message.is_read_by_me).map(message => message.id)
        if (unreadIds.length && !silent) {
          this.markAsRead(channelId, unreadIds).catch(() => {})
        }

        this.pagination = extractPagination(payload, page, this.messages.length)
        return { success: true }
      })()

      messageFetchRequests.set(requestKey, request)

      try {
        return await request
      } catch (error) {
        showError(getUserFriendlyError(error, errCtx), errCtx)

        const errorMessage = error instanceof Error ? error.message : ''
        const is403NotMember = errorMessage.includes('You are not a member of this channel') || errorMessage.includes('not a member')
        const isDirectChannel = errorMessage.includes('Cannot add members to a direct channel')
        const isInactiveDirectChannel = errorMessage.includes('no longer a member of this direct channel')

        if (is403NotMember && retryCount === 0 && !isDirectChannel && !isInactiveDirectChannel) {
          try {
            const userStore = useUserStore()
            if (!userStore.user?.id) return { success: false, error: 'User not authenticated' }

            await addChannelMember({ channel_id: channelId, user_id: userStore.user.id })
            return this.fetchMessages(channelId, page, retryCount + 1, silent)
          } catch (memberError) {
            const memberErrorMessage = memberError instanceof Error ? memberError.message : 'Unknown error'
            if (memberErrorMessage.includes('already a member')) {
              return this.fetchMessages(channelId, page, retryCount + 1, silent)
            }

            return { success: false, error: `Failed to add member to channel: ${memberErrorMessage}` }
          }
        }

        if (isDirectChannel || isInactiveDirectChannel || errorMessage.includes('already a member')) {
          return { success: false, error: errorMessage }
        }

        return { success: false, error: errorMessage || 'Failed to fetch messages' }
      } finally {
        messageFetchRequests.delete(requestKey)
        if (!silent) {
          this.loading = false
        }
      }
    },

    async createMessage(channelId: string, content: string, file?: File, scheduledAt?: Date, retryCount = 0): Promise<MessageActionResult> {
      try {
        const userStore = useUserStore()
        const apiResult = await createMessageRequest({
          channel_id: channelId,
          message: content,
          file,
          schedule_time: formatLocalForBackend(scheduledAt)
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to create message' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        if (!payload?.success) {
          return { success: false, error: payload?.message || 'Failed to create message' }
        }

        const rawMessage = payload.data?.message || payload.data
        const normalized = normalizeMessage(
          rawMessage && typeof rawMessage === 'object'
            ? rawMessage
            : createOptimisticMessage({
                channelId,
                content,
                currentUserId: userStore.user?.id || (userStore.user as { _id?: string } | null)?._id || '',
                currentUserName: userStore.user?.name || 'You',
                currentUserEmail: userStore.user?.email || '',
                scheduleTime: formatLocalForBackend(scheduledAt) || null
              }),
          {
            channelId,
            currentUserId: userStore.user?.id,
            currentUserName: userStore.user?.name,
            userNameMap: new Map(Object.entries(this.userNameCache)),
            fallbackContent: content,
            forceReadByMe: true
          }
        )

        if (this.currentChannelId === channelId) {
          this.messages.push(normalized)
        }

        return { success: true, message: normalized }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : ''
        const is403NotMember = errorMessage.includes('You are not a member of this channel') || errorMessage.includes('not a member')
        const isDirectChannel = errorMessage.includes('Cannot add members to a direct channel')

        if (is403NotMember && retryCount === 0 && !isDirectChannel) {
          try {
            const userStore = useUserStore()
            if (!userStore.user?.id) {
              return { success: false, error: 'User not authenticated' }
            }

            await addChannelMember({
              channel_id: channelId,
              user_id: userStore.user.id
            })

            return this.createMessage(channelId, content, file, scheduledAt, retryCount + 1)
          } catch (memberError) {
            const memberErrorMessage = memberError instanceof Error ? memberError.message : 'Unknown error'

            if (memberErrorMessage.includes('already a member')) {
              return this.createMessage(channelId, content, file, scheduledAt, retryCount + 1)
            }

            return { success: false, error: `Failed to add member to channel: ${memberErrorMessage}` }
          }
        }

        if (isDirectChannel || errorMessage.includes('already a member')) {
          return { success: false, error: errorMessage }
        }

        return { success: false, error: errorMessage || 'Failed to create message' }
      }
    },

    async updateMessage(channelId: string, messageId: string, content: string, file?: File): Promise<MessageActionResult> {
      try {
        const userStore = useUserStore()
        const existingMessage = this.messages.find(message => message.id === messageId)

        if (!existingMessage) {
          return { success: false, error: 'Message not found in current channel' }
        }

        if (existingMessage.channel_id && existingMessage.channel_id !== channelId) {
          return { success: false, error: 'Cannot edit message from a different channel' }
        }

        if (!canEditMessage(existingMessage, userStore.user?.id || '')) {
          return { success: false, error: 'You can only edit your own messages' }
        }

        const apiResult = await updateMessageRequest({
          channel_id: channelId,
          message_id: messageId,
          message: content,
          file
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to update message' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        if (!payload?.success) {
          return { success: false, error: payload?.message || 'Failed to update message' }
        }

        const updatedMessage = payload.data?.message || payload.data
        if (!updatedMessage) {
          return { success: true }
        }

        const normalized = normalizeMessage(updatedMessage, {
          channelId,
          currentUserId: userStore.user?.id,
          currentUserName: userStore.user?.name,
          userNameMap: new Map(Object.entries(this.userNameCache)),
          fallbackContent: content,
          forceReadByMe: existingMessage.is_read_by_me,
          defaultStatus: existingMessage.status
        })

        const index = this.messages.findIndex(message => message.id === messageId)
        if (index > -1) {
          this.messages[index] = { ...this.messages[index], ...normalized }
        }

        return { success: true, message: normalized }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update message' }
      }
    },

    async deleteMessage(channelId: string, messageId: string): Promise<StoreActionResult> {
      try {
        const userStore = useUserStore()
        const message = this.messages.find(item => item.id === messageId)

        if (!message) {
          return { success: false, error: 'Message not found in current channel' }
        }

        if (message.channel_id && message.channel_id !== channelId) {
          return { success: false, error: 'Cannot delete message from a different channel' }
        }

        if (!canDeleteMessage(message, userStore.user?.id || '')) {
          return { success: false, error: 'You can only delete your own messages' }
        }

        const apiResult = await deleteMessageRequest({
          channel_id: channelId,
          message_id: messageId
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to delete message' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        if (payload?.success) {
          this.messages = this.messages.filter(item => item.id !== messageId)
          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to delete message' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete message' }
      }
    },

    async searchMessages(query: string, channelId?: string): Promise<SearchMessagesResult> {
      this.searching = true

      try {
        const apiResult = await searchMessagesRequest(query, { channel_id: channelId })
        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Search failed' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        const userStore = useUserStore()
        const workspaceStore = useWorkspaceStore()
        const currentWorkspace = workspaceStore.workspaces.find(workspace => workspace.id === workspaceStore.currentWorkspaceId)
        const normalizedMessages = normalizeMessages(extractMessagesFromPayload(payload?.data || payload), {
          channelId: channelId || this.currentChannelId || '',
          currentUserId: userStore.user?.id,
          currentUserName: userStore.user?.name,
          workspaceMembers: currentWorkspace?.members || []
        })

        this.messages = normalizedMessages
        return { success: true, messages: normalizedMessages }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Search failed' }
      } finally {
        this.searching = false
      }
    },

    async markAsRead(channelId: string, messageIds: string[]): Promise<StoreActionResult> {
      try {
        const apiResult = await markMessagesAsReadRequest({
          channel_id: channelId,
          message_ids: messageIds
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to mark as read' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        if (payload?.success) {
          messageIds.forEach((id) => {
            const message = this.messages.find(item => item.id === id && item.channel_id === channelId)
            if (message) {
              message.is_read_by_me = true
            }
          })

          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to mark as read' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as read' }
      }
    },

    async addReaction(channelId: string, messageId: string, emoji: string): Promise<MessageActionResult> {
      try {
        const currentUserId = useUserStore().user?.id
        const currentUserName = useUserStore().user?.name
        const message = this.messages.find(item => item.id === messageId && item.channel_id === channelId)
        if (!message) {
          return { success: false, error: 'Message not found' }
        }

        message.reactions_summary = deduplicateReactions(message.reactions_summary, currentUserId)

        const previousEmoji = message.reactions_summary.find(reaction => reaction.reacted_by_me)?.emoji || null
        const apiResult = await reactToMessageRequest({
          channel_id: channelId,
          message_ids: [messageId],
          emoji,
          previous_emoji: previousEmoji
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to add reaction' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        const updatedMessage = payload?.data?.message
        if (!payload?.success || !updatedMessage) {
          return { success: false, error: payload?.message || 'Failed to add reaction' }
        }

        const index = this.messages.findIndex(item => item.id === messageId && item.channel_id === channelId)
        if (index > -1) {
          const normalized = normalizeMessage(updatedMessage, {
            channelId,
            currentUserId,
            currentUserName,
            userNameMap: new Map(Object.entries(this.userNameCache)),
            defaultStatus: this.messages[index]?.status,
            forceReadByMe: this.messages[index]?.is_read_by_me
          })
          normalized.reactions_summary = deduplicateReactions(normalized.reactions_summary, currentUserId)
          this.messages[index] = normalized
          return { success: true, message: normalized }
        }

        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add reaction' }
      }
    },

    deduplicateReactions(reactions: Message['reactions_summary']): Message['reactions_summary'] {
      return deduplicateReactions(reactions, useUserStore().user?.id)
    },

    async loadMoreMessages(): Promise<StoreActionResult> {
      if (!this.currentChannelId) {
        return { success: false, error: 'No channel selected' }
      }

      if (!this.hasMoreMessages || this.loadingMore) {
        return { success: false, error: 'No more messages to load' }
      }

      this.loadingMore = true

      try {
        const nextPage = this.pagination.current_page + 1
        const apiResult = await readMessagesRequest({
          channel_id: this.currentChannelId,
          page: nextPage,
          per_page: 20
        })

        if (!apiResult.success) {
          return { success: false, error: apiResult.message || 'Failed to load more messages' }
        }

        const payload = apiResult.data?.data as MessageServicePayload | undefined
        const userStore = useUserStore()
        const workspaceStore = useWorkspaceStore()
        const currentWorkspace = workspaceStore.workspaces.find(workspace => workspace.id === workspaceStore.currentWorkspaceId)
        const normalizedMessages = normalizeMessages(extractMessagesFromPayload(payload), {
          channelId: this.currentChannelId,
          currentUserId: userStore.user?.id,
          currentUserName: userStore.user?.name,
          workspaceMembers: currentWorkspace?.members || []
        })

        if (normalizedMessages.length) {
          this.messages = [...normalizedMessages, ...this.messages]
        }

        this.pagination = extractPagination(payload, nextPage, this.pagination.total)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to load more messages' }
      } finally {
        this.loadingMore = false
      }
    },

    clearMessages() {
      this.messages = []
      this.currentChannelId = null
      this.pagination = emptyPagination()
    }
  }
})
