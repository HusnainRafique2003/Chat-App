import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

let apiClientInstance: AxiosInstance | null = null

export function getApiBaseUrl() {
  const runtimeConfig = useRuntimeConfig()
  return runtimeConfig.public.apiBaseUrl || 'http://178.104.58.236/api'
}

export function getApiClient() {
  if (apiClientInstance) {
    return apiClientInstance
  }

  apiClientInstance = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  apiClientInstance.interceptors.request.use((config) => {
    const userStore = useUserStore()
    const runtimeConfig = useRuntimeConfig()
    const devToken = runtimeConfig.public?.devApiToken || ''
    const token = userStore.token || devToken

    if (token) {
      config.headers.token = token
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  return apiClientInstance
}
