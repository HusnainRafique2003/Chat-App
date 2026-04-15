import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '~/stores/useUserStore'

const WORKSPACES_BASE = 'http://178.104.58.236/api/workspaces'

const workspacesApiClient = axios.create({
  baseURL: WORKSPACES_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

workspacesApiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const runtimeConfig = useRuntimeConfig()
  const devToken = runtimeConfig.public?.devApiToken || ''
  const token = userStore.token || devToken

  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
    console.log('[Workspaces API] Token attached:', token ? `${token.slice(0, 20)}...` : 'NO TOKEN')
  } else {
    console.warn('[Workspaces API] No token available for request')
  }

  return config
})

/**
 * Smart Error Handler
 * Extracts deep validation errors so the UI shows EXACTLY what is missing
 */
function handleApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data
    // If the backend sends specific field validation errors, grab the first one!
    if (responseData?.errors) {
      const firstErrorKey = Object.keys(responseData.errors)[0]
      const firstErrorMessage = responseData.errors[firstErrorKey]
      const message = Array.isArray(firstErrorMessage) ? firstErrorMessage[0] : firstErrorMessage
      return new Error(message as string)
    }
    // Otherwise fallback to the generic message
    return new Error(responseData?.message || error.message)
  }
  return error as Error
}

// ==========================================
// READ / GET
// ==========================================

export async function getWorkspaces(): Promise<AxiosResponse> {
  try {
    return await workspacesApiClient.get('/read')
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getWorkspace(workspaceId: string): Promise<AxiosResponse> {
  try {
    return await workspacesApiClient.get(`/read/${workspaceId}`)
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function searchWorkspaceMembers(workspaceId: string, query: string): Promise<AxiosResponse> {
  try {
    return await workspacesApiClient.get(`/${workspaceId}/search-members`, {
      params: { q: query }
    })
  } catch (error) {
    throw handleApiError(error)
  }
}

// ==========================================
// CREATE, UPDATE, DELETE
// ==========================================

export async function createWorkspace(data: {
  name: string
  description?: string
}): Promise<AxiosResponse> {
  try {
    return await workspacesApiClient.post('/create', data)
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function updateWorkspace(data: {
  workspace_id: string
  name?: string
  description?: string
}): Promise<AxiosResponse> {
  try {
    // We send BOTH 'workspace_id' and 'id' to cover different backend naming styles
    const payload: any = {
      workspace_id: data.workspace_id,
      id: data.workspace_id,
      name: data.name
    }

    // Some backends reject empty strings for optional fields, so we only send description if it exists
    if (data.description && data.description.trim() !== '') {
      payload.description = data.description
    }

    return await workspacesApiClient.patch('/update', payload)
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function deleteWorkspace(data: {
  workspace_id: string
}): Promise<AxiosResponse> {
  try {
    // Send both 'id' and 'workspace_id' just to be safe
    return await workspacesApiClient.delete('/delete', {
      data: { workspace_id: data.workspace_id, id: data.workspace_id }
    })
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function addWorkspaceMember(data: { workspace_id: string, user_ids: string[] }) {
  try {
    return await workspacesApiClient.post('/add-members', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function removeWorkspaceMember(data: { workspace_id: string, user_ids: string[] }) {
  try {
    return await workspacesApiClient.delete('/remove-members', { data })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}

export async function fetchAvailableWorkspaceMembers(workspaceId: string) {
  try {
    return await workspacesApiClient.get(`/${workspaceId}/available-members`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.message)
    }
    throw error
  }
}
export { workspacesApiClient }
