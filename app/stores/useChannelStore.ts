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
  description?: string
  workspace_id: string
  team_id: string
  type: 'public' | 'private' | 'direct'
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
    async fetchChannels(teamId: string, workspaceId?: string) {
      this.loading = true
      try {
        const response = await getChannels(teamId, workspaceId)
        const data = response.data

        if (data.success || data.data) {
          let channelsData: any[] = []

          if (Array.isArray(data.data)) {
            channelsData = data.data
          } else if (data.data?.channels && Array.isArray(data.data.channels)) {
            channelsData = data.data.channels
          } else if (data.data?.data && Array.isArray(data.data.data)) {
            channelsData = data.data.data
          }

          const newChannels = channelsData.map((c: any) => ({
            ...c,
            id: c.id || c._id,
            workspace_id: c.workspace_id || workspaceId || '',
            team_id: c.team_id || teamId || '',
            members: c.members || [],
          }))

          // 1. PRESERVE DMs! Keep direct messages, but swap out the team channels.
          const existingDms = this.channels.filter(c => c.type === 'direct')
          const combinedChannels = [...existingDms, ...newChannels]

          // 2. DEDUPLICATE: Remove any duplicate channels/DMs using a Map based on the ID
          const uniqueChannels = Array.from(new Map(combinedChannels.map(c => [c.id, c])).values())
          
          this.channels = uniqueChannels

          // 3. Set a default channel if none is selected
          if (this.channels.length > 0 && (!this.currentChannelId || !this.channels.find(c => c.id === this.currentChannelId))) {
            // Try to default to a regular channel first, fallback to whatever is available
            this.currentChannelId = this.channels.find(c => c.type !== 'direct')?.id || this.channels[0]?.id || null
          }
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error)
        // If the API fails (e.g., 404 No channels in this team), clear the public channels but KEEP DMs
        this.channels = this.channels.filter(c => c.type === 'direct')
      } finally {
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
        // Pass the actual data so 'private' channels work properly
        const response = await createChannel({
          type: 'public', // Default fallback
          ...data 
        })
        
        const channelData = response.data

        // Robust extraction (handles different backend response shapes)
        const newChannel = channelData.data?.channel || channelData.channel || channelData.data || channelData

        if (channelData.success && newChannel && (newChannel.id || newChannel._id)) {
          // Normalize the ID just like you do in fetchChannels
          newChannel.id = newChannel.id || newChannel._id
          
          // Push to state
          this.channels.push(newChannel)
          
          // Optional: automatically switch the user to the newly created channel
          this.setCurrentChannel(newChannel.id)
          
          return { success: true, channel: newChannel }
        }

        return { success: false, error: channelData.message || 'Failed to create channel' }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create channel'
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    // RESTORED DIRECT MESSAGE ACTION WITH TEAM SCOPING FIX
    // RESTORED DIRECT MESSAGE ACTION WITH PROPER USER ID CHECK
    async createDirectChannel(workspaceId: string, teamId: string, targetUserId: string, targetUserName: string) {
      this.loading = true
      try {
        // 1. Check if we already have a DM with this user by checking the MEMBERS array for their ID
        const existingDm = this.channels.find(c => {
          if (c.type !== 'direct' || c.workspace_id !== workspaceId || c.team_id !== teamId) return false
          
          // STRICT CHECK: Look for the target user's ID inside this channel's members array
          return c.members?.some(m => 
            m.user_id === targetUserId || 
            (m as any).id === targetUserId || 
            (m as any)._id === targetUserId
          )
        })

        // If it exists, just open it! This ensures previous messages are loaded.
        if (existingDm) {
          this.setCurrentChannel(existingDm.id || (existingDm as any)._id)
          return { success: true, channel: existingDm }
        }

        // 2. If not, ask the backend to create a new one
        const response = await createChannel({
          name: `DM: ${targetUserName}`,
          workspace_id: workspaceId,
          team_id: teamId, 
          type: 'direct',
          direct_user_id: targetUserId, 
          members: [targetUserId]
        })
        const channelData = response.data
        const newChannel = channelData.data?.channel || channelData.channel || channelData.data || channelData

        // 3. Add to sidebar and open it
        if (newChannel && (newChannel.id || newChannel._id)) {
          newChannel.id = newChannel.id || newChannel._id
          newChannel.team_id = newChannel.team_id || teamId // Ensure team_id is set locally
          
          // Ensure members array has the target user locally so future searches work instantly
          if (!newChannel.members) newChannel.members = []
          if (!newChannel.members.find((m: any) => m.user_id === targetUserId || m.id === targetUserId)) {
            newChannel.members.push({ user_id: targetUserId, role: 'member' })
          }

          this.channels.push(newChannel)
          this.setCurrentChannel(newChannel.id)
          return { success: true, channel: newChannel }
        }

        return { success: false, error: channelData.message || 'Failed to start DM' }
      } catch (error) {
        console.error('DM Creation Error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Failed to start DM' }
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