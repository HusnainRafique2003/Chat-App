import { defineStore } from 'pinia'
import { getTeams } from '~/composables/useTeamsApi'

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
    currentTeamId: null,
  }),

  getters: {
    currentTeam: (state) => state.teams.find(t => t.id === state.currentTeamId),
  },

  actions: {
    async fetchTeams(workspaceId: string) {
      this.loading = true
      try {
        const response = await getTeams(workspaceId)
        const data = response.data

        if (data.success) {
          this.teams = data.data.teams || []
          if (this.teams.length > 0 && !this.currentTeamId) {
            this.currentTeamId = this.teams[0]?.id || null
          }
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error)
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
    },
  },
})
