import { defineStore } from 'pinia'
import { createChannel, getChannels, updateChannel } from '~/composables/useChannelsApi'

export interface ChannelMember {
  user_id: string
  role: string
}

export interface Channel {
  id: string
  _id: string
  name: string
  workspace_id: string
  team_id: string
  type: 'public'
  direct_id: null
  created_id: string
  members: ChannelMember[]
  created_at: string
  updated_at: string
}

interface State {
  channels: Channel[]
  loading: boolean
  currentChannelId: string | null
}

export const useChannelStore = defineStore('channel-data', {
  state: (): State => ({
    channels: [],
    loading: false,
    currentChannelId: null,
  }),

  getters: {
    currentChannel: (state) => state.channels.find(c => c.id === state.currentChannelId),
  },

  actions: {
    async fetchChannels(teamId: string) {
      this.loading = true
      try {
        const response = await getChannels(teamId)
        const data = response.data

        if (data.success) {
          // Backend returns array directly in data.data
          const channelsData = Array.isArray(data.data) ? data.data : (data.data?.channels || [])
          this.channels = channelsData

          if (this.channels.length > 0 && !this.currentChannelId) {
            this.currentChannelId = this.channels[0]?.id || null
          }

          console.log('Channels loaded:', this.channels.length)
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error)
      } finally {
        this.loading = false
      }
    },

    async createChannel(data: {
      name: string
      workspace_id: string
      team_id: string
    }) {
      this.loading = true
      try {
        const response = await createChannel({
          ...data,
          type: 'public'
        })
        const channelData = response.data

        if (channelData.success && channelData.data?.channel) {
          this.channels.push(channelData.data.channel)
          return { success: true, channel: channelData.data.channel }
        }

        return { success: false, error: channelData.message || 'Failed to create channel' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create channel'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    async updateChannel(channelId: string, name: string) {
      this.loading = true
      try {
        const response = await updateChannel({
          channel_id: channelId,
          name
        })
        const channelData = response.data

        if (channelData.success && channelData.data?.channel) {
          const index = this.channels.findIndex(c => c.id === channelId)
          if (index > -1) {
            this.channels[index] = channelData.data.channel
          }
          return { success: true, channel: channelData.data.channel }
        }

        return { success: false, error: channelData.message || 'Failed to update channel' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update channel'
        return { success: false, error: message }
      } finally {
        this.loading = false
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
      this.channels = this.channels.filter(c => c.id !== channelId)
      if (this.currentChannelId === channelId) {
        this.currentChannelId = null
      }
    },
  },
})
