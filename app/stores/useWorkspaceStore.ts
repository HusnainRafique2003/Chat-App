import { defineStore } from 'pinia'
import { getWorkspaces } from '~/composables/useWorkspacesApi'
import type { ApiUser } from '~/stores/useUserStore'

export interface Workspace {
  id: string
  _id?: string
  name: string
  description: string
  creator_id: string
  created_at: string
  updated_at: string
  members: ApiUser[]
}

interface State {
  workspaces: Workspace[]
  loading: boolean
  currentWorkspaceId: string | null
}

export const useWorkspaceStore = defineStore('workspace-data', {
  state: (): State => ({
    workspaces: [],
    loading: false,
    currentWorkspaceId: null
  }),

  getters: {
    currentWorkspace: state => state.workspaces.find(w => w.id === state.currentWorkspaceId)
  },

  actions: {
    async fetchWorkspaces() {
      this.loading = true
      try {
        const response = await getWorkspaces()
        const data = response.data

        console.log('Workspaces API response:', JSON.stringify(data).slice(0, 500))

        if (data.success) {
          // Handle multiple response shapes
          let workspacesData: any[] = []

          if (Array.isArray(data.data)) {
            workspacesData = data.data
          } else if (data.data?.workspaces && Array.isArray(data.data.workspaces)) {
            workspacesData = data.data.workspaces
          } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            // Single workspace returned as object
            workspacesData = [data.data]
          }

          // Normalize id field
          this.workspaces = workspacesData.map((w: any) => ({
            ...w,
            id: w.id || w._id,
            members: w.members || [],
          }))

          if (this.workspaces.length > 0 && !this.currentWorkspaceId) {
            this.currentWorkspaceId = this.workspaces[0]?.id || null
          }

          console.log('Workspaces loaded:', this.workspaces.length)
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      } finally {
        this.loading = false
      }
    },

    setCurrentWorkspace(id: string) {
      this.currentWorkspaceId = id
    },

    clearCurrentWorkspace() {
      this.currentWorkspaceId = null
    }
  }
})
