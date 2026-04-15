import type { ApiErrorContext } from './useApiErrorHandler.ts'
import { getUserFriendlyError } from './useApiErrorHandler.ts'

/**
 * Centralized error handler for API composables
 * Throws friendly, contextual error message
 */
export function handleApiError(error: unknown, context: ApiErrorContext): never {
  const friendlyMsg = getUserFriendlyError(error, context)
  throw new Error(friendlyMsg)
}
