import type { AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import { onUnmounted, ref } from 'vue'
import { apiService } from '~/api/apiService'
import { getApiClient } from '~/api/client'

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
      const response = await apiService<T>({
        url: overrideUrl ?? url,
        method: (overrideConfig?.method || config?.method || 'GET') as Method,
        params: overrideConfig?.params ?? config?.params,
        data: overrideConfig?.data ?? config?.data,
        headers: {
          ...((config?.headers as Record<string, string>) || {}),
          ...((overrideConfig?.headers as Record<string, string>) || {})
        },
        signal: controller.signal,
        dedupe: false
      })

      data.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Request failed.'
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
  const response = await apiService<T>({
    url: url.startsWith('/auth') ? url : `/auth${url}`,
    method: 'POST',
    data,
    headers: config?.headers as Record<string, string> | undefined,
    dedupe: false
  })

  return response.raw
}

export const apiClient = getApiClient()

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}
