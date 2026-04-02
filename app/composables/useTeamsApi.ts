import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useUserStore } from '~/stores/useUserStore'

const TEAMS_BASE = 'http://178.104.58.236/api/teams'

const teamsApiClient = axios.create({
  baseURL: TEAMS_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

teamsApiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token

  console.log('Teams API - Token:', token ? `${token.slice(0, 20)}...` : 'MISSING')
  console.log('Teams API - User:', userStore.user?.email)

  if (token) {
    // Primary: token header (as per API spec)
    config.headers.token = token
    // Secondary: Authorization header (standard)
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('Teams API - No token available!')
  }

  return config
})

export async function getTeams(workspaceId: string): Promise<AxiosResponse> {
  try {
    const response = await teamsApiClient.post('/read', { workspace_id: workspaceId })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { teamsApiClient }

