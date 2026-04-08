import { defineStore } from 'pinia'
import { getTeams } from '~/composables/useTeamsApi'

export interface TeamMember {
  user_id: string
  role: string
}

export interface Team {
  id: string
  _id?: string
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
        const response = await getTeams(workspaceId)
        const data = response.data

        console.log('Teams API response:', JSON.stringify(data).slice(0, 500))

        if (data?.success) {
          // Handle multiple response shapes
          let teamsData: any[] = []

          if (Array.isArray(data.data)) {
            teamsData = data.data
          } else if (data.data?.teams && Array.isArray(data.data.teams)) {
            teamsData = data.data.teams
          } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            teamsData = [data.data]
          }

          // Normalize id field
          this.teams = teamsData.map((t: any) => ({
            ...t,
            id: t.id || t._id,
            members: t.members || [],
            members_count: t.members_count ?? (t.members?.length || 0),
          }))

          if (this.teams.length > 0 && !this.currentTeamId) {
            this.currentTeamId = this.teams[0]?.id || null
          }

          console.log('Teams loaded:', this.teams.length)
        } else {
          this.teams = []
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // 404 just means this workspace has no teams yet - not a real error
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          console.log('[Team Store] No teams found for workspace:', workspaceId, '- This is normal if workspace is empty')
        } else {
          console.error('[Team Store] Failed to fetch teams:', error)
        }
        
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
