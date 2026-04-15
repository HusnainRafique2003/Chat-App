import type { UseToastOptions } from '@nuxt/ui'
import { useToast } from '@nuxt/ui'

export interface ToastContext {
  action: string
  entityId?: string
  channelId?: string
}

export function useAppToast() {
  const toast = useToast()

  /**
   * Generate unique toast ID for deduplication
   */
  function generateToastId(context: ToastContext): string {
    const { action, entityId, channelId } = context
    const parts = [action]
    if (entityId) parts.push(entityId.slice(-8)) // Short ID
    if (channelId) parts.push(channelId.slice(-8))
    return `toast-${parts.join('-')}`
  }

  /**
   * Show success toast (selective - avoid spam)
   */
  function showSuccess(message: string, context: ToastContext, options: Partial<UseToastOptions> = {}) {
    const id = generateToastId(context)

    // Common success suppression:
    const suppressMessages = [
      'ok',
      'success',
      'Operation completed',
      'Request successful'
    ]

    const shouldShow = !suppressMessages.some(suppress =>
      message.toLowerCase().includes(suppress)
    )

    if (shouldShow) {
      toast.add({
        title: message,
        color: 'green',
        icon: 'i-heroicons-check-circle',
        timeout: 3000,
        id,
        ...options
      })
    }
  }

  /**
   * Show error toast (ALWAYS show)
   */
  function showError(message: string, context: ToastContext, options: Partial<UseToastOptions> = {}) {
    const id = generateToastId(context)
    toast.add({
      title: message,
      color: 'red',
      icon: 'i-heroicons-x-circle',
      timeout: 5000,
      id,
      ...options
    })
  }

  /**
   * Show warning (validation, retries, etc.)
   */
  function showWarning(message: string, context: ToastContext, options: Partial<UseToastOptions> = {}) {
    const id = generateToastId(context)
    toast.add({
      title: message,
      color: 'orange',
      icon: 'i-heroicons-exclamation-triangle',
      timeout: 4000,
      id,
      ...options
    })
  }

  /**
   * Show info
   */
  function showInfo(message: string, context: ToastContext, options: Partial<UseToastOptions> = {}) {
    const id = generateToastId(context)
    toast.add({
      title: message,
      color: 'blue',
      icon: 'i-heroicons-information-circle',
      timeout: 3000,
      id,
      ...options
    })
  }

  /**
   * Dismiss specific toast by context
   */
  function dismissToast(context: ToastContext) {
    const id = generateToastId(context)
    toast.dismiss(id)
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast
  }
}
