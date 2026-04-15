/**
 * Message trimming utilities for chat application
 * Trims only outer blocks of whitespace/newlines while preserving internal formatting
 */

export {
  simpleTrimStartEnd,
  trimHtmlMessageBlock,
  trimMessage,
  trimMessageBlock
} from '~/utils/messageHelpers'
