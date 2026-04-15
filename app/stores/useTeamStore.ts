import { defineStore } from 'pinia'
import {
  addTeamMemberRequest,
  createTeamRequest,
  deleteTeamRequest,
  getTeamsRequest,
  removeTeamMemberRequest,
  updateTeamRequest
} from '~/services/teamService'
import type { Team } from '~/types/team'
import { extractTeam, extractTeams } from '~/utils/teamNormalizer'

interface TeamMembersPayload {
  data?: {
    members?: Team['members']
  }
}

interface State {
  teams: Team[]
  loading: boolean
  currentTeamId: string | null
}

interface TeamPayload {
  success?: boolean
  message?: string
}

const teamRequests = new Map<string, Promise<void>>()

export const useTeamStore = defineStore('team-data', {
  state: (): State => ({
    teams: [],
    loading: false,
    currentTeamId: null
  }),
  persist: { pick: ['currentTeamId'] },
  getters: {
    currentTeam: state => state.teams.find(team => team.id === state.currentTeamId)
  },

  actions: {
    async fetchTeams(workspaceId: string) {
      const existingRequest = teamRequests.get(workspaceId)
      if (existingRequest) {
        await existingRequest
        return
      }

      this.loading = true

      const request = (async () => {
        const result = await getTeamsRequest(workspaceId)
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch teams')
        }

        this.teams = extractTeams(result.data?.data)

        if (this.teams.length > 0 && !this.currentTeamId) {
          this.currentTeamId = this.teams[0]?.id || null
        }
      })()

      teamRequests.set(workspaceId, request)

      try {
        await request
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          console.log('[Team Store] No teams found for workspace:', workspaceId)
        } else {
          console.error('[Team Store] Failed to fetch teams:', error)
        }

        this.teams = []
      } finally {
        teamRequests.delete(workspaceId)
        this.loading = false
      }
    },

    async createTeam(data: { workspace_id: string, name: string, description?: string, color?: string }) {
      this.loading = true

      try {
        const result = await createTeamRequest(data)
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to create team' }
        }

        const payload = result.data?.data as TeamPayload | undefined
        const team = extractTeam(result.data?.data)

        if (payload?.success && team) {
          this.teams.push(team)
          this.setCurrentTeam(team.id)
          return { success: true, team }
        }

        return { success: false, error: payload?.message || 'Failed to create team' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create team' }
      } finally {
        this.loading = false
      }
    },

    async updateTeam(teamId: string, data: { name?: string, description?: string, color?: string }) {
      this.loading = true

      try {
        const result = await updateTeamRequest({ team_id: teamId, ...data })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to update team' }
        }

        const payload = result.data?.data as TeamPayload | undefined
        const team = extractTeam(result.data?.data)

        if (payload?.success && team) {
          const index = this.teams.findIndex(item => item.id === teamId || item._id === teamId)
          if (index > -1) {
            this.teams[index] = { ...this.teams[index], ...team }
          }

          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to update team' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update team' }
      } finally {
        this.loading = false
      }
    },

    async deleteTeam(teamId: string) {
      this.loading = true

      try {
        const result = await deleteTeamRequest({ team_id: teamId })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to delete team' }
        }

        const payload = result.data?.data as TeamPayload | undefined
        if (payload?.success) {
          this.teams = this.teams.filter(item => item.id !== teamId && item._id !== teamId)

          if (this.currentTeamId === teamId) {
            this.currentTeamId = this.teams[0]?.id || this.teams[0]?._id || null
          }

          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to delete team' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete team' }
      } finally {
        this.loading = false
      }
    },

    async addMembers(teamId: string, workspaceId: string, userIds: string[]) {
      try {
        const result = await addTeamMemberRequest({
          team_id: teamId,
          workspace_id: workspaceId,
          user_ids: userIds
        })

        if (!result.success) {
          return { success: false, error: result.message || 'Failed to add team member' }
        }

        const payload = result.data as TeamMembersPayload
        const team = this.currentTeam
        if (payload?.data?.members && team) {
          team.members = payload.data.members
        }

        await this.fetchTeams(workspaceId)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add team member' }
      }
    },

    async removeMembers(teamId: string, workspaceId: string, userIds: string[]) {
      try {
        const result = await removeTeamMemberRequest({
          team_id: teamId,
          workspace_id: workspaceId,
          user_ids: userIds
        })

        if (!result.success) {
          return { success: false, error: result.message || 'Failed to remove team member' }
        }

        const payload = result.data as TeamMembersPayload
        const team = this.currentTeam
        if (payload?.data?.members && team) {
          team.members = payload.data.members
        }

        await this.fetchTeams(workspaceId)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to remove team member' }
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
