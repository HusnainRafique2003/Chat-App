import type { AxiosResponse } from 'axios'
import {
  addTeamMemberRequest,
  createTeamRequest,
  deleteTeamRequest,
  getTeamsRequest,
  removeTeamMemberRequest,
  teamApiClient as teamsApiClient,
  updateTeamRequest
} from '~/services/teamService'
import type { CreateTeamParams, DeleteTeamParams, TeamMembersParams, UpdateTeamParams } from '~/types/team'

async function unwrapResponse(request: Promise<{ raw: AxiosResponse<unknown>, success: boolean, message: string }>): Promise<AxiosResponse<unknown>> {
  const result = await request

  if (!result.success && result.message) {
    throw new Error(result.message)
  }

  return result.raw
}

export async function getTeams(workspaceId: string): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(getTeamsRequest(workspaceId))
}

export async function createTeam(data: CreateTeamParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(createTeamRequest(data))
}

export async function updateTeam(data: UpdateTeamParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(updateTeamRequest(data))
}

export async function deleteTeam(data: DeleteTeamParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(deleteTeamRequest(data))
}

export async function addTeamMember(data: TeamMembersParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(addTeamMemberRequest(data))
}

export async function removeTeamMember(data: TeamMembersParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(removeTeamMemberRequest(data))
}

export { teamsApiClient }
