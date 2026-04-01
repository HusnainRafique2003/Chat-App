import { defineStore } from 'pinia'
import {
  createMessage,
  deleteMessage,
  markMessagesAsRead,
  reactToMessage,
  readMessages,
  searchMessages,
  updateMessage,
  type ChatMessage,
  type MessagePagination
} from '~/composables/useMessagesApi'

interface MessageState {
  currentChannelId: string
  messages: ChatMessage[]
  pagination: MessagePagination | null
  searchResults: ChatMessage[]
  searchQuery: string
  loading: boolean
  sending: boolean
  searching: boolean
  error: string | null
}

function upsertMessage(list: ChatMessage[], nextMessage: ChatMessage) {
  const index = list.findIndex(message => message.id === nextMessage.id)

  if (index === -1) {
    return [nextMessage, ...list]
  }

  const clone = [...list]
  clone[index] = nextMessage
  return clone
}

export const useMessageStore = defineStore('message', {
  state: (): MessageState => ({
    currentChannelId: '',
    messages: [],
    pagination: null,
    searchResults: [],
    searchQuery: '',
    loading: false,
    sending: false,
    searching: false,
    error: null
  }),

  getters: {
    sortedMessages: (state) => {
      return [...state.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
  },

  actions: {
    setChannel(channelId: string) {
      this.currentChannelId = channelId.trim()
      this.error = null
    },

    clearMessages() {
      this.messages = []
      this.pagination = null
      this.error = null
    },

    clearSearch() {
      this.searchQuery = ''
      this.searchResults = []
    },

    async fetchMessages(channelId = this.currentChannelId, page = 1, perPage = 20) {
      if (!channelId.trim()) {
        this.error = 'Channel ID is required'
        return { success: false, error: this.error }
      }

      this.loading = true
      this.error = null
      this.currentChannelId = channelId.trim()

      try {
        const response = await readMessages({
          channel_id: this.currentChannelId,
          page,
          per_page: perPage
        })

        const payload = response.data

        if (!payload.success) {
          this.error = payload.message || 'Unable to load messages'
          return { success: false, error: this.error }
        }

        this.messages = payload.data.messages || []
        this.pagination = payload.data.pagination || null

        return { success: true }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unable to load messages'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async sendMessage(payload: {
      channel_id?: string
      message: string
      file?: File | null
    }) {
      const channelId = (payload.channel_id || this.currentChannelId).trim()

      if (!channelId) {
        return { success: false, error: 'Channel ID is required' }
      }

      if (!payload.message.trim() && !payload.file) {
        return { success: false, error: 'Message or file is required' }
      }

      this.sending = true
      this.error = null

      try {
        const response = await createMessage({
          channel_id: channelId,
          message: payload.message,
          file: payload.file
        })
        const nextMessage = response.data.data.message

        this.messages = upsertMessage(this.messages, nextMessage)
        this.currentChannelId = channelId

        return { success: true, message: nextMessage }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send message'
        this.error = message
        return { success: false, error: message }
      } finally {
        this.sending = false
      }
    },

    async editMessage(payload: {
      channel_id?: string
      message_id: string
      message: string
      file?: File | null
    }) {
      const channelId = (payload.channel_id || this.currentChannelId).trim()

      if (!channelId) {
        return { success: false, error: 'Channel ID is required' }
      }

      this.sending = true
      this.error = null

      try {
        const response = await updateMessage({
          channel_id: channelId,
          message_id: payload.message_id,
          message: payload.message,
          file: payload.file
        })

        this.messages = upsertMessage(this.messages, response.data.data.message)
        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update message'
        this.error = message
        return { success: false, error: message }
      } finally {
        this.sending = false
      }
    },

    async removeMessage(payload: { channel_id?: string; message_id: string }) {
      const channelId = (payload.channel_id || this.currentChannelId).trim()

      if (!channelId) {
        return { success: false, error: 'Channel ID is required' }
      }

      this.error = null

      try {
        await deleteMessage({
          channel_id: channelId,
          message_id: payload.message_id
        })

        this.messages = this.messages.filter(message => message.id !== payload.message_id)
        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete message'
        this.error = message
        return { success: false, error: message }
      }
    },

    async runSearch(query: string, options?: { channel_id?: string; workspace_id?: string; page?: number; per_page?: number }) {
      const trimmed = query.trim()
      this.searchQuery = trimmed

      if (!trimmed) {
        this.searchResults = []
        return { success: true }
      }

      this.searching = true
      this.error = null

      try {
        const response = await searchMessages({
          query: trimmed,
          channel_id: options?.channel_id || this.currentChannelId || undefined,
          workspace_id: options?.workspace_id,
          page: options?.page,
          per_page: options?.per_page
        })

        this.searchResults = Array.isArray(response.data.data) ? response.data.data : []
        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to search messages'
        this.error = message
        return { success: false, error: message }
      } finally {
        this.searching = false
      }
    },

    async markRead(messageIds: string[], channelId = this.currentChannelId) {
      if (!channelId.trim() || !messageIds.length) {
        return { success: false, error: 'Channel ID and message IDs are required' }
      }

      try {
        await markMessagesAsRead({
          channel_id: channelId,
          message_ids: messageIds
        })

        this.messages = this.messages.map(message => {
          if (!messageIds.includes(message.id)) {
            return message
          }

          return {
            ...message,
            is_read_by_me: true,
            read_by_count: Math.max(message.read_by_count, 1)
          }
        })

        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to mark messages as read'
        this.error = message
        return { success: false, error: message }
      }
    },

    async react(payload: { messageId: string; emoji: string; channel_id?: string }) {
      const channelId = (payload.channel_id || this.currentChannelId).trim()

      if (!channelId) {
        return { success: false, error: 'Channel ID is required' }
      }

      try {
        const response = await reactToMessage({
          channel_id: channelId,
          message_ids: [payload.messageId],
          emoji: payload.emoji
        })

        this.messages = upsertMessage(this.messages, response.data.data.message)
        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update reaction'
        this.error = message
        return { success: false, error: message }
      }
    }
  }
})
