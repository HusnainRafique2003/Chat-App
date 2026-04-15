import { apiService } from '~/api/apiService'
import { getApiClient } from '~/api/client'
import type { ChannelMemberParams, CreateChannelParams, DeleteChannelParams, UpdateChannelParams } from '~/types/channel'

export async function getChannelsRequest(teamId: string, workspaceId?: string) {
  const params: Record<string, string> = { team_id: teamId }

  if (workspaceId) {
    params.workspace_id = workspaceId
  }

  return await apiService({
    url: '/channels/read',
    method: 'GET',
    params,
    required: ['team_id'],
    dedupeKey: `channels:${teamId}:${workspaceId || 'none'}`
  })
}

export async function createChannelRequest(data: CreateChannelParams) {
  return await apiService({
    url: '/channels/create',
    method: 'POST',
    data,
    required: ['workspace_id', 'name', 'type'],
    dedupe: false
  })
}

export async function updateChannelRequest(data: UpdateChannelParams) {
  return await apiService({
    url: '/channels',
    method: 'PUT',
    data,
    required: ['channel_id'],
    dedupe: false
  })
}

export async function deleteChannelRequest(data: DeleteChannelParams) {
  return await apiService({
    url: '/channels/delete',
    method: 'DELETE',
    data,
    required: ['channel_id'],
    dedupe: false
  })
}

export async function addChannelMemberRequest(data: ChannelMemberParams) {
  return await apiService({
    url: '/channels/add-member',
    method: 'POST',
    data,
    required: ['channel_id', 'user_id'],
    dedupe: false
  })
}

export async function removeChannelMemberRequest(data: ChannelMemberParams) {
  return await apiService({
    url: '/channels/remove-member',
    method: 'DELETE',
    data,
    required: ['channel_id', 'user_id'],
    dedupe: false
  })
}

export const channelApiClient = getApiClient()
