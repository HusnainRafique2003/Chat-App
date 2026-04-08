import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

const WORKSPACES_BASE = 'http://178.104.58.236/api/workspaces'

const workspacesApiClient = axios.create({
  baseURL: WORKSPACES_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

workspacesApiClient.interceptors.request.use((config) => {
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

/**
 * Get all workspaces for the current user.
 * GET /api/workspaces/read  (confirmed via backend probe)
 */
export async function getWorkspaces(): Promise<AxiosResponse> {
  try {
    console.log('[Workspaces API] Fetching workspaces')
    return await workspacesApiClient.get('/read')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Workspaces API] Failed:', error.response?.status, error.response?.data?.message)
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Get a single workspace by ID.
 * GET /api/workspaces/read/{workspace_id}  (from Postman "Read Workspaces - happy case single workspace")
 */
export async function getWorkspace(workspaceId: string): Promise<AxiosResponse> {
  try {
    return await workspacesApiClient.get(`/read/${workspaceId}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { workspacesApiClient }
