import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

export function useApi<T = unknown>(url: string, config?: AxiosRequestConfig) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  // The AbortController — one per request
  let controller: AbortController | null = null

  async function fetch(overrideUrl?: string, overrideConfig?: AxiosRequestConfig) {
    // Cancel any in-flight request before starting a new one
    abort()

    controller = new AbortController()
    loading.value = true
    error.value = null
    data.value = null

    try {
      const response = await axios.get<T>(overrideUrl ?? url, {
        ...config,
        ...overrideConfig,
        signal: controller.signal,  // ← AbortController wired in here
      })
      data.value = response.data
    }
    catch (err) {
      if (axios.isCancel(err)) {
        error.value = 'Request was cancelled.'
      }
      else if (axios.isAxiosError(err)) {
        error.value = err.response?.data?.message ?? err.message ?? 'Request failed.'
      }
      else {
        error.value = 'An unexpected error occurred.'
      }
    }
    finally {
      loading.value = false
    }
  }

  function abort() {
    if (controller) {
      controller.abort()
      controller = null
    }
  }

  // Auto-abort if the component using this unmounts mid-request
  onUnmounted(() => abort())

  return { data, error, loading, fetch, abort }
}