import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { ref, onUnmounted } from 'vue'

const API_BASE = 'http://178.104.58.236/api/auth'

// Global axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (process.client) {
    const userStore = useUserStore()
    const token = userStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      config.headers.token = token
    }
  }
  return config
})

export function useApi<T = unknown>(url: string, config?: AxiosRequestConfig) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  let controller: AbortController | null = null

  async function fetch(overrideUrl?: string, overrideConfig?: AxiosRequestConfig) {
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
      const response = await axios.get<T>(overrideUrl ?? url, {
        ...config,
        ...overrideConfig,
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

export async function postApi<T = unknown>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    const response = await apiClient.post<T>(url, data, config)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : error.message
      throw new Error(message || 'Request failed')
    }
    throw error
  }
}

// Export client for stores
export { apiClient }

// Types
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}
