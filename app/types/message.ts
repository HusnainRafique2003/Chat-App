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
  message?: string
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

export interface MessageReadParams {
  channel_id: string
  page?: number
  per_page?: number
}

export interface CreateMessageParams {
  channel_id: string
  message: string
  file?: File
  schedule_time?: string
}

export interface UpdateMessageParams {
  channel_id: string
  message_id: string
  message: string
  file?: File
}

export interface DeleteMessageParams {
  channel_id: string
  message_id: string
}

export interface MarkMessagesReadParams {
  channel_id: string
  message_ids: string[]
}

export interface ReactToMessageParams {
  channel_id: string
  message_ids: string[]
  emoji: string
  previous_emoji?: string | null
}

export interface SearchMessagesOptions {
  channel_id?: string
  workspace_id?: string
  per_page?: number
  page?: number
}
