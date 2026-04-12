import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

const API_BASE = 'http://178.104.58.236/api/messages'

function makeApiClient() {
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const userStore = useUserStore()
    const runtimeConfig = useRuntimeConfig()
    const devToken = runtimeConfig.public?.devApiToken || ''
    const token = userStore.token || devToken

    console.log('[Messages API Interceptor]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? token.slice(0, 15) + '...' : 'NO TOKEN',
      source: userStore.token ? 'userStore' : devToken ? 'devToken' : 'none',
    })

    if (token) {
      config.headers.token = token
      config.headers.Authorization = `Bearer ${token}`
      console.log('[Messages API] Token headers set for:', config.url)
    } else {
      console.warn('[Messages API] NO TOKEN AVAILABLE - request will likely fail')
    }

    return config
  })

  return client
}

const apiClient = makeApiClient()

// Separate client for files endpoint (at /api/files, not /api/messages/files)
const API_FILES_BASE = 'http://178.104.58.236/api'

function makeFileClient() {
  const client = axios.create({
    baseURL: API_FILES_BASE,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
    const userStore = useUserStore()
    const runtimeConfig = useRuntimeConfig()
    const devToken = runtimeConfig.public?.devApiToken || ''
    const token = userStore.token || devToken

    if (token) {
      config.headers.token = token
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  return client
}

const fileClient = makeFileClient()

export interface MessageSender {
  id: string
  name: string
  email: string
  is_active: boolean
}

export interface MessageChannel {
  id: string
  name: string
}

export interface ReactionSummary {
  emoji: string
  count: number
  reacted_by_me: boolean
  reacted_by: string[]
}

export interface Message {
  id: string
  _id?: string
  workspace_id: string
  sender_id: string
  receiver_id: string | null
  channel_id: string
  message_type: string
  content: string
  file_path: string | null
  file_name: string | null
  file_mime: string | null
  file_download_url: string | null
  schedule_time?: string | null
  status?: string
  sender: MessageSender
  receiver: MessageSender | null
  channel: MessageChannel
  created_at: string
  updated_at: string
  read_by_count: number
  is_read_by_me: boolean
  reactions_summary: ReactionSummary[]
  is_local_only?: boolean
}

/**
 * Create a message in a channel.
 * POST /messages/create
 * 
 * @param data - Message data with channel_id, message content, and optional file
 * @returns Created message response
 */
export async function createMessage(data: {
  channel_id: string
  message: string
  file?: File
  schedule_time?: string
}): Promise<AxiosResponse> {
  try {
    console.log('[Messages API] Creating message:', {
      channel_id: data.channel_id,
      hasFile: !!data.file,
      schedule_time: data.schedule_time || null
    })

    // File upload uses multipart/form-data
    if (data.file) {
      const formData = new FormData()
      formData.append('channel_id', data.channel_id)
      formData.append('message', data.message.trim())
      formData.append('file', data.file)
      if (data.schedule_time) {
        formData.append('schedule_time', data.schedule_time)
      }

      const response = await apiClient.post('/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      console.log('[Messages API] Message with file created successfully')
      return response
    }

    // Text-only message
    const response = await apiClient.post('/create', {
channel_id: data.channel_id,
      message: data.message.trim(),
      schedule_time: data.schedule_time,
    })

    console.log('[Messages API] Text message created successfully')
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorDetails = error.response?.data?.errors
      const fileError = Array.isArray(errorDetails?.file) ? errorDetails.file[0] : ''
      const detailedMessage = fileError || error.response?.data?.message || error.message

      console.error('[Messages API] Failed to create message:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        errors: errorDetails,
      })
      throw new Error(detailedMessage)
    }
    throw error
  }
}

/**
 * Read messages for a channel.
 * GET /messages/read - Query params: channel_id, page, per_page
 * 
 * API Documentation:
 * Endpoint: GET /read
 * Headers: { Content-Type: application/json, token: {login_token} }
 * Success Response: { success: true, message: "...", data: { messages: [...], pagination: {...} } }
 * 
 * @param data - Query parameters with channel_id, page, and per_page
 * @returns Messages array with pagination metadata
 */
export async function readMessages(data: {
  channel_id: string
  page?: number
  per_page?: number
}): Promise<AxiosResponse> {
  try {
    // Validate channel_id
    if (!data.channel_id || data.channel_id.trim() === '') {
      throw new Error('channel_id is required')
    }

    const params: Record<string, any> = {
      channel_id: data.channel_id.trim(),
      page: data.page || 1,
      per_page: data.per_page || 20,
    }

    console.log('[Messages API] Full request details:', {
      baseURL: apiClient.defaults.baseURL,
      endpoint: '/read',
      fullURL: apiClient.defaults.baseURL + '/read',
      params: params,
      queryString: new URLSearchParams(params).toString()
    })

    const response = await apiClient.get('/read', { params })

    console.log('[Messages API] Raw response status:', response.status)
    console.log('[Messages API] Full response object:', response.data)
    console.log('[Messages API] Messages retrieved:', {
      status: response.status,
      messageCount: response.data?.data?.messages?.length || 0,
      channelId: data.channel_id,
      hasPagination: !!response.data?.data?.pagination,
    })

    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Messages API] Failed to read messages:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        url: error.config?.url,
        params: error.config?.params,
        channelId: data.channel_id,
      })
      throw new Error(error.response?.data?.message || error.message)
    }
    console.error('[Messages API] Non-axios error:', error)
    throw error
  }
}

/**
 * Update a message.
 * PATCH /messages/update
 * 
 * @param data - Update data with channel_id, message_id, updated content, and optional file
 * @returns Updated message response
 */
export async function updateMessage(data: {
  channel_id: string
  message_id: string
  message: string
  file?: File
}): Promise<AxiosResponse> {
  try {
    console.log('[Messages API] Updating message:', {
      channel_id: data.channel_id,
      message_id: data.message_id,
      hasFile: !!data.file,
    })

    // File upload uses multipart/form-data and POST with _method=PATCH for form-data fallback
    if (data.file) {
      const formData = new FormData()
      formData.append('channel_id', data.channel_id)
      formData.append('message_id', data.message_id)
      formData.append('message', data.message.trim())
      formData.append('file', data.file)

      const response = await apiClient.patch('/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      console.log('[Messages API] Message with file updated successfully')
      return response
    }

    // Text-only update
      const response = await apiClient.patch('/update', {
        channel_id: data.channel_id,
        message_id: data.message_id,
        message: data.message.trim(),
    })

    console.log('[Messages API] Text message updated successfully')
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Messages API] Failed to update message:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        messageId: data.message_id,
      })
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Delete a message.
 * DELETE /messages/delete
 * 
 * @param data - Delete data with channel_id and message_id
 * @returns Success response
 */
export async function deleteMessage(data: {
  channel_id: string
  message_id: string
}): Promise<AxiosResponse> {
  try {
    console.log('[Messages API] Deleting message:', {
      channel_id: data.channel_id,
      message_id: data.message_id,
    })

    const response = await apiClient.delete('/delete', { data })

    console.log('[Messages API] Message deleted successfully')
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Messages API] Failed to delete message:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        messageId: data.message_id,
      })
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Search messages.
 */
export async function searchMessages(query: string, options?: {
  channel_id?: string
  workspace_id?: string
  per_page?: number
  page?: number
}): Promise<AxiosResponse> {
  try {
    const params: Record<string, string> = { query }
    if (options?.channel_id) params.channel_id = options.channel_id
    if (options?.workspace_id) params.workspace_id = options.workspace_id
    if (options?.per_page) params.per_page = options.per_page.toString()
    if (options?.page) params.page = options.page.toString()

    return await apiClient.get('/search', { params })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Mark messages as read.
 * POST /api/messages/read-by  (from Postman "Read By")
 */
export async function markMessagesAsRead(data: {
  channel_id: string
  message_ids: string[]
}): Promise<AxiosResponse> {
  try {
    return await apiClient.post('/read-by', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * React to a message with an emoji.
 * POST /api/messages/react  (from Postman "Emoji React")
 */
/**
 * React to a message with emoji (WhatsApp-like behavior).
 * POST /messages/react
 * 
 * Implements WhatsApp-like reaction logic:
 * - User can only have ONE active reaction per message
 * - Reacting with different emoji replaces the previous one
 * - Reacting with the SAME emoji removes the reaction (toggle)
 * 
 * @param data - Reaction data including channel, messages, emoji, and optional previous emoji
 * @returns Updated message with new reaction state
 */
export async function reactToMessage(data: {
  channel_id: string
  message_ids: string[]
  emoji: string
  previous_emoji?: string | null  // The user's current reaction emoji (if any)
}): Promise<AxiosResponse> {
  try {
    console.log('[Messages API] Reacting to message:', {
      channel_id: data.channel_id,
      message_ids: data.message_ids,
      emoji: data.emoji,
      previous_emoji: data.previous_emoji,
      isToggle: data.emoji === data.previous_emoji,
      isReplace: data.previous_emoji && data.emoji !== data.previous_emoji
    })

    return await apiClient.post('/react', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Download a file attachment.
 * GET /api/files/{file_id}/download  (from Postman "Download File")
 */
export async function downloadMessageFile(fileIdOrPath: string): Promise<AxiosResponse<Blob>> {
  try {
    if (/^[a-f0-9]{24}$/i.test(fileIdOrPath)) {
      return await fileClient.get(`/files/${fileIdOrPath}/download`, {
        responseType: 'blob',
        headers: { Accept: 'application/octet-stream' }
      })
    }

    return await fileClient.get('/messages/download', {
      params: { path: fileIdOrPath },
      responseType: 'blob',
      headers: { Accept: 'application/octet-stream' }
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { apiClient as messagesApiClient }

/**
 * Check if the current user can edit a message.
 * Only the message sender can edit it.
 * 
 * @param message - The message to check
 * @param currentUserId - The current user's ID
 * @returns True if user owns the message
 */
export function canEditMessage(message: Message, currentUserId: string): boolean {
  return message.sender_id === currentUserId
}

/**
 * Check if the current user can delete a message.
 * Only the message sender can delete it.
 * 
 * @param message - The message to check
 * @param currentUserId - The current user's ID
 * @returns True if user owns the message
 */
export function canDeleteMessage(message: Message, currentUserId: string): boolean {
  return message.sender_id === currentUserId
}
