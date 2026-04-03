/**
 * Centralized API Client Factory
 * Creates and configures Axios instances with consistent interceptors
 */

import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { API_CONFIG } from '~/config/api.config'
import { useUserStore } from '~/stores/useUserStore'

export function createApiClient(baseURL: string, config?: AxiosRequestConfig): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    },
    ...config
  })

  // Add token to all requests
  client.interceptors.request.use((config) => {
    const userStore = useUserStore()
    const token = userStore.token

    if (token) {
      config.headers.token = token
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  // Handle errors consistently
  client.interceptors.response.use(
    response => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message
        return Promise.reject(new Error(message))
      }
      return Promise.reject(error)
    }
  )

  return client
}
