import { defineStore } from 'pinia'
import { createMessage, deleteMessage, markMessagesAsRead, reactToMessage, readMessages, searchMessages, updateMessage, type Message } from '~/composables/useMessagesApi'

interface MessageState {
  messages: Message[]
  loading: boolean
  searching: boolean
  currentChannelId: string | null
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export const useMessageStore = defineStore('messages', {
  state: (): MessageState => ({
    messages: [],
    loading: false,
    searching: false,
    currentChannelId: null,
    pagination: {
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1
    }
  }),

  getters: {
    sortedMessages: (state) => [...state.messages].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    unreadCount: (state) => state.messages.filter(m => !m.is_read_by_me).length
  },

  actions: {
    async fetchMessages(channelId: string, page = 1) {
      this.loading = true
      this.currentChannelId = channelId
      try {
        const response = await readMessages({
          channel_id: channelId,
          page,
          per_page: 20
        })
        const data = response.data

        if (data.success && data.data?.messages) {
          this.messages = data.data.messages

          // Mark unread messages as read when opening a channel.
          // (Best-effort; UI shouldn't block if this fails.)
          const unreadIds = this.messages.filter(m => !m.is_read_by_me).map(m => m.id)
          if (unreadIds.length) {
            this.markAsRead(channelId, unreadIds).catch(() => {})
          }

          this.pagination = data.data.pagination || {
            current_page: page,
            per_page: 20,
            total: data.data.messages.length,
            last_page: 1
          }
          return { success: true }
        }

        return { success: false, error: data.message || 'Failed to fetch messages' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch messages'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    async createMessage(channelId: string, content: string, file?: File) {
      try {
        const response = await createMessage({
          channel_id: channelId,
          message: content,
          file
        })
        const data = response.data

        if (data.success && data.data?.message) {
          this.messages.push(data.data.message)
  return { success: true, message: data.data.message }
        }

        return { success: false, error: data.message || 'Failed to create message' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create message'
        return { success: false, error: message }
      }
    },

    async updateMessage(channelId: string, messageId: string, content: string, file?: File) {
      try {
        const response = await updateMessage({
          channel_id: channelId,
          message_id: messageId,
          message: content,
          file
        })
        const data = response.data

        if (data.success && data.data?.message) {
          const index = this.messages.findIndex(m => m.id === messageId)
          if (index > -1) {
            this.messages[index] = data.data.message
          }
          return { success: true, message: data.data.message }
        }

        return { success: false, error: data.message || 'Failed to update message' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update message'
        return { success: false, error: message }
      }
    },

    async deleteMessage(channelId: string, messageId: string) {
      try {
        const response = await deleteMessage({
          channel_id: channelId,
          message_id: messageId
        })
        const data = response.data

        if (data.success) {
          this.messages = this.messages.filter(m => m.id !== messageId)
          return { success: true }
        }

        return { success: false, error: data.message || 'Failed to delete message' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete message'
        return { success: false, error: message }
      }
    },

    async searchMessages(query: string, channelId?: string) {
      this.searching = true
      try {
        const response = await searchMessages(query, { channel_id: channelId })
        const data = response.data

        if (data.success && Array.isArray(data.data)) {
          this.messages = data.data
          return { success: true, messages: data.data }
        }

        return { success: false, error: data.message || 'Search failed' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed'
        return { success: false, error: message }
      } finally {
        this.searching = false
      }
    },

    async markAsRead(channelId: string, messageIds: string[]) {
      try {
        const response = await markMessagesAsRead({
          channel_id: channelId,
          message_ids: messageIds
        })
        const data = response.data

        if (data.success) {
          messageIds.forEach(id => {
            const msg = this.messages.find(m => m.id === id)
            if (msg) msg.is_read_by_me = true
          })
          return { success: true }
        }

        return { success: false, error: data.message || 'Failed to mark as read' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to mark as read'
        return { success: false, error: message }
      }
    },

    async addReaction(channelId: string, messageId: string, emoji: string) {
      try {
        const response = await reactToMessage({
          channel_id: channelId,
          message_ids: [messageId],
          emoji
        })
        const data = response.data

        if (data.success && data.data?.message) {
          const index = this.messages.findIndex(m => m.id === messageId)
          if (index > -1) {
            this.messages[index] = data.data.message
          }
          return { success: true, message: data.data.message }
        }

        return { success: false, error: data.message || 'Failed to add reaction' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add reaction'
        return { success: false, error: message }
      }
    },

    clearMessages() {
      this.messages = []
      this.currentChannelId = null
      this.pagination = {
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 1
      }
    }
  }
})
