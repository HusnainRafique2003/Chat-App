import type { AxiosResponse } from 'axios'
import {
  addChannelMemberRequest,
  channelApiClient as channelsApiClient,
  createChannelRequest,
  deleteChannelRequest,
  getChannelsRequest,
  removeChannelMemberRequest,
  updateChannelRequest
} from '~/services/channelService'
import type { ChannelMemberParams, CreateChannelParams, DeleteChannelParams, UpdateChannelParams } from '~/types/channel'

async function unwrapResponse(request: Promise<{ raw: AxiosResponse<unknown>, success: boolean, message: string }>): Promise<AxiosResponse<unknown>> {
  const result = await request

  if (!result.success && result.message) {
    throw new Error(result.message)
  }

  return result.raw
}

export async function createChannel(data: CreateChannelParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(createChannelRequest(data))
}

export async function updateChannel(data: UpdateChannelParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(updateChannelRequest(data))
}

export async function getChannels(teamId: string, workspaceId?: string): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(getChannelsRequest(teamId, workspaceId))
}

export async function deleteChannel(data: DeleteChannelParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(deleteChannelRequest(data))
}

export async function addChannelMember(data: ChannelMemberParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(addChannelMemberRequest(data))
}

export async function removeChannelMember(data: ChannelMemberParams): Promise<AxiosResponse<unknown>> {
  return await unwrapResponse(removeChannelMemberRequest(data))
}

export { channelsApiClient }
