import type { AxiosResponse } from 'axios'
import { API_CONFIG, getApiUrl } from '~/config/api.config'
import { createApiClient } from '~/services/api.client'

const workspacesApiClient = createApiClient(getApiUrl(API_CONFIG.ENDPOINTS.WORKSPACES))

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

