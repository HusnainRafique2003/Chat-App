import { apiService } from '~/api/apiService'
import { getApiClient } from '~/api/client'
import type {
  CreateWorkspaceParams,
  DeleteWorkspaceParams,
  UpdateWorkspaceParams,
  WorkspaceMembersParams
} from '~/types/workspace'

export async function getWorkspacesRequest() {
  return await apiService({
    url: '/workspaces/read',
    method: 'GET',
    dedupeKey: 'workspaces:read'
  })
}

export async function getWorkspaceRequest(workspaceId: string) {
  return await apiService({
    url: `/workspaces/read/${workspaceId}`,
    method: 'GET',
    dedupeKey: `workspace:read:${workspaceId}`
  })
}

export async function searchWorkspaceMembersRequest(workspaceId: string, query: string) {
  return await apiService({
    url: `/workspaces/${workspaceId}/search-members`,
    method: 'GET',
    params: { q: query },
    required: ['q'],
    dedupeKey: `workspace:${workspaceId}:search-members:${query.trim().toLowerCase()}`
  })
}

export async function createWorkspaceRequest(data: CreateWorkspaceParams) {
  return await apiService({
    url: '/workspaces/create',
    method: 'POST',
    data,
    required: ['name'],
    dedupe: false
  })
}

export async function updateWorkspaceRequest(data: UpdateWorkspaceParams) {
  const payload: Record<string, string> = {
    workspace_id: data.workspace_id,
    id: data.workspace_id
  }

  if (data.name) {
    payload.name = data.name
  }

  if (data.description && data.description.trim() !== '') {
    payload.description = data.description
  }

  return await apiService({
    url: '/workspaces/update',
    method: 'PATCH',
    data: payload,
    required: ['workspace_id'],
    dedupe: false
  })
}

export async function deleteWorkspaceRequest(data: DeleteWorkspaceParams) {
  return await apiService({
    url: '/workspaces/delete',
    method: 'DELETE',
    data: { workspace_id: data.workspace_id, id: data.workspace_id },
    required: ['workspace_id'],
    dedupe: false
  })
}

export async function addWorkspaceMemberRequest(data: WorkspaceMembersParams) {
  return await apiService({
    url: '/workspaces/add-members',
    method: 'POST',
    data,
    required: ['workspace_id'],
    dedupe: false
  })
}

export async function removeWorkspaceMemberRequest(data: WorkspaceMembersParams) {
  return await apiService({
    url: '/workspaces/remove-members',
    method: 'DELETE',
    data,
    required: ['workspace_id'],
    dedupe: false
  })
}

export async function fetchAvailableWorkspaceMembersRequest(workspaceId: string) {
  return await apiService({
    url: `/workspaces/${workspaceId}/available-members`,
    method: 'GET',
    dedupeKey: `workspace:${workspaceId}:available-members`
  })
}

export const workspaceApiClient = getApiClient()
