import type { AxiosResponse } from 'axios'
import { API_CONFIG, getApiUrl } from '~/config/api.config'
import { createApiClient } from '~/services/api.client'

const teamsApiClient = createApiClient(getApiUrl(API_CONFIG.ENDPOINTS.TEAMS))

export async function getTeams(workspaceId: string): Promise<AxiosResponse> {
  try {
    const response = await teamsApiClient.get('/read', {
      params: { workspace_id: workspaceId }
    })
    return response
  } catch (error) {
    throw error
  }
}

export { teamsApiClient }

