import axios from 'axios'
import { defineStore } from 'pinia'
import { useUserStore } from '~/stores/useUserStore'

export interface TeamMember {
  user_id: string
  role: string
}

export interface Team {
  id: string
  name: string
  description: string
  workspace_id: string
  creator_id: string
  members_count: number
  members: TeamMember[]
  created_at: string
  updated_at: string
}

interface State {
  teams: Team[]
  loading: boolean
  currentTeamId: string | null
}

export const useTeamStore = defineStore('team-data', {
  state: (): State => ({
    teams: [],
    loading: false,
    currentTeamId: null
  }),

  getters: {
    currentTeam: state => state.teams.find(t => t.id === state.currentTeamId)
  },

  actions: {
    async fetchTeams(workspaceId: string) {
      this.loading = true
      try {
        const userStore = useUserStore()
        const token = userStore.token

        console.log('Fetching teams with token:', token ? `${token.slice(0, 20)}...` : 'NO TOKEN')
        console.log('Workspace ID:', workspaceId)

        const response = await axios.get('http://178.104.58.236/api/team/read', {
          headers: {
            'token': token,
            'Content-Type': 'application/json'
          },
          params: {
            workspace_id: workspaceId
          }
        })

        console.log('Teams response:', response.data)

        if (response.data?.success) {
          const teamsData = response.data.data?.teams || response.data.data || []
          this.teams = teamsData

          if (this.teams.length > 0 && !this.currentTeamId) {
            this.currentTeamId = this.teams[0]?.id || null
          }

          console.log('Teams loaded:', this.teams.length)
        }
      } catch {
        console.warn('Teams endpoint not available - backend may not have implemented /api/team/read yet')
        this.teams = []
      } finally {
        this.loading = false
      }
    },

    setCurrentTeam(id: string) {
      this.currentTeamId = id
    },

    clearCurrentTeam() {
      this.currentTeamId = null
    },

    clearTeams() {
      this.teams = []
      this.currentTeamId = null
    }
  }
})
