import type { AxiosError } from 'axios'
import axios from 'axios'

export interface ApiErrorContext {
  action: string // 'create-message', 'fetch-workspace'
  entity?: string // 'channel', 'workspace', 'file'
}

/**
 * Convert raw API errors to user-friendly messages
 * COVERS ALL SPECIFIED CASES
 */
export function getUserFriendlyError(
  error: unknown,
  context: ApiErrorContext
): string {
  // Non-Axios errors
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again later.'
  }

  const axiosError = error as AxiosError
  const status = axiosError.response?.status
  const backendMsg = axiosError.response?.data?.message as string
  const backendErrors = axiosError.response?.data?.errors
  const code = axiosError.code

  // 1. AUTH ERRORS
  if (status === 401) {
    return 'Session expired. Please login again.'
  }
  if (status === 419) { // CSRF
    return 'Session expired. Please refresh and try again.'
  }

  // 2. AUTHORIZATION
  if (status === 403) {
    if (backendMsg?.includes('member') || backendMsg?.includes('permission')) {
      return context.entity === 'channel'
        ? 'You are not a member of this channel.'
        : 'You don\'t have permission to perform this action.'
    }
    return 'You don\'t have access to this resource.'
  }

  // 3. NOT FOUND
  if (status === 404) {
    return `${context.entity ?? 'This'} ${context.action.includes('fetch') ? 'no longer exists' : 'not found'}.`
  }

  // 4. VALIDATION ERRORS
  if (backendErrors) {
    // File validation (PRIORITY)
    if (backendErrors.file) {
      const fileMsg = Array.isArray(backendErrors.file) ? backendErrors.file[0] : backendErrors.file
      return fileMsg.includes('type')
        ? 'Unsupported file format. Please use JPG, PNG, PDF, ZIP, or MP4.'
        : `File error: ${fileMsg}`
    }

    // Name/description too short
    if (backendErrors.name?.[0]?.includes('minimum')) {
      return 'Name must be at least 3 characters.'
    }

    // Generic validation
    const firstError = Object.values(backendErrors)[0]
    return Array.isArray(firstError) ? firstError[0] : 'Please enter valid data.'
  }

  // 5. NETWORK ERRORS
  if (code === 'ECONNABORTED') {
    return 'Request timed out. Please check your connection and try again.'
  }
  if (['ENOTFOUND', 'NETWORK-ERROR', 'ECONNREFUSED'].includes(code || '')) {
    return 'Network error. Please check your internet connection.'
  }

  // 6. SERVER ERRORS
  if (status >= 500) {
    return 'Server error occurred. Please try again in a moment.'
  }

  // 7. DUPLICATES
  if (backendMsg?.includes('already exists') || backendMsg?.includes('duplicate')) {
    return 'This action was already performed.'
  }

  // 8. SPECIFIC CHANNEL/MESSAGE
  if (backendMsg?.includes('no longer a member')) {
    return 'This conversation is no longer available.'
  }
  if (backendMsg?.includes('join the channel')) {
    return 'Join the channel to view messages.'
  }

  // 9. FALLBACK: Clean backend message or generic
  const cleanBackendMsg = backendMsg
    ?.replace(/The selected \w+ is invalid/, 'Invalid selection.')
    ?.replace(/validation failed/, 'Please check your input.')
    || axiosError.message

  return cleanBackendMsg.includes('axios') || cleanBackendMsg.includes('ERR_')
    ? 'Request failed. Please try again.'
    : cleanBackendMsg
}

/**
 * Quick check if error is "retryable" (network/server)
 */
export function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  return ['ECONNABORTED', 'ENOTFOUND'].includes(error.code || '') || error.response?.status >= 500
}
