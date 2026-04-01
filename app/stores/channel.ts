import { defineStore } from 'pinia'
import axios from 'axios'

export const useChannelStore = defineStore('channel', {
  state: () => ({
    channels: [] as any[],
    activeChannelId: null as string | null,
    token: 'UHYtskvnQeOBZCxS43BeZNVzjHPD9e9S1775030389'
  }),

  actions: {
    async fetchChannels(teamId: string) {
      this.channels = []
      console.log(`Waiting for backend endpoint to fetch channels for team: ${teamId}`)
      
      // TODO: Add the correct axios call here once the backend is updated
      // Example: await axios.get('.../api/channels/list', { params: { team_id: teamId } })
    },

    setActiveChannel(id: string | null) {
      this.activeChannelId = id
    }
  }
})