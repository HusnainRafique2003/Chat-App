import type { ApiPagination } from '~/types/api'
import type { Message } from '~/types/message'
import { looksLikeUserId, normalizeDateValue, simpleTrimStartEnd } from '~/utils/messageHelpers'

interface WorkspaceMemberLike {
  id?: string
  _id?: string
  user_id?: string
  name?: string
  user?: {
    name?: string
  } | null
}

type UnknownRecord = Record<string, unknown>
type RawMessage = Partial<Message> & UnknownRecord

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? value as UnknownRecord : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function createUserNameMap(workspaceMembers: WorkspaceMemberLike[] = []) {
  const userNameMap = new Map<string, string>()

  workspaceMembers.forEach((member) => {
    const ids = [member?.id, member?._id, member?.user_id].filter((id): id is string => Boolean(id))
    const name = member?.name || member?.user?.name

    if (name) {
      ids.forEach(id => userNameMap.set(id, name))
    }
  })

  return userNameMap
}

export function extractMessagesFromPayload(payload: unknown): RawMessage[] {
  if (!payload) return []

  if (Array.isArray(payload)) return payload

  const payloadRecord = asRecord(payload)
  const data = payloadRecord.data ?? payload
  if (Array.isArray(data)) return data
  const dataRecord = asRecord(data)

  const candidates = [
    dataRecord.messages,
    asRecord(dataRecord.messages).data,
    dataRecord.data,
    dataRecord.result,
    dataRecord.items,
    dataRecord._data,
    payloadRecord.messages,
    payloadRecord.response
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  if (typeof data === 'object' && data !== null) {
    const recordData = data as Record<string, unknown>
    const arrayKeys = Object.keys(recordData).filter(key => Array.isArray(recordData[key]) && !['links', 'meta', 'pagination'].includes(key))
    if (arrayKeys[0]) {
      return recordData[arrayKeys[0]] as RawMessage[]
    }
  }

  return []
}

export function extractPagination(payload: unknown, fallbackPage = 1, fallbackTotal = 0): ApiPagination {
  const payloadRecord = asRecord(payload)
  const payloadData = asRecord(payloadRecord.data)
  const payloadMessages = asRecord(payloadData.messages)
  const paginationSource = payloadMessages.current_page ? payloadMessages : payloadData

  return {
    current_page: Number(paginationSource.current_page ?? fallbackPage),
    per_page: Number(paginationSource.per_page ?? 20),
    total: Number(paginationSource.total ?? fallbackTotal),
    last_page: Number(paginationSource.last_page ?? 1)
  }
}

export function normalizeMessage(
  rawMessage: RawMessage,
  options: {
    channelId: string
    currentUserId?: string
    currentUserName?: string
    userNameMap?: Map<string, string>
    fallbackContent?: string
    forceReadByMe?: boolean
    defaultStatus?: string
  }
): Message {
  const senderRecord = asRecord(rawMessage.sender)
  const senderId = asString(senderRecord.id) || asString(senderRecord._id) || asString(rawMessage.sender_id)
  const backendSenderName = asString(senderRecord.name)
  let senderName = backendSenderName

  if ((!senderName || looksLikeUserId(senderName)) && senderId === options.currentUserId) {
    senderName = options.currentUserName || 'You'
  } else if (!senderName || looksLikeUserId(senderName)) {
    senderName = options.userNameMap?.get(senderId) || senderName
  }

  return {
    ...rawMessage,
    id: rawMessage.id || rawMessage._id || '',
    channel_id: rawMessage.channel_id || options.channelId,
    workspace_id: rawMessage.workspace_id || '',
    sender_id: rawMessage.sender_id || senderId,
    receiver_id: rawMessage.receiver_id ?? null,
    message_type: rawMessage.message_type || 'text',
    content: simpleTrimStartEnd(
      asString(rawMessage.content)
      || asString(rawMessage.message)
      || asString(rawMessage.text)
      || asString(rawMessage.body)
      || options.fallbackContent
      || ''
    ),
    file_path: rawMessage.file_path ?? null,
    file_name: rawMessage.file_name ?? null,
    file_mime: rawMessage.file_mime ?? null,
    file_download_url: rawMessage.file_download_url ?? null,
    schedule_time: normalizeDateValue(rawMessage.schedule_time),
    status: rawMessage.status || options.defaultStatus || 'sent',
    sender: {
      ...(rawMessage.sender || {}),
      id: senderId,
      name: senderName || 'Unknown',
      email: asString(senderRecord.email),
      is_active: typeof senderRecord.is_active === 'boolean' ? senderRecord.is_active : true
    },
    receiver: rawMessage.receiver || null,
    channel: rawMessage.channel || { id: options.channelId, name: '' },
    created_at: rawMessage.created_at || new Date().toISOString(),
    updated_at: rawMessage.updated_at || rawMessage.created_at || new Date().toISOString(),
    read_by_count: rawMessage.read_by_count ?? 0,
    is_read_by_me: options.forceReadByMe ?? rawMessage.is_read_by_me ?? false,
    reactions_summary: rawMessage.reactions_summary || [],
    is_local_only: rawMessage.is_local_only ?? false
  }
}

export function normalizeMessages(
  messages: RawMessage[],
  options: {
    channelId: string
    currentUserId?: string
    currentUserName?: string
    workspaceMembers?: WorkspaceMemberLike[]
  }
): Message[] {
  const userNameMap = createUserNameMap(options.workspaceMembers)

  return messages
    .filter(message => !message.channel_id || message.channel_id === options.channelId)
    .map(message => normalizeMessage(message, {
      channelId: options.channelId,
      currentUserId: options.currentUserId,
      currentUserName: options.currentUserName,
      userNameMap
    }))
}

export function mergeMessages(existingMessages: Message[], incomingMessages: Message[], silent = false): Message[] {
  if (!silent || existingMessages.length === 0) {
    return incomingMessages
  }

  const mergedMessages = [...existingMessages]
  const existingIds = new Set(existingMessages.map(message => message.id))

  incomingMessages.forEach((incomingMessage) => {
    const existingIndex = mergedMessages.findIndex(message => message.id === incomingMessage.id)
    if (existingIndex >= 0) {
      mergedMessages[existingIndex] = incomingMessage
      return
    }

    if (!existingIds.has(incomingMessage.id)) {
      mergedMessages.push(incomingMessage)
    }
  })

  return mergedMessages
}
