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

const channelsApiClient = makeClient()

/**
 * Create a channel.
 * POST /api/channels/create  (from Postman "Create Channel")
 * Body: { workspace_id, name, type, team_id }
 */
export async function createChannel(data: {
  name: string
  workspace_id: string
  team_id?: string // Made optional for DMs
  type: 'public' | 'private' | 'direct' // Added direct
  direct_user_id?: string // Passed to backend to link the user
  members?: string[] // Fallback array in case backend prefers this
}): Promise<AxiosResponse> {
  try {
    return await channelsApiClient.post('/channels/create', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Update a channel.
 * PUT /api/channels  (from Postman "Update Channel")
 */
export async function updateChannel(data: {
  channel_id: string
  name?: string
  type?: string
}): Promise<AxiosResponse> {
  try {
    return await channelsApiClient.put('/channels', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Read channels for a team.
 * GET /api/channels/read?team_id={id}  (confirmed via backend probe)
 */
export async function getChannels(teamId: string, workspaceId?: string): Promise<AxiosResponse> {
  try {
    const params: Record<string, string> = { team_id: teamId }
    if (workspaceId) {
      params.workspace_id = workspaceId
    }

    console.log('[Channels API] Fetching channels for team:', teamId)
    return await channelsApiClient.get('/channels/read', { params })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Channels API] Failed:', error.response?.status, error.response?.data?.message)
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Delete a channel.
 * DELETE /api/channels/delete  (from Postman "Delete Channel")
 */
export async function deleteChannel(data: {
  channel_id: string
}): Promise<AxiosResponse> {
  try {
    return await channelsApiClient.delete('/channels/delete', { data })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Add a member to a channel.
 * POST /api/channels/add-member  (from Postman "Add Member")
 */
export async function addChannelMember(data: {
  channel_id: string
  user_id: string
}): Promise<AxiosResponse> {
  try {
    return await channelsApiClient.post('/channels/add-member', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

/**
 * Remove a member from a channel.
 * DELETE /api/channels/remove-member  (from Postman "Remove Member")
 */
export async function removeChannelMember(data: {
  channel_id: string
  user_id: string
}): Promise<AxiosResponse> {
  try {
    return await channelsApiClient.delete('/channels/remove-member', { data })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { channelsApiClient }
