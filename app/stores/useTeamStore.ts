import { defineStore } from 'pinia'
import { getTeams, createTeam, updateTeam, deleteTeam } from '~/composables/useTeamsApi'

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

    // --- NEW ACTIONS: Create, Update, Delete ---

    async createTeam(data: { workspace_id: string; name: string; description?: string; color?: string }) {
      this.loading = true
      try {
        const response = await createTeam(data)
        const responseData = response.data

        if (responseData.success) {
          const newTeam = responseData.data?.team || responseData.data || responseData.team
          if (newTeam) {
            newTeam.id = newTeam.id || newTeam._id
            newTeam.members = newTeam.members || []
            this.teams.push(newTeam)
            
            // Switch to the newly created team
            this.setCurrentTeam(newTeam.id)
            return { success: true, team: newTeam }
          }
        }
        return { success: false, error: responseData.message || 'Failed to create team' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create team' }
      } finally {
        this.loading = false
      }
    },

    async updateTeam(teamId: string, data: { name?: string; description?: string; color?: string }) {
      this.loading = true
      try {
        const response = await updateTeam({ team_id: teamId, ...data })
        const responseData = response.data

        if (responseData.success) {
          const updatedTeam = responseData.data?.team || responseData.data
          if (updatedTeam) {
            const index = this.teams.findIndex(t => t.id === teamId || t._id === teamId)
            if (index > -1) {
              // Merge the updated data into the existing state
              this.teams[index] = { ...this.teams[index], ...updatedTeam }
            }
            return { success: true }
          }
        }
        return { success: false, error: responseData.message || 'Failed to update team' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update team' }
      } finally {
        this.loading = false
      }
    },

    async deleteTeam(teamId: string) {
      this.loading = true
      try {
        const response = await deleteTeam({ team_id: teamId })
        const responseData = response.data

        if (responseData.success) {
          // Remove from local state
          this.teams = this.teams.filter(t => t.id !== teamId && t._id !== teamId)
          
          // If they deleted their active team, fallback to the first available one
          if (this.currentTeamId === teamId) {
            this.currentTeamId = this.teams.length > 0 ? (this.teams[0].id || this.teams[0]._id as string) : null
          }
          return { success: true }
        }
        return { success: false, error: responseData.message || 'Failed to delete team' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete team' }
      } finally {
        this.loading = false
      }
    },

    // --- State Management ---

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