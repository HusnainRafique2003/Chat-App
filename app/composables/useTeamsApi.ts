import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

const API_BASE = 'http://178.104.58.236/api'

function makeClient() {
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  client.interceptors.request.use((config) => {
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

  return client
}

const teamsApiClient = makeClient()

/**
 * Read teams for a workspace.
 * GET /api/team/read?workspace_id={id}  (singular /team/read - confirmed via backend probe)
 */
export async function getTeams(workspaceId: string): Promise<AxiosResponse> {
  try {
    console.log('[Teams API] Fetching teams for workspace:', workspaceId)
    return await teamsApiClient.get('/team/read', {
      params: { workspace_id: workspaceId }
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Teams API] Failed:', error.response?.status, error.response?.data?.message)
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}
/**
 * Create a team.
 * POST /api/team/create
 */
export async function createTeam(data: {
  workspace_id: string
  name: string
  description?: string
  color?: string
}): Promise<AxiosResponse> {
  try {
    return await teamsApiClient.post('/team/create', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Update a team.
 * PUT /api/team
 */
export async function updateTeam(data: {
  team_id: string
  name?: string
  description?: string
  color?: string
}): Promise<AxiosResponse> {
  try {
    return await teamsApiClient.put('/team', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Delete a team.
 * DELETE /api/team/delete
 */
export async function deleteTeam(data: {
  team_id: string
}): Promise<AxiosResponse> {
  try {
    return await teamsApiClient.delete('/team/delete', { data })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}
export async function addTeamMember(data: { team_id: string; workspace_id: string; user_ids: string[] }) {
  try {
    return await teamsApiClient.post('/team/add-member', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function removeTeamMember(data: { team_id: string; workspace_id: string; user_ids: string[] }) {
  try {
    return await teamsApiClient.post('/team/remove-member', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}
export { teamsApiClient }
