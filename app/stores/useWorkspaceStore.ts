import { defineStore } from 'pinia'
import { getWorkspaces, getWorkspace } from '~/composables/useWorkspacesApi'
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

        if (data.success || data.data) {
          let workspacesData: any[] = []

          if (Array.isArray(data.data)) workspacesData = data.data
          else if (data.data?.workspaces && Array.isArray(data.data.workspaces)) workspacesData = data.data.workspaces
          else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) workspacesData = [data.data]

          this.workspaces = workspacesData.map((w: any) => ({
            ...w,
            id: w.id || w._id,
            members: w.members || w.users || [],
          }))

          if (this.workspaces.length > 0 && !this.currentWorkspaceId) {
            this.currentWorkspaceId = this.workspaces[0]?.id || null
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Failed to fetch workspaces:', {
            message: error.message,
            status: (error as any).response?.status,
            data: (error as any).response?.data
          })
        } else {
          console.error('Failed to fetch workspaces:', error)
        }
        // Check if it's a 401 unauthorized error
        if ((error as any)?.response?.status === 401) {
          // Token may be invalid/expired, don't retry automatically
          // Let the auth middleware handle the redirect to login
        }
      } finally {
        this.loading = false
      }
    },

    async refreshWorkspaceMembers(workspaceId: string) {
      try {
        const response = await getWorkspace(workspaceId)
        const data = response.data

        if (data?.success || data?.data) {
          // 1. Handle if the backend returns an array of all workspaces
          let workspaceData = null
          if (Array.isArray(data.data)) {
            workspaceData = data.data.find((w: any) => w.id === workspaceId || w._id === workspaceId)
          } else {
            workspaceData = data.data?.workspace || data.data || data
          }

          // 2. If we found the specific workspace, extract its members
          if (workspaceData) {
            const index = this.workspaces.findIndex(w => w.id === workspaceId || w._id === workspaceId)
            
            if (index > -1) {
              let rawMembers = workspaceData.members || workspaceData.users || workspaceData.workspace_members || []
              const freshMembers = rawMembers.map((m: any) => m.user ? m.user : m)

              // Force Vue Reactivity to update the UI
              this.workspaces[index] = { 
                ...this.workspaces[index], 
                members: freshMembers 
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to refresh workspace members:', error)
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