import type { AxiosResponse } from 'axios'
import { apiService } from '~/api/apiService'
import { getApiClient } from '~/api/client'
import type {
  CreateMessageParams,
  DeleteMessageParams,
  MarkMessagesReadParams,
  Message,
  MessageReadParams,
  ReactToMessageParams,
  SearchMessagesOptions,
  UpdateMessageParams
} from '~/types/message'
import { simpleTrimStartEnd } from '~/utils/messageHelpers'

export async function createMessageRequest(data: CreateMessageParams) {
  const trimmedMessage = simpleTrimStartEnd(data.message)

  if (data.file) {
    const formData = new FormData()
    formData.append('channel_id', data.channel_id)
    formData.append('message', trimmedMessage)
    formData.append('file', data.file)

    if (data.schedule_time) {
      formData.append('schedule_time', data.schedule_time)
    }

    return await apiService({
      url: '/messages/create',
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      required: ['channel_id'],
      dedupe: false
    })
  }

  return await apiService({
    url: '/messages/create',
    method: 'POST',
    data: {
      channel_id: data.channel_id,
      message: trimmedMessage,
      schedule_time: data.schedule_time
    },
    required: ['channel_id'],
    dedupe: false
  })
}

export async function readMessagesRequest(data: MessageReadParams) {
  return await apiService({
    url: '/messages/read',
    method: 'GET',
    params: {
      channel_id: data.channel_id.trim(),
      page: data.page || 1,
      per_page: data.per_page || 20
    },
    required: ['channel_id'],
    dedupeKey: `messages:${data.channel_id}:${data.page || 1}:${data.per_page || 20}`
  })
}

export async function updateMessageRequest(data: UpdateMessageParams) {
  const trimmedMessage = simpleTrimStartEnd(data.message)

  if (data.file) {
    const formData = new FormData()
    formData.append('channel_id', data.channel_id)
    formData.append('message_id', data.message_id)
    formData.append('message', trimmedMessage)
    formData.append('file', data.file)

    return await apiService({
      url: '/messages/update',
      method: 'PATCH',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      required: ['channel_id', 'message_id'],
      dedupe: false
    })
  }

  return await apiService({
    url: '/messages/update',
    method: 'PATCH',
    data: {
      channel_id: data.channel_id,
      message_id: data.message_id,
      message: trimmedMessage
    },
    required: ['channel_id', 'message_id'],
    dedupe: false
  })
}

export async function deleteMessageRequest(data: DeleteMessageParams) {
  return await apiService({
    url: '/messages/delete',
    method: 'DELETE',
    data,
    required: ['channel_id', 'message_id'],
    dedupe: false
  })
}

export async function searchMessagesRequest(query: string, options?: SearchMessagesOptions) {
  const params: Record<string, string> = { query }

  if (options?.channel_id) params.channel_id = options.channel_id
  if (options?.workspace_id) params.workspace_id = options.workspace_id
  if (options?.per_page) params.per_page = options.per_page.toString()
  if (options?.page) params.page = options.page.toString()

  return await apiService({
    url: '/messages/search',
    method: 'GET',
    params,
    required: ['query'],
    dedupeKey: `messages:search:${query}:${options?.channel_id || ''}:${options?.workspace_id || ''}:${options?.page || 1}`
  })
}

export async function markMessagesAsReadRequest(data: MarkMessagesReadParams) {
  return await apiService({
    url: '/messages/read-by',
    method: 'POST',
    data,
    required: ['channel_id'],
    dedupe: false
  })
}

export async function reactToMessageRequest(data: ReactToMessageParams) {
  return await apiService({
    url: '/messages/react',
    method: 'POST',
    data,
    required: ['channel_id', 'emoji'],
    dedupe: false
  })
}

export async function downloadMessageFile(fileIdOrPath: string): Promise<AxiosResponse<Blob>> {
  if (/^[a-f0-9]{24}$/i.test(fileIdOrPath)) {
    return (await apiService<Blob>({
      url: `/files/${fileIdOrPath}/download`,
      method: 'GET',
      responseType: 'blob',
      headers: { Accept: 'application/octet-stream' },
      dedupe: false
    })).raw
  }

  return (await apiService<Blob>({
    url: '/messages/download',
    method: 'GET',
    params: { path: fileIdOrPath },
    responseType: 'blob',
    headers: { Accept: 'application/octet-stream' },
    dedupe: false
  })).raw
}

export function createOptimisticMessage(input: {
  channelId: string
  content: string
  currentUserId: string
  currentUserName: string
  currentUserEmail: string
  scheduleTime?: string | null
}): Message {
  const timestamp = new Date().toISOString()
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

  return {
    id: tempId,
    _id: tempId,
    workspace_id: '',
    sender_id: input.currentUserId,
    receiver_id: null,
    channel_id: input.channelId,
    message_type: 'text',
    content: input.content,
    message: input.content,
    file_path: null,
    file_name: null,
    file_mime: null,
    file_download_url: null,
    schedule_time: input.scheduleTime || null,
    status: 'sent',
    sender: {
      id: input.currentUserId,
      name: input.currentUserName,
      email: input.currentUserEmail,
      is_active: true
    },
    receiver: null,
    channel: { id: input.channelId, name: '' },
    created_at: timestamp,
    updated_at: timestamp,
    read_by_count: 0,
    is_read_by_me: true,
    reactions_summary: []
  }
}

export const messageApiClient = getApiClient()
