import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

const WORKSPACES_BASE = 'http://178.104.58.236/api/workspaces'

const workspacesApiClient = axios.create({
  baseURL: WORKSPACES_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

workspacesApiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const runtimeConfig = useRuntimeConfig()
  const devToken = runtimeConfig.public?.devApiToken || ''
  const token = userStore.token || devToken

  console.log('Workspace API - Token:', token ? `${token.slice(0, 20)}...` : 'MISSING')
  console.log('Workspace API - User:', userStore.user?.email)

  if (token) {
    // Primary: token header (as per API spec)
    config.headers.token = token
    // Secondary: Authorization header (standard)
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('Workspace API - No token available!')
  }

  return config
})

export async function getWorkspaces(): Promise<AxiosResponse> {
  try {
    const response = await workspacesApiClient.get('/read')
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { workspacesApiClient }

