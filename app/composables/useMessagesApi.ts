import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import { useUserStore } from '~/stores/useUserStore'

const MESSAGES_BASE = 'http://178.104.58.236/api/messages'

export interface MessageSenderSummary {
  id: string
  name: string
  email?: string
  is_active?: boolean
  access_token?: string | null
  updated_at?: string
  created_at?: string
}

export interface MessageChannelSummary {
  id: string
  name: string
  type?: string
}

export interface MessageReactionSummary {
  emoji: string
  count: number
  reacted_by_me: boolean
  reacted_by: string[]
}

export interface ChatMessage {
  id: string
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
  sender: MessageSenderSummary
  receiver: MessageSenderSummary | null
  channel: MessageChannelSummary | null
  created_at: string
  updated_at: string
  read_by_count: number
  is_read_by_me: boolean
  reactions_summary: MessageReactionSummary[]
  has_file?: boolean
}

export interface MessagePagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface MessagesApiEnvelope<T> {
  success: boolean
  message: string
  errors?: Record<string, string[]> | null
  data: T
}

const messagesApiClient = axios.create({
  baseURL: MESSAGES_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

messagesApiClient.interceptors.request.use((config) => {
  if (process.client) {
    const userStore = useUserStore()
    const token = userStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      config.headers.token = token
    }
  }

  return config
})

function extractError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message = typeof error.response?.data?.message === 'string'
      ? error.response.data.message
      : error.message
    throw new Error(message || 'Request failed')
  }

  throw error
}

function buildMessageFormData(data: {
  channel_id: string
  message?: string
  message_id?: string
  file?: File | null
}) {
  const formData = new FormData()
  formData.append('channel_id', data.channel_id)

  if (data.message_id) {
    formData.append('message_id', data.message_id)
  }

  if (typeof data.message === 'string') {
    formData.append('message', data.message)
  }

  if (data.file) {
    formData.append('file', data.file)
  }

  return formData
}

export async function readMessages(params: {
  channel_id: string
  page?: number
  per_page?: number
}) {
  try {
    return await messagesApiClient.get<MessagesApiEnvelope<{ messages: ChatMessage[]; pagination: MessagePagination }>>('/read', {
      params
    })
  } catch (error) {
    return extractError(error)
  }
}

export async function createMessage(payload: {
  channel_id: string
  message: string
  file?: File | null
}) {
  const hasFile = Boolean(payload.file)
  const data = hasFile
    ? buildMessageFormData(payload)
    : payload

  const config: AxiosRequestConfig | undefined = hasFile
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined

  try {
    return await messagesApiClient.post<MessagesApiEnvelope<{ message: ChatMessage }>>('/create', data, config)
  } catch (error) {
    return extractError(error)
  }
}

export async function updateMessage(payload: {
  channel_id: string
  message_id: string
  message: string
  file?: File | null
}) {
  const hasFile = Boolean(payload.file)
  const data = hasFile
    ? buildMessageFormData(payload)
    : payload

  const config: AxiosRequestConfig | undefined = hasFile
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined

  try {
    return await messagesApiClient.patch<MessagesApiEnvelope<{ message: ChatMessage }>>('/update', data, config)
  } catch (error) {
    return extractError(error)
  }
}

export async function deleteMessage(payload: {
  channel_id: string
  message_id: string
}) {
  try {
    return await messagesApiClient.delete<MessagesApiEnvelope<null>>('/delete', {
      data: payload
    })
  } catch (error) {
    return extractError(error)
  }
}

export async function searchMessages(params: {
  query: string
  channel_id?: string
  workspace_id?: string
  page?: number
  per_page?: number
}) {
  try {
    return await messagesApiClient.get<MessagesApiEnvelope<ChatMessage[]>>('/search', {
      params
    })
  } catch (error) {
    return extractError(error)
  }
}

export async function markMessagesAsRead(payload: {
  channel_id: string
  message_ids: string[]
}) {
  try {
    return await messagesApiClient.post<MessagesApiEnvelope<{ updated: number }>>('/read-by', payload)
  } catch (error) {
    return extractError(error)
  }
}

export async function reactToMessage(payload: {
  channel_id: string
  message_ids: string[]
  emoji: string
}) {
  try {
    return await messagesApiClient.post<MessagesApiEnvelope<{ message: ChatMessage }>>('/react', payload)
  } catch (error) {
    return extractError(error)
  }
}

export function getMessageDownloadUrl(path: string) {
  const encodedPath = encodeURIComponent(path)
  return `${MESSAGES_BASE}/download?path=${encodedPath}`
}

export async function downloadMessageFile(path: string) {
  try {
    return await messagesApiClient.get<Blob>(`/download?path=${encodeURIComponent(path)}`, {
      responseType: 'blob'
    })
  } catch (error) {
    return extractError(error)
  }
}

export { messagesApiClient }
