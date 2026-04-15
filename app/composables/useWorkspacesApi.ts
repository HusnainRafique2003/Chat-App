import type { AxiosResponse } from 'axios'
import {
  addWorkspaceMemberRequest,
  createWorkspaceRequest,
  deleteWorkspaceRequest,
  fetchAvailableWorkspaceMembersRequest,
  getWorkspaceRequest,
  getWorkspacesRequest,
  removeWorkspaceMemberRequest,
  searchWorkspaceMembersRequest,
  updateWorkspaceRequest,
  workspaceApiClient as workspacesApiClient
} from '~/services/workspaceService'
import type { CreateWorkspaceParams, DeleteWorkspaceParams, UpdateWorkspaceParams, WorkspaceMembersParams } from '~/types/workspace'

async function unwrapResponse(request: Promise<{ raw: AxiosResponse<unknown>, success: boolean, message: string }>): Promise<AxiosResponse<unknown>> {
  const result = await request

  if (!result.success && result.message) {
    throw new Error(result.message)
  }

  return result.raw
}

export async function getWorkspaces(): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(getWorkspacesRequest())
}

export async function getWorkspace(workspaceId: string): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(getWorkspaceRequest(workspaceId))
}

export async function searchWorkspaceMembers(workspaceId: string, query: string): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(searchWorkspaceMembersRequest(workspaceId, query))
}

export async function createWorkspace(data: CreateWorkspaceParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(createWorkspaceRequest(data))
}

export async function updateWorkspace(data: UpdateWorkspaceParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(updateWorkspaceRequest(data))
}

export async function deleteWorkspace(data: DeleteWorkspaceParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(deleteWorkspaceRequest(data))
}

export async function addWorkspaceMember(data: WorkspaceMembersParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(addWorkspaceMemberRequest(data))
}

export async function removeWorkspaceMember(data: WorkspaceMembersParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(removeWorkspaceMemberRequest(data))
}

export async function fetchAvailableWorkspaceMembers(workspaceId: string): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(fetchAvailableWorkspaceMembersRequest(workspaceId))
}

export { workspacesApiClient }
