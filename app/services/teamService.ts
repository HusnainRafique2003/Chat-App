import { apiService } from '~/api/apiService'
import { getApiClient } from '~/api/client'
import type { CreateTeamParams, DeleteTeamParams, TeamMembersParams, UpdateTeamParams } from '~/types/team'

export async function getTeamsRequest(workspaceId: string) {
  return await apiService({
    url: '/team/read',
    method: 'GET',
    params: { workspace_id: workspaceId },
    required: ['workspace_id'],
    dedupeKey: `teams:${workspaceId}`
  })
}

export async function createTeamRequest(data: CreateTeamParams) {
  return await apiService({
    url: '/team/create',
    method: 'POST',
    data,
    required: ['workspace_id', 'name'],
    dedupe: false
  })
}

export async function updateTeamRequest(data: UpdateTeamParams) {
  return await apiService({
    url: '/team',
    method: 'PUT',
    data,
    required: ['team_id'],
    dedupe: false
  })
}

export async function deleteTeamRequest(data: DeleteTeamParams) {
  return await apiService({
    url: '/team/delete',
    method: 'DELETE',
    data,
    required: ['team_id'],
    dedupe: false
  })
}

export async function addTeamMemberRequest(data: TeamMembersParams) {
  return await apiService({
    url: '/team/add-member',
    method: 'POST',
    data,
    required: ['team_id', 'workspace_id'],
    dedupe: false
  })
}

export async function removeTeamMemberRequest(data: TeamMembersParams) {
  return await apiService({
    url: '/team/remove-member',
    method: 'POST',
    data,
    required: ['team_id', 'workspace_id'],
    dedupe: false
  })
}

export const teamApiClient = getApiClient()
