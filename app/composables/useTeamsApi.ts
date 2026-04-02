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

  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function getTeams(workspaceId: string): Promise<AxiosResponse> {
  try {
    const response = await teamsApiClient.get('/read', {
      data: { workspace_id: workspaceId }
    })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { teamsApiClient }

