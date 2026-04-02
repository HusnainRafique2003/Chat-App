import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useUserStore } from '~/stores/useUserStore'

const CHANNELS_BASE = 'http://178.104.58.236/api/channel'

const channelsApiClient = axios.create({
  baseURL: CHANNELS_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

channelsApiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function createChannel(data: {
  name: string
  workspace_id: string
  team_id: string
  type: 'public'
}): Promise<AxiosResponse> {
  try {
    const response = await channelsApiClient.post('/create', data)
    return response
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
    const response = await channelsApiClient.patch('/update', data)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function getChannels(teamId: string): Promise<AxiosResponse> {
  try {
    const response = await channelsApiClient.get('/read', {
      data: { team_id: teamId }
    })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { channelsApiClient }

