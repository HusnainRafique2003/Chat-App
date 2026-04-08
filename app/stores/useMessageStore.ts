import { defineStore } from 'pinia'
import { addChannelMember } from '~/composables/useChannelsApi'
import { canDeleteMessage, canEditMessage, createMessage, deleteMessage, markMessagesAsRead, reactToMessage, readMessages, searchMessages, updateMessage, type Message } from '~/composables/useMessagesApi'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

interface MessageState {
  messages: Message[]
  loading: boolean
  searching: boolean
  currentChannelId: string | null
  userNameCache: Record<string, string>
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
    userNameCache: {},
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
    unreadCount: (state) => state.messages.filter(m => !m.is_read_by_me).length,
    
    /**
     * Returns a function to check if the current user owns a message
     */
    isMessageOwner: () => {
      return (message: Message): boolean => {
        const userStore = useUserStore()
        return canEditMessage(message, userStore.user?.id || '')
      }
    }
  },

  actions: {
    /**
     * Build user name cache from workspace members
     */
    buildUserNameCache() {
      const workspaceStore = useWorkspaceStore()
      const currentWorkspace = workspaceStore.currentWorkspace
      
      if (currentWorkspace?.members) {
        this.userNameCache = {}
        currentWorkspace.members.forEach((member: any) => {
          const userId = member.id || member._id
          const userName = member.name
          if (userId && userName) {
            this.userNameCache[userId] = userName
          }
        })
        console.log('[Message Store] Built user name cache:', Object.keys(this.userNameCache).length, 'users')
      }
    },

    /**
     * Get sender name from cache or store
     */
    getSenderName(senderId: string, senderName?: string, isCurrentUser?: boolean): string {
      const userStore = useUserStore()
      
      // If sender name is already provided, use it
      if (senderName) {
        return senderName
      }
      
      // If this is the current user, use their name
      if (isCurrentUser) {
        return userStore.user?.name || 'You'
      }
      
      // Try to find in cache
      if (this.userNameCache[senderId]) {
        return this.userNameCache[senderId]
      }
      
      // Fallback to ID
      return senderId || 'Unknown'
    },

    async fetchMessages(channelId: string, page = 1, retryCount = 0) {
      this.loading = true
      
      // Clear messages if switching to a different channel
      if (this.currentChannelId && this.currentChannelId !== channelId) {
        console.log('[Message Store] Switching channels from', this.currentChannelId, 'to', channelId)
        this.messages = []
        this.pagination = {
          current_page: 1,
          per_page: 20,
          total: 0,
          last_page: 1
        }
      }
      
      this.currentChannelId = channelId
      
      // Build user name cache from workspace members
      this.buildUserNameCache()
      
      try {
        console.log('[Message Store] Fetching messages for channel:', { channelId, page, retryCount })
        
        const response = await readMessages({
          channel_id: channelId,
          page,
          per_page: 20
        })
        const data = response.data

        console.log('[Message Store] Raw API response:', {
          hasSuccess: 'success' in data,
          success: data.success,
          hasData: 'data' in data,
          dataType: Array.isArray(data) ? 'array' : Array.isArray(data.data) ? 'data-is-array' : typeof data.data,
          dataKeys: data.data ? (Array.isArray(data.data) ? `[array-${data.data.length}]` : Object.keys(data.data)) : 'no-data',
          fullResponse: JSON.stringify(data).slice(0, 500)
        })
        console.log('[Message Store] Full data.data object:', data.data)
        console.log('[Message Store] Complete response for debugging:', data)

        // Extract messages from various possible response shapes
        let messagesArray: Message[] = []

        // Comprehensive extraction with detailed logging
        console.log('[Message Store] Starting message extraction...')
        
        if (data.success || data.data) {
          // Debug: Check data.data.messages specifically
          console.log('[Message Store] DEBUG - data.data type:', typeof data.data)
          console.log('[Message Store] DEBUG - data.data.messages exists?:', 'messages' in (data.data || {}))
          console.log('[Message Store] DEBUG - data.data.messages type:', typeof data.data?.messages)
          console.log('[Message Store] DEBUG - data.data.messages isArray?:', Array.isArray(data.data?.messages))
          console.log('[Message Store] DEBUG - data.data.messages value:', data.data?.messages)
          
          // Try all possible locations where messages might be
          
          // Pattern 1: data.messages (direct in data)
          if (data.data?.messages && Array.isArray(data.data.messages)) {
            messagesArray = data.data.messages
            console.log('[Message Store] ✓ Found messages at data.messages:', messagesArray.length)
          }
          // Pattern 1b: Laravel Paginator - data.messages.data (pagination wrapper)
          else if (data.data?.messages?.data && Array.isArray(data.data.messages.data)) {
            messagesArray = data.data.messages.data
            console.log('[Message Store] ✓ Found messages at data.messages.data (Laravel Paginator):', messagesArray.length)
          }
          // Pattern 2: data.data.data (nested)
          else if (data.data?.data && Array.isArray(data.data.data)) {
            messagesArray = data.data.data
            console.log('[Message Store] ✓ Found messages at data.data.data:', messagesArray.length)
          }
          // Pattern 3: data.data is array
          else if (Array.isArray(data.data)) {
            messagesArray = data.data
            console.log('[Message Store] ✓ Found messages as data array:', messagesArray.length)
          }
          // Pattern 4: data.result
          else if (data.data?.result && Array.isArray(data.data.result)) {
            messagesArray = data.data.result
            console.log('[Message Store] ✓ Found messages at data.result:', messagesArray.length)
          }
          // Pattern 5: data.items
          else if (data.data?.items && Array.isArray(data.data.items)) {
            messagesArray = data.data.items
            console.log('[Message Store] ✓ Found messages at data.items:', messagesArray.length)
          }
          // Pattern 6: data._data (Illuminate)
          else if (data.data?._data && Array.isArray(data.data._data)) {
            messagesArray = data.data._data
            console.log('[Message Store] ✓ Found messages at data._data:', messagesArray.length)
          }
          // Pattern 7: Try to find any array property (excluding pagination/meta)
          else if (typeof data.data === 'object' && data.data !== null) {
            const arrayKeys = Object.keys(data.data).filter(key => Array.isArray(data.data[key]) && !['links', 'meta', 'pagination'].includes(key))
            if (arrayKeys.length > 0) {
              messagesArray = data.data[arrayKeys[0]]
              console.log(`[Message Store] ✓ Found messages at data.${arrayKeys[0]}:`, messagesArray.length)
            } else {
              console.log('[Message Store] ✗ No array found in data.data. Keys:', Object.keys(data.data))
            }
          }
          
          // Fallback: Check if messages is at top level
          if (messagesArray.length === 0 && data.messages && Array.isArray(data.messages)) {
            messagesArray = data.messages
            console.log('[Message Store] ✓ Found messages at top level data.messages:', messagesArray.length)
          }
          
          // Fallback: Check response wrapper
          if (messagesArray.length === 0 && data.response && Array.isArray(data.response)) {
            messagesArray = data.response
            console.log('[Message Store] ✓ Found messages at data.response:', messagesArray.length)
          }
        } else if (Array.isArray(data)) {
          messagesArray = data
          console.log('[Message Store] ✓ Response is raw array:', messagesArray.length)
        }

        // Normalize id field (some backends return _id only)
        // IMPORTANT: Filter messages to only include those from the current channel
        console.log('[Message Store] Before filtering - messagesArray length:', messagesArray.length)
        console.log('[Message Store] First message RAW sample:', messagesArray[0])
        console.log('[Message Store] First message keys:', messagesArray[0] ? Object.keys(messagesArray[0]) : 'no messages')
        
        const userStore = useUserStore()
        const workspaceStore = useWorkspaceStore()
        const currentUserId = userStore.user?.id
        const currentUserName = userStore.user?.name
        const workspaceMembers = workspaceStore.currentWorkspace?.members || []
        const userNameMap = new Map<string, string>()

        workspaceMembers.forEach((member: any) => {
          const ids = [member?.id, member?._id, member?.user_id].filter(Boolean)
          const name = member?.name || member?.user?.name

          if (name) {
            ids.forEach((id: string) => userNameMap.set(id, name))
          }
        })

        const looksLikeUserId = (value?: string | null) => Boolean(value && /^[a-f0-9]{24}$/i.test(value))
        
        this.messages = messagesArray
          .filter((m: any) => !m.channel_id || m.channel_id === channelId)
          .map((m: any) => {
            const senderId = m.sender?.id || m.sender?._id || m.sender_id || ''
            const backendSenderName = m.sender?.name
            let senderName = backendSenderName
             
            if ((!senderName || looksLikeUserId(senderName)) && senderId === currentUserId) {
              senderName = currentUserName || 'You'
            } else if (!senderName || looksLikeUserId(senderName)) {
              senderName = userNameMap.get(senderId) || senderName
            }

            if (!senderName) {
              senderName = 'Unknown'
            }
             
            const normalized = {
              ...m,
              id: m.id || m._id,
              channel_id: m.channel_id || channelId,
              sender: {
                ...(m.sender || {}),
                id: senderId,
                name: senderName, 
                email: m.sender?.email || '',
                is_active: m.sender?.is_active ?? true 
              },
              reactions_summary: m.reactions_summary || [],
              is_read_by_me: m.is_read_by_me ?? false,
              read_by_count: m.read_by_count ?? 0,
              content: m.content || m.message || m.text || m.body || '',
            }
            return normalized
          })

        console.log('[Message Store] After filtering & mapping - final count:', this.messages.length)
        if (this.messages.length > 0) {
          console.log('[Message Store] First normalized message:', this.messages[0])
          console.log('[Message Store] Message content check:', {
            id: this.messages[0].id,
            content: this.messages[0].content?.slice(0, 50),
            sender: this.messages[0].sender?.name,
            channel_id: this.messages[0].channel_id
          })
        }

        console.log('[Message Store] Messages loaded:', this.messages.length, 'messages')

        // Mark unread messages as read when opening a channel.
        const unreadIds = this.messages.filter(m => !m.is_read_by_me).map(m => m.id)
        if (unreadIds.length) {
          console.log('[Message Store] Marking', unreadIds.length, 'messages as read')
          this.markAsRead(channelId, unreadIds).catch(() => {})
        }

        // Extract pagination info per API documentation
        // Pagination can be at: data.data.messages (Laravel Paginator) or data.data directly
        const paginationSource = data.data?.messages || data.data
        this.pagination = {
          current_page: paginationSource?.current_page ?? page,
          per_page: paginationSource?.per_page ?? 20,
          total: paginationSource?.total ?? this.messages.length,
          last_page: paginationSource?.last_page ?? 1
        }

        console.log('[Message Store] Pagination info:', this.pagination)

        return { success: true }
      } catch (error) {
        // Check if error is "not a member of this channel"
        const errorMessage = error instanceof Error ? error.message : ''
        const is403NotMember = errorMessage.includes('You are not a member of this channel') || 
                                errorMessage.includes('not a member')
        const isDirectChannel = errorMessage.includes('Cannot add members to a direct channel')
        const isInactiveDirectChannel = errorMessage.includes('no longer a member of this direct channel')
        
        if (is403NotMember && retryCount === 0 && !isDirectChannel && !isInactiveDirectChannel) {
          try {
            const userStore = useUserStore()
            if (!userStore.user?.id) {
              console.error('[Message Store] Cannot auto-add member: No user ID found')
              return { success: false, error: 'User not authenticated' }
            }

            console.log('[Message Store] Auto-adding user to channel:', { channelId, userId: userStore.user.id })
            
            // Automatically add the user to the channel
            await addChannelMember({
              channel_id: channelId,
              user_id: userStore.user.id
            })
            
            console.log('[Message Store] User successfully added to channel, retrying message fetch')
            
            // Retry fetching messages (with retryCount = 1 to prevent infinite retries)
            return this.fetchMessages(channelId, page, retryCount + 1)
          } catch (memberError) {
            const memberErrorMessage = memberError instanceof Error ? memberError.message : 'Unknown error'
            
            // If already a member, try fetching messages anyway
            if (memberErrorMessage.includes('already a member')) {
              console.log('[Message Store] User already a member, retrying message fetch')
              return this.fetchMessages(channelId, page, retryCount + 1)
            }
            
            console.error('[Message Store] Failed to add user to channel:', { 
              error: memberErrorMessage, 
              channelId 
            })
            return { success: false, error: `Failed to add member to channel: ${memberErrorMessage}` }
          }
        }
        
        // For direct channels or if already a member, just show the error
        if (isDirectChannel || isInactiveDirectChannel || errorMessage.includes('already a member')) {
          console.warn('[Message Store] Direct channel or already member, cannot auto-add:', { channelId, errorMessage })
          return { success: false, error: errorMessage }
        }
        
        const message = errorMessage || 'Failed to fetch messages'
        console.error('[Message Store] Error fetching messages:', { error: message, channelId })
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    async createMessage(channelId: string, content: string, file?: File, retryCount = 0) {
      try {
        const userStore = useUserStore()
        
        const response = await createMessage({
          channel_id: channelId,
          message: content,
          file
        })
        const data = response.data

        if (data.success) {
          // Extract the newly created message from response
          const newMessage = data.data?.message || data.data
          if (newMessage) {
            const senderName = this.getSenderName(newMessage.sender_id, newMessage.sender?.name, true)
            
            const normalized = {
              ...newMessage,
              id: newMessage.id || newMessage._id,
              channel_id: channelId,
              sender: newMessage.sender || { id: newMessage.sender_id, name: senderName, email: '', is_active: true },
              reactions_summary: newMessage.reactions_summary || [],
              is_read_by_me: true,
              read_by_count: newMessage.read_by_count ?? 0,
              content: newMessage.content || newMessage.message || content,
            }
            // Only add message if we're currently viewing this channel
            if (this.currentChannelId === channelId) {
              this.messages.push(normalized)
            }
            return { success: true, message: normalized }
          }

          // If we can't extract the message, just re-fetch
          await this.fetchMessages(channelId)
          return { success: true }
        }

        return { success: false, error: data.message || 'Failed to create message' }
      } catch (error) {
        // Check if error is "not a member of this channel"
        const errorMessage = error instanceof Error ? error.message : ''
        const is403NotMember = errorMessage.includes('You are not a member of this channel') || 
                                errorMessage.includes('not a member')
        const isDirectChannel = errorMessage.includes('Cannot add members to a direct channel')
        
        if (is403NotMember && retryCount === 0 && !isDirectChannel) {
          try {
            const userStore = useUserStore()
            if (!userStore.user?.id) {
              console.error('[Message Store] Cannot auto-add member: No user ID found')
              return { success: false, error: 'User not authenticated' }
            }

            console.log('[Message Store] Auto-adding user to channel for message creation:', { channelId, userId: userStore.user.id })
            
            // Automatically add the user to the channel
            await addChannelMember({
              channel_id: channelId,
              user_id: userStore.user.id
            })
            
            console.log('[Message Store] User successfully added to channel, retrying message creation')
            
            // Retry creating message (with retryCount = 1 to prevent infinite retries)
            return this.createMessage(channelId, content, file, retryCount + 1)
          } catch (memberError) {
            const memberErrorMessage = memberError instanceof Error ? memberError.message : 'Unknown error'
            
            // If already a member, try creating message anyway
            if (memberErrorMessage.includes('already a member')) {
              console.log('[Message Store] User already a member, retrying message creation')
              return this.createMessage(channelId, content, file, retryCount + 1)
            }
            
            console.error('[Message Store] Failed to add user to channel:', { 
              error: memberErrorMessage, 
              channelId 
            })
            return { success: false, error: `Failed to add member to channel: ${memberErrorMessage}` }
          }
        }
        
        // For direct channels or if already a member, just show the error
        if (isDirectChannel || errorMessage.includes('already a member')) {
          console.warn('[Message Store] Direct channel or already member, cannot auto-add:', { channelId, errorMessage })
          return { success: false, error: errorMessage }
        }
        
        const message = errorMessage || 'Failed to create message'
        return { success: false, error: message }
      }
    },

    async updateMessage(channelId: string, messageId: string, content: string, file?: File) {
      try {
        const userStore = useUserStore()
        const message = this.messages.find(m => m.id === messageId)

        // Check if message exists and belongs to current channel
        if (!message) {
          return { success: false, error: 'Message not found in current channel' }
        }

        if (message.channel_id && message.channel_id !== channelId) {
          return { success: false, error: 'Cannot edit message from a different channel' }
        }

        // Check if user owns the message
        if (!canEditMessage(message, userStore.user?.id || '')) {
          return { success: false, error: 'You can only edit your own messages' }
        }

        console.log('[Message Store] Updating message:', { messageId, channelId, userId: userStore.user?.id })

        const response = await updateMessage({
          channel_id: channelId,
          message_id: messageId,
          message: content,
          file
        })
        const data = response.data

        if (data.success) {
          const updatedMessage = data.data?.message || data.data
          if (updatedMessage) {
            const index = this.messages.findIndex(m => m.id === messageId)
            if (index > -1) {
              this.messages[index] = {
                ...this.messages[index],
                ...updatedMessage,
                id: updatedMessage.id || updatedMessage._id || messageId,
                channel_id: channelId,
                content: updatedMessage.content || updatedMessage.message || content,
              }
              console.log('[Message Store] Message updated successfully')
            }
            return { success: true, message: updatedMessage }
          }
          return { success: true }
        }

        return { success: false, error: data.message || 'Failed to update message' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update message'
        console.error('[Message Store] Error updating message:', { error: message, messageId })
        return { success: false, error: message }
      }
    },

    async deleteMessage(channelId: string, messageId: string) {
      try {
        const userStore = useUserStore()
        const message = this.messages.find(m => m.id === messageId)

        // Check if message exists and belongs to current channel
        if (!message) {
          return { success: false, error: 'Message not found in current channel' }
        }

        if (message.channel_id && message.channel_id !== channelId) {
          return { success: false, error: 'Cannot delete message from a different channel' }
        }

        // Check if user owns the message
        if (!canDeleteMessage(message, userStore.user?.id || '')) {
          return { success: false, error: 'You can only delete your own messages' }
        }

        console.log('[Message Store] Deleting message:', { messageId, channelId, userId: userStore.user?.id })

        const response = await deleteMessage({
          channel_id: channelId,
          message_id: messageId
        })
        const data = response.data

        if (data.success) {
          this.messages = this.messages.filter(m => m.id !== messageId)
          console.log('[Message Store] Message deleted successfully')
          return { success: true }
        }

        return { success: false, error: data.message || 'Failed to delete message' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete message'
        console.error('[Message Store] Error deleting message:', { error: message, messageId })
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
            const msg = this.messages.find(m => m.id === id && m.channel_id === channelId)
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
          const index = this.messages.findIndex(m => m.id === messageId && m.channel_id === channelId)
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
