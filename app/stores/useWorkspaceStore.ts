import { defineStore } from 'pinia'
import { getWorkspaces } from '~/composables/useWorkspacesApi'
import type { ApiUser } from '~/stores/useUserStore'

export interface Workspace {
  id: string
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

        if (data.success) {
          // Backend returns array directly in data.data
          const workspacesData = Array.isArray(data.data) ? data.data : (data.data?.workspaces || [])
          this.workspaces = workspacesData

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
