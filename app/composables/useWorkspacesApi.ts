import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useUserStore } from '~/stores/useUserStore'

// Workspaces base URL
const WORKSPACES_BASE = 'http://178.104.58.236/api/workspaces'

const workspacesApiClient = axios.create({
  baseURL: WORKSPACES_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
workspacesApiClient.interceptors.request.use((config) => {
  const token = useUserStore().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export async function createWorkspace(data: { name: string, description: string }): Promise<AxiosResponse> {
  try {
    const response = await workspacesApiClient.post('/create', data)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function updateWorkspace(data: { workspace_id: string, name: string, description: string }): Promise<AxiosResponse> {
  try {
    const response = await workspacesApiClient.patch('/update', data)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function deleteWorkspace(data: { workspace_id: string }): Promise<AxiosResponse> {
  try {
    const response = await workspacesApiClient.delete('/delete', { data })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function addMembersToWorkspace(data: { workspace_id: string, user_ids: string[] }): Promise<AxiosResponse> {
  try {
    const response = await workspacesApiClient.post('/add-members', data)
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function removeMembersFromWorkspace(data: { workspace_id: string, user_ids: string[] }): Promise<AxiosResponse> {
  try {
    const response = await workspacesApiClient.delete('/remove-members', { data })
    return response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export { workspacesApiClient }

