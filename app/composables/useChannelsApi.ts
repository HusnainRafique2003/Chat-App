import type { AxiosResponse } from 'axios'
import { API_CONFIG, getApiUrl } from '~/config/api.config'
import { createApiClient } from '~/services/api.client'

const channelsApiClient = createApiClient(getApiUrl(API_CONFIG.ENDPOINTS.CHANNELS))

export async function createChannel(data: {
  name: string
  workspace_id: string
  team_id: string
  type: 'public'
}): Promise<AxiosResponse> {
  return await channelsApiClient.post('/create', data)
}

export async function updateChannel(data: {
  channel_id: string
  name: string
}): Promise<AxiosResponse> {
  return await channelsApiClient.patch('/update', data)
}

export async function getChannels(teamId: string): Promise<AxiosResponse> {
  const response = await channelsApiClient.get('/read', {
    params: { team_id: teamId }
  })
  return response
}

export { channelsApiClient }
