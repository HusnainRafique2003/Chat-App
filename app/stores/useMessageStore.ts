import { defineStore } from 'pinia'
import { addChannelMember } from '~/composables/useChannelsApi'
import { canDeleteMessage, canEditMessage, createMessage, deleteMessage, markMessagesAsRead, reactToMessage, readMessages, searchMessages, updateMessage, type Message } from '~/composables/useMessagesApi'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'

interface MessageState {
  messages: Message[]
  localScheduledMessages: Message[]
  loading: boolean
  loadingMore: boolean
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

function normalizeDateValue(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && '$date' in value) {
    const dateValue = (value as { $date?: unknown }).$date
    return typeof dateValue === 'string' ? dateValue : null
  }
  return null
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
    pagination: {
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1
    }
  }),

  getters: {
    sortedMessages: (state) => [...state.messages, ...state.localScheduledMessages].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    unreadCount: (state) => state.messages.filter(m => !m.is_read_by_me).length,
    
    /**
     * Check if there are more messages to load
     */
    hasMoreMessages: (state) => state.pagination.current_page < state.pagination.last_page,
    
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

    async fetchMessages(channelId: string, page = 1, retryCount = 0): Promise<StoreActionResult> {
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
            const recordData = data.data as Record<string, unknown>
            const arrayKeys = Object.keys(recordData).filter(key => Array.isArray(recordData[key]) && !['links', 'meta', 'pagination'].includes(key))
            const firstArrayKey = arrayKeys[0]
            if (firstArrayKey) {
              messagesArray = recordData[firstArrayKey] as Message[]
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
              schedule_time: normalizeDateValue(m.schedule_time),
              status: m.status || 'sent',
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
        const firstMessage = this.messages[0]
        if (firstMessage) {
          console.log('[Message Store] First normalized message:', firstMessage)
          console.log('[Message Store] Message content check:', {
            id: firstMessage.id,
            content: firstMessage.content?.slice(0, 50),
            sender: firstMessage.sender?.name,
            channel_id: firstMessage.channel_id
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

    async createMessage(channelId: string, content: string, file?: File, scheduledAt?: Date, retryCount = 0): Promise<MessageActionResult> {
      try {
        const userStore = useUserStore()
        
        const response = await createMessage({
          channel_id: channelId,
          message: content,
          file,
          schedule_time: scheduledAt?.toISOString()
        })
        const data = response.data

        if (data.success) {
          console.log('[Message Store] Message creation successful, response data:', {
            hasData: !!data.data,
            dataType: typeof data.data,
            dataKeys: data.data ? Object.keys(data.data) : [],
            dataMessage: data.data?.message ? 'found at data.message' : 'not found'
          })

          // Extract the newly created message from response
          let newMessage = data.data?.message || data.data
          
          // If extraction still fails, construct message from request data + current user
          if (!newMessage || typeof newMessage !== 'object') {
            console.log('[Message Store] Message not found in response, constructing from request data')
            const currentUserId = userStore.user?.id || (userStore.user as any)?._id
            const currentUserName = userStore.user?.name || 'You'
            
            // Construct a minimal message object with the data we have
            newMessage = {
              id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              channel_id: channelId,
              sender_id: currentUserId,
              content: content,
              message: content,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              workspace_id: '',
              receiver_id: null,
              message_type: 'text',
              file_path: null,
              file_name: null,
              file_mime: null,
              file_download_url: null,
              sender: {
                id: currentUserId,
                name: currentUserName,
                email: userStore.user?.email || '',
                is_active: true
              },
              receiver: null,
              channel: { id: channelId, name: '' },
              read_by_count: 0,
              is_read_by_me: true,
              reactions_summary: []
            }
          }
          
          if (newMessage) {
            const senderName = this.getSenderName(newMessage.sender_id, newMessage.sender?.name, true)
            
            const normalized = {
              ...newMessage,
              id: newMessage.id || newMessage._id,
              channel_id: channelId,
              schedule_time: normalizeDateValue(newMessage.schedule_time) || scheduledAt?.toISOString() || null,
              status: newMessage.status || 'sent',
              sender: newMessage.sender || { id: newMessage.sender_id, name: senderName, email: '', is_active: true },
              reactions_summary: newMessage.reactions_summary || [],
              is_read_by_me: true,
              read_by_count: newMessage.read_by_count ?? 0,
              content: newMessage.content || newMessage.message || content,
            }
            // Only add message if we're currently viewing this channel
            if (this.currentChannelId === channelId) {
              console.log('[Message Store] Adding message to current channel view:', {
                messageId: normalized.id,
                content: normalized.content?.slice(0, 30),
                currentChannelId: this.currentChannelId
              })
              this.messages.push(normalized)
            } else {
              console.log('[Message Store] Not adding message - viewing different channel', {
                messageChannelId: channelId,
                currentChannelId: this.currentChannelId
              })
            }
            return { success: true, message: normalized }
          }

          // Fallback: re-fetch if still no message
          console.log('[Message Store] Could not construct message, falling back to refetch')
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
            return this.createMessage(channelId, content, file, scheduledAt, retryCount + 1)
          } catch (memberError) {
            const memberErrorMessage = memberError instanceof Error ? memberError.message : 'Unknown error'
            
            // If already a member, try creating message anyway
            if (memberErrorMessage.includes('already a member')) {
              console.log('[Message Store] User already a member, retrying message creation')
              return this.createMessage(channelId, content, file, scheduledAt, retryCount + 1)
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

    async searchMessages(query: string, channelId?: string): Promise<SearchMessagesResult> {
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

    /**
     * Add or toggle a reaction on a message (WhatsApp-like behavior).
     * 
     * Logic:
     * - If user hasn't reacted: Add new reaction
     * - If user reacted with SAME emoji: Remove reaction (toggle)
     * - If user reacted with DIFFERENT emoji: Replace with new emoji
     * 
     * @param channelId - The channel containing the message
     * @param messageId - The message to react to
     * @param emoji - The emoji to react with
     */
    async addReaction(channelId: string, messageId: string, emoji: string) {
      try {
        // Find the message
        const message = this.messages.find(m => m.id === messageId && m.channel_id === channelId)
        if (!message) {
          return { success: false, error: 'Message not found' }
        }

        // Deduplicate reactions on client side (if backend has duplicates)
        message.reactions_summary = this.deduplicateReactions(message.reactions_summary)

        // Find user's current reaction emoji (if any)
        const userReaction = message.reactions_summary.find(r => r.reacted_by_me)
        const previousEmoji = userReaction?.emoji || null

        console.log('[Message Store] Reaction action:', {
          messageId,
          newEmoji: emoji,
          previousEmoji,
          action: emoji === previousEmoji ? 'TOGGLE/REMOVE' : previousEmoji ? 'REPLACE' : 'ADD'
        })

        // Call API with previous emoji info so backend can implement toggle/replace logic
        const response = await reactToMessage({
          channel_id: channelId,
          message_ids: [messageId],
          emoji,
          previous_emoji: previousEmoji
        })
        const data = response.data

        if (data.success && data.data?.message) {
          const index = this.messages.findIndex(m => m.id === messageId && m.channel_id === channelId)
          if (index > -1) {
            // Deduplicate reactions from API response
            const updatedMessage = data.data.message
            updatedMessage.reactions_summary = this.deduplicateReactions(updatedMessage.reactions_summary)
            this.messages[index] = updatedMessage

            console.log('[Message Store] Reaction updated successfully:', {
              messageId,
              newReactions: this.messages[index].reactions_summary
            })
          }
          return { success: true, message: data.data.message }
        }

        return { success: false, error: data.message || 'Failed to add reaction' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add reaction'
        console.error('[Message Store] Reaction error:', message)
        return { success: false, error: message }
      }
    },

    /**
     * Deduplicate reactions to ensure only one reaction per user per message.
     * This is a CLIENT-SIDE workaround until backend implements the unique constraint.
     * 
     * @param reactions - Array of reaction summaries from API
     * @returns Deduplicated reactions with only the latest emoji per user
     */
    deduplicateReactions(reactions: any[]): any[] {
      if (!reactions || reactions.length === 0) return reactions

      const userReactionMap = new Map<string, any>()
      const currentUserId = useUserStore().user?.id

      // For each reaction, check if this user appears in reacted_by
      reactions.forEach((reaction) => {
        if (reaction.reacted_by && Array.isArray(reaction.reacted_by)) {
          reaction.reacted_by.forEach((userId: string) => {
            // Keep track of the latest reaction for this user
            // (In case of duplicates, keep this emoji)
            userReactionMap.set(userId, reaction.emoji)
          })
        }
      })

      // Now rebuild reactions_summary with deduplicated data
      const deduplicatedMap = new Map<string, any>()

      reactions.forEach((reaction) => {
        if (reaction.reacted_by && Array.isArray(reaction.reacted_by)) {
          // Filter reacted_by to remove users who have reactions on other emojis
          const dedupReactedBy = reaction.reacted_by.filter((userId: string) => {
            return userReactionMap.get(userId) === reaction.emoji
          })

          if (dedupReactedBy.length > 0) {
            // Rebuild this reaction with deduplicated users
            deduplicatedMap.set(reaction.emoji, {
              emoji: reaction.emoji,
              count: dedupReactedBy.length,
              reacted_by_me: dedupReactedBy.includes(currentUserId),
              reacted_by: dedupReactedBy
            })
          }
        }
      })

      const result = Array.from(deduplicatedMap.values())

      if (result.length !== reactions.length) {
        console.warn('[Message Store] Deduplicating reactions:', {
          before: reactions.length,
          after: result.length,
          userReactionMap: Array.from(userReactionMap.entries())
        })
      }

      return result
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
        console.log('[Message Store] Loading more messages:', {
          channelId: this.currentChannelId,
          nextPage,
          lastPage: this.pagination.last_page
        })

        const response = await readMessages({
          channel_id: this.currentChannelId,
          page: nextPage,
          per_page: 20
        })
        const data = response.data

        // Extract messages from response using same logic as fetchMessages
        let messagesArray: Message[] = []

        if (data.success || data.data) {
          if (data.data?.messages && Array.isArray(data.data.messages)) {
            messagesArray = data.data.messages
          } else if (data.data?.messages?.data && Array.isArray(data.data.messages.data)) {
            messagesArray = data.data.messages.data
          } else if (data.data?.data && Array.isArray(data.data.data)) {
            messagesArray = data.data.data
          } else if (Array.isArray(data.data)) {
            messagesArray = data.data
          } else if (data.data?.result && Array.isArray(data.data.result)) {
            messagesArray = data.data.result
          } else if (data.data?.items && Array.isArray(data.data.items)) {
            messagesArray = data.data.items
          } else if (typeof data.data === 'object' && data.data !== null) {
            const recordData = data.data as Record<string, unknown>
            const arrayKeys = Object.keys(recordData).filter(key => Array.isArray(recordData[key]) && !['links', 'meta', 'pagination'].includes(key))
            const firstArrayKey = arrayKeys[0]
            if (firstArrayKey) {
              messagesArray = recordData[firstArrayKey] as Message[]
            }
          }
        } else if (Array.isArray(data)) {
          messagesArray = data
        }

        if (messagesArray.length === 0) {
          console.log('[Message Store] No messages in response')
          return { success: true }
        }

        // Normalize messages
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

        const normalizedMessages: Message[] = messagesArray
          .filter((m: any) => !m.channel_id || m.channel_id === this.currentChannelId)
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

            return {
              ...m,
              id: m.id || m._id,
              channel_id: m.channel_id || this.currentChannelId,
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
          })

        // Prepend messages to the beginning (oldest first)
        this.messages = [...normalizedMessages, ...this.messages]

        // Update pagination
        const paginationSource = data.data?.messages || data.data
        this.pagination = {
          current_page: paginationSource?.current_page ?? nextPage,
          per_page: paginationSource?.per_page ?? 20,
          total: paginationSource?.total ?? this.pagination.total,
          last_page: paginationSource?.last_page ?? this.pagination.last_page
        }

        console.log('[Message Store] More messages loaded:', {
          newMessagesCount: normalizedMessages.length,
          totalMessages: this.messages.length,
          currentPage: this.pagination.current_page,
          lastPage: this.pagination.last_page,
          hasMore: this.hasMoreMessages
        })

        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load more messages'
        console.error('[Message Store] Error loading more messages:', message)
        return { success: false, error: message }
      } finally {
        this.loadingMore = false
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