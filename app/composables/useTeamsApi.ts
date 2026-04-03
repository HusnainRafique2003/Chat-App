import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

const TEAMS_BASE_SINGULAR = 'http://178.104.58.236/api/team'
const TEAMS_BASE_PLURAL = 'http://178.104.58.236/api/teams'

function makeClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
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

const teamsApiClient = makeClient(TEAMS_BASE_PLURAL)
const teamsApiClientSingular = makeClient(TEAMS_BASE_SINGULAR)

export async function getTeams(workspaceId: string): Promise<AxiosResponse> {
  try {
    const payload = { workspace_id: workspaceId }
    const attempts: Array<() => Promise<AxiosResponse>> = [
      () => teamsApiClient.get('/read', { params: payload }),
      () => teamsApiClient.post('/read', payload),
      () => teamsApiClientSingular.get('/read', { params: payload }),
      () => teamsApiClientSingular.post('/read', payload),
    ]

    let lastErr: unknown
    for (const attempt of attempts) {
      try {
        return await attempt()
      } catch (error) {
        lastErr = error
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status === 404 || status === 405) continue
        }
      }
    }

    throw lastErr
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { teamsApiClient }

