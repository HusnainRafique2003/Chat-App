import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// Auth base URL
const API_BASE = 'http://178.104.58.236/api/auth'

// Global axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = useUserStore().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

  onUnmounted(() => abort())

  return { data, error, loading, fetch, abort }
}

// New POST function for auth APIs
export async function postApi<T = unknown>(url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    const response = await apiClient.post<T>(url, data, config)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

// Export client for stores
export { apiClient }

// Types
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

