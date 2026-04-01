import { defineStore } from 'pinia'
import axios from 'axios'

export const useTeamStore = defineStore('team', {
  state: () => ({
    teams: [] as any[],
    activeTeamId: null as string | null,
    // Make sure your NEW token is pasted here!
    token: 'UHYtskvnQeOBZCxS43BeZNVzjHPD9e9S1775030389'
  }),

  actions: {
    async fetchTeams(workspaceId: string) {
      try {
        this.teams = [] 
        
        const response = await axios.request({
          url: 'http://178.104.58.236/api/team/read',
          method: 'GET',
          headers: { 
            'token': this.token,
            'Token': this.token,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          params: {
            workspace_id: workspaceId
          }
        })

        if (response.data?.success) {
          this.teams = response.data.data?.teams || response.data.data || []
        } else {
          console.warn("Team API rejected:", response.data)
        }
      } catch (err: any) {
        console.error("Team Error:", err.response?.data || err.message)
      }
    },

    setActiveTeam(id: string | null) {
      this.activeTeamId = id
    }
  }
})