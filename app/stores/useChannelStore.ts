import { defineStore } from 'pinia'
import {
  addChannelMemberRequest,
  createChannelRequest,
  deleteChannelRequest,
  getChannelsRequest,
  removeChannelMemberRequest,
  updateChannelRequest
} from '~/services/channelService'
import type { Channel } from '~/types/channel'
import { extractChannel, extractChannels, normalizeChannel } from '~/utils/channelNormalizer'

interface State {
  channels: Channel[]
  loading: boolean
  currentChannelId: string | null
}

interface ChannelPayload {
  success?: boolean
  message?: string
}

const channelRequests = new Map<string, Promise<void>>()

function hasChannelUser(channel: Channel, targetUserId: string): boolean {
  if (channel.direct_user_id === targetUserId || channel.user_id === targetUserId) {
    return true
  }

  return channel.members.some(member =>
    member.user_id === targetUserId
    || member.id === targetUserId
    || member._id === targetUserId
  )
}

export const useChannelStore = defineStore('channel-data', {
  state: (): State => ({
    channels: [],
    loading: false,
    currentChannelId: null
  }),
  persist: { pick: ['currentChannelId'] },
  getters: {
    currentChannel: state => state.channels.find(channel => channel.id === state.currentChannelId)
  },

  actions: {
    async fetchChannels(teamId: string, workspaceId?: string) {
      const requestKey = `${teamId}:${workspaceId || 'none'}`
      const existingRequest = channelRequests.get(requestKey)
      if (existingRequest) {
        await existingRequest
        return
      }

      this.loading = true

      const request = (async () => {
        const result = await getChannelsRequest(teamId, workspaceId)
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch channels')
        }

        const fetchedChannels = extractChannels(result.data?.data, { workspaceId, teamId })
        const existingDms = this.channels.filter(channel => channel.type === 'direct')
        const uniqueChannels = Array.from(new Map([...existingDms, ...fetchedChannels].map(channel => [channel.id, channel])).values())

        this.channels = uniqueChannels

        if (this.channels.length > 0 && (!this.currentChannelId || !this.channels.find(channel => channel.id === this.currentChannelId))) {
          this.currentChannelId = this.channels.find(channel => channel.type !== 'direct')?.id || this.channels[0]?.id || null
        }
      })()

      channelRequests.set(requestKey, request)

      try {
        await request
      } catch (error) {
        console.error('Failed to fetch channels:', error)
        this.channels = this.channels.filter(channel => channel.type === 'direct')
      } finally {
        channelRequests.delete(requestKey)
        this.loading = false
      }
    },

    async createChannel(data: {
      name: string
      workspace_id: string
      team_id: string
      type?: string
      isPrivate?: boolean
      description?: string
    }) {
      this.loading = true

      try {
        const result = await createChannelRequest({
          type: data.type === 'private' || data.type === 'direct' ? data.type : 'public',
          name: data.name,
          workspace_id: data.workspace_id,
          team_id: data.team_id,
          description: data.description
        })

        if (!result.success) {
          return { success: false, error: result.message || 'Failed to create channel' }
        }

        const payload = result.data?.data as ChannelPayload | undefined
        const channel = extractChannel(result.data?.data, { workspaceId: data.workspace_id, teamId: data.team_id })

        if (payload?.success && channel) {
          this.channels.push(channel)
          this.setCurrentChannel(channel.id)
          return { success: true, channel }
        }

        return { success: false, error: payload?.message || 'Failed to create channel' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create channel' }
      } finally {
        this.loading = false
      }
    },

    async createDirectChannel(workspaceId: string, teamId: string, targetUserId: string, targetUserName: string) {
      this.loading = true

      try {
        const existingDm = this.channels.find(channel =>
          channel.type === 'direct'
          && channel.workspace_id === workspaceId
          && channel.team_id === teamId
          && hasChannelUser(channel, targetUserId)
        )

        if (existingDm) {
          this.setCurrentChannel(existingDm.id)
          return { success: true, channel: existingDm }
        }

        const result = await createChannelRequest({
          name: `DM: ${targetUserName}`,
          workspace_id: workspaceId,
          team_id: teamId,
          type: 'direct',
          direct_user_id: targetUserId,
          user_id: targetUserId,
          members: [targetUserId]
        })

        if (!result.success) {
          return { success: false, error: result.message || 'Failed to start DM' }
        }

        const payload = result.data?.data as ChannelPayload | undefined
        const channel = extractChannel(result.data?.data, { workspaceId, teamId })

        if (payload?.success && channel) {
          const normalizedChannel = normalizeChannel(channel, { workspaceId, teamId })
          normalizedChannel.direct_user_id = normalizedChannel.direct_user_id || targetUserId
          this.channels.push(normalizedChannel)
          this.setCurrentChannel(normalizedChannel.id)
          return { success: true, channel: normalizedChannel }
        }

        return { success: false, error: payload?.message || 'Failed to start DM' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to start DM' }
      } finally {
        this.loading = false
      }
    },

    async deleteChannel(channelId: string) {
      this.loading = true

      try {
        const result = await deleteChannelRequest({ channel_id: channelId })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to delete channel' }
        }

        const payload = result.data?.data as ChannelPayload | undefined
        if (payload?.success) {
          this.removeChannel(channelId)
          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to delete channel' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete channel' }
      } finally {
        this.loading = false
      }
    },

    async updateChannel(channelId: string, name: string) {
      this.loading = true

      try {
        const result = await updateChannelRequest({ channel_id: channelId, name })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to update channel' }
        }

        const payload = result.data?.data as ChannelPayload | undefined
        const channel = extractChannel(result.data?.data)

        if (payload?.success && channel) {
          const index = this.channels.findIndex(item => item.id === channelId)
          if (index > -1) {
            this.channels[index] = { ...this.channels[index], ...channel }
          }

          return { success: true, channel }
        }

        return { success: false, error: payload?.message || 'Failed to update channel' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update channel' }
      } finally {
        this.loading = false
      }
    },

    async addMember(channelId: string, userId: string) {
      try {
        const result = await addChannelMemberRequest({
          channel_id: channelId,
          user_id: userId
        })

        if (!result.success) {
          return { success: false, error: result.message || 'Failed to add channel member' }
        }

        const channel = this.channels.find(item => item.id === channelId)
        if (channel) {
          await this.fetchChannels(channel.team_id, channel.workspace_id)
        }

        return { success: true, response: result.raw }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add channel member' }
      }
    },

    async removeMember(channelId: string, userId: string) {
      try {
        const result = await removeChannelMemberRequest({
          channel_id: channelId,
          user_id: userId
        })

        if (!result.success) {
          return { success: false, error: result.message || 'Failed to remove channel member' }
        }

        const channel = this.channels.find(item => item.id === channelId)
        if (channel) {
          await this.fetchChannels(channel.team_id, channel.workspace_id)
        }

        return { success: true, response: result.raw }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to remove channel member' }
      }
    },

    setCurrentChannel(id: string) {
      this.currentChannelId = id
    },

    clearCurrentChannel() {
      this.currentChannelId = null
    },

    clearChannels() {
      this.channels = []
      this.currentChannelId = null
    },

    addChannel(channel: Channel) {
      this.channels.push(channel)
    },

    removeChannel(channelId: string) {
      this.channels = this.channels.filter(channel => channel.id !== channelId)
      if (this.currentChannelId === channelId) {
        this.currentChannelId = null
      }
    }
  }
})
