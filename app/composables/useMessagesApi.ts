import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useUserStore } from '~/stores/useUserStore'

const MESSAGES_BASE = 'http://178.104.58.236/api/messages'

const messagesApiClient = axios.create({
  baseURL: MESSAGES_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

messagesApiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

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
  sender: MessageSender
  receiver: MessageSender | null
  channel: MessageChannel
  created_at: string
  updated_at: string
  read_by_count: number
  is_read_by_me: boolean
  reactions_summary: ReactionSummary[]
}

export async function createMessage(data: {
  channel_id: string
  message: string
  file?: File
}): Promise<AxiosResponse> {
  try {
    const formData = new FormData()
    formData.append('channel_id', data.channel_id)
    formData.append('message', data.message)
    if (data.file) {
      formData.append('file', data.file)
    }

    const response = await messagesApiClient.post('/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function readMessages(data: {
  channel_id: string
  page?: number
  per_page?: number
}): Promise<AxiosResponse> {
  try {
    const response = await messagesApiClient.get('/read', {
      data: {
        channel_id: data.channel_id,
        page: data.page || 1,
        per_page: data.per_page || 20,
      },
    })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function updateMessage(data: {
  channel_id: string
  message_id: string
  message: string
  file?: File
}): Promise<AxiosResponse> {
  try {
    const formData = new FormData()
    formData.append('channel_id', data.channel_id)
    formData.append('message_id', data.message_id)
    formData.append('message', data.message)
    if (data.file) {
      formData.append('file', data.file)
    }

    const response = await messagesApiClient.patch('/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function deleteMessage(data: {
  channel_id: string
  message_id: string
}): Promise<AxiosResponse> {
  try {
    const response = await messagesApiClient.delete('/delete', {
      data,
    })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function searchMessages(query: string, options?: {
  channel_id?: string
  workspace_id?: string
  per_page?: number
  page?: number
}): Promise<AxiosResponse> {
  try {
    const params = new URLSearchParams()
    params.append('query', query)
    if (options?.channel_id) params.append('channel_id', options.channel_id)
    if (options?.workspace_id) params.append('workspace_id', options.workspace_id)
    if (options?.per_page) params.append('per_page', options.per_page.toString())
    if (options?.page) params.append('page', options.page.toString())

    const response = await messagesApiClient.get(`/search?${params.toString()}`)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function markMessagesAsRead(data: {
  channel_id: string
  message_ids: string[]
}): Promise<AxiosResponse> {
  try {
    const response = await messagesApiClient.post('/read-by', data)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function reactToMessage(data: {
  channel_id: string
  message_ids: string[]
  emoji: string
}): Promise<AxiosResponse> {
  try {
    const response = await messagesApiClient.post('/react', data)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { messagesApiClient }

