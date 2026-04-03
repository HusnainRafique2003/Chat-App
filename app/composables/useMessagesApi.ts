import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'
import { useChannelStore } from '~/stores/useChannelStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'

const MESSAGES_BASE_SINGULAR = 'http://178.104.58.236/api/message'
const MESSAGES_BASE_PLURAL = 'http://178.104.58.236/api/messages'

function makeMessagesClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
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

const messagesApiClient = makeMessagesClient(MESSAGES_BASE_PLURAL)
const messagesApiClientSingular = makeMessagesClient(MESSAGES_BASE_SINGULAR)

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
    const channelStore = useChannelStore()
    const teamStore = useTeamStore()
    const workspaceStore = useWorkspaceStore()
    const selectedChannel = channelStore.channels.find(c => c.id === data.channel_id)

    const payload = {
      channel_id: data.channel_id,
      page: data.page || 1,
      per_page: data.per_page || 20,
      workspace_id: selectedChannel?.workspace_id || workspaceStore.currentWorkspaceId || undefined,
      team_id: selectedChannel?.team_id || teamStore.currentTeamId || undefined,
    }

    // Different deployments expose this endpoint with different
    // base paths/methods. Try all common variants before failing.
    const attempts: Array<() => Promise<AxiosResponse>> = [
      () => messagesApiClient.get('/read', { params: payload }),
      () => messagesApiClient.post('/read', payload),
      () => messagesApiClientSingular.get('/read', { params: payload }),
      () => messagesApiClientSingular.post('/read', payload),
    ]

    let lastErr: unknown
    for (const attempt of attempts) {
      try {
        return await attempt()
      } catch (error) {
        lastErr = error
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status === 404 || status === 405) continue
        }
      }
    }

    throw lastErr
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

export async function downloadMessageFile(path: string): Promise<AxiosResponse<Blob>> {
  try {
    // Backend expects: GET /download?path=workspaces/{workspace_id}/messages/{filename}
    return await messagesApiClient.get('/download', {
      params: { path },
      responseType: 'blob',
      headers: {
        Accept: 'application/octet-stream'
      }
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { messagesApiClient }

