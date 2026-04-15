import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import { onUnmounted, ref } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import type { ApiErrorContext } from './useApiErrorHandler'
import { getUserFriendlyError } from './useApiErrorHandler'

const API_BASE = 'http://178.104.58.236/api/auth'

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    // Primary: token header (as per API spec)
    config.headers.token = token
    // Secondary: Authorization header (standard)
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
      const response = await axios.request<T>({
        url: overrideUrl ?? url,
        method: overrideConfig?.method || config?.method || 'GET',
        params: overrideConfig?.params ?? config?.params,
        data: overrideConfig?.data ?? config?.data,
        headers: {
          ...config?.headers,
          ...overrideConfig?.headers
        },
        signal: controller.signal
      })

      data.value = response.data
    } catch (err) {
      const context: ApiErrorContext = { action: 'fetch-data' }
      if (axios.isCancel(err)) {
        error.value = 'Request was cancelled.'
      } else {
        error.value = getUserFriendlyError(err, context)
      }
    } finally {
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

export async function postApi<T = unknown>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  try {
    return await apiClient.post<T>(url, data, config)
  } catch (error) {
    const context: ApiErrorContext = { action: 'post-' + (url.split('/')[0] || 'data') }
    throw new Error(getUserFriendlyError(error, context))
  }
}

export { apiClient }

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}
