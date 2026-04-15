export {
  createMessageRequest as createMessage,
  deleteMessageRequest as deleteMessage,
  downloadMessageFile,
  markMessagesAsReadRequest as markMessagesAsRead,
  messageApiClient as messagesApiClient,
  reactToMessageRequest as reactToMessage,
  readMessagesRequest as readMessages,
  searchMessagesRequest as searchMessages,
  updateMessageRequest as updateMessage
} from '~/services/messageService'

export { canDeleteMessage, canEditMessage } from '~/utils/messageHelpers'

export type {
  CreateMessageParams,
  DeleteMessageParams,
  MarkMessagesReadParams,
  Message,
  MessageChannel,
  MessageReadParams,
  MessageSender,
  ReactToMessageParams,
  ReactionSummary,
  SearchMessagesOptions,
  UpdateMessageParams
} from '~/types/message'
