import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

// Some backends use /api/channel, others /api/channels.
const CHANNELS_BASE_SINGULAR = 'http://178.104.58.236/api/channel'
const CHANNELS_BASE_PLURAL = 'http://178.104.58.236/api/channels'

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

const channelsApiClient = makeClient(CHANNELS_BASE_SINGULAR)
const channelsApiClientPlural = makeClient(CHANNELS_BASE_PLURAL)

export async function createChannel(data: {
  name: string
  workspace_id: string
  team_id: string
  type: 'public'
}): Promise<AxiosResponse> {
  try {
    // Try singular then plural
    try {
      return await channelsApiClient.post('/create', data)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return await channelsApiClientPlural.post('/create', data)
      }
      throw error
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function updateChannel(data: {
  channel_id: string
  name: string
}): Promise<AxiosResponse> {
  try {
    try {
      return await channelsApiClient.patch('/update', data)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return await channelsApiClientPlural.patch('/update', data)
      }
      throw error
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function getChannels(teamId: string, workspaceId?: string): Promise<AxiosResponse> {
  try {
    // Backends vary: GET with params OR POST with JSON body, and /channel vs /channels.
    const params: Record<string, string> = { team_id: teamId }
    if (workspaceId) {
      params.workspace_id = workspaceId
    }

    const attempts: Array<() => Promise<AxiosResponse>> = [
      () => channelsApiClient.get('/read', { params }),
      () => channelsApiClient.post('/read', params),
      () => channelsApiClientPlural.get('/read', { params }),
      () => channelsApiClientPlural.post('/read', params),
    ]

    let lastErr: unknown
    for (const attempt of attempts) {
      try {
        return await attempt()
      } catch (error) {
        lastErr = error
        // Keep trying on 404/method mismatch; throw on other errors.
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

export { channelsApiClient }

