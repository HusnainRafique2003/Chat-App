import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { ref, onUnmounted } from 'vue'

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
      // ✅ Use axios.request to support POST, PUT, DELETE and request bodies
      // Inside useApi.ts fetch function
const response = await axios.request<T>({
  url: overrideUrl ?? url,
  method: overrideConfig?.method || config?.method || 'GET',
  params: overrideConfig?.params || config?.params, // <-- ADD THIS LINE
  data: overrideConfig?.data || config?.data,
  headers: {
    ...config?.headers,
    ...overrideConfig?.headers
  },
  signal: controller.signal,
})
      data.value = response.data
    }
    catch (err) {
      if (axios.isCancel(err)) {
        error.value = 'Request was cancelled.'
      }
      else if (axios.isAxiosError(err)) {
        // Correctly handle backend error messages [cite: 199]
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

  // Auto-abort if the component using this unmounts mid-request [cite: 200]
  onUnmounted(() => abort())

  return { data, error, loading, fetch, abort }
}