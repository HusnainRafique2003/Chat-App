import { defineStore } from 'pinia'
import { getWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace } from '~/composables/useWorkspacesApi'
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
        console.error('Failed to fetch workspaces:', error)
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

    // --- NEW ACTIONS: Create, Update, Delete ---

    async createWorkspace(data: { name: string; description?: string }) {
      this.loading = true
      try {
        const response = await createWorkspace(data)
        const responseData = response.data

        if (responseData.success) {
          const newWorkspace = responseData.data?.workspace || responseData.data || responseData.workspace
          if (newWorkspace) {
            newWorkspace.id = newWorkspace.id || newWorkspace._id
            newWorkspace.members = newWorkspace.members || []
            this.workspaces.push(newWorkspace)
            
            // Switch to the newly created workspace
            this.setCurrentWorkspace(newWorkspace.id)
            return { success: true, workspace: newWorkspace }
          }
        }
        return { success: false, error: responseData.message || 'Failed to create workspace' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create workspace' }
      } finally {
        this.loading = false
      }
    },

    async updateWorkspace(workspaceId: string, data: { name?: string; description?: string }) {
      this.loading = true
      try {
        const response = await updateWorkspace({ workspace_id: workspaceId, ...data })
        const responseData = response.data

        if (responseData.success) {
          const updatedWorkspace = responseData.data?.workspace || responseData.data
          if (updatedWorkspace) {
            const index = this.workspaces.findIndex(w => w.id === workspaceId || w._id === workspaceId)
            if (index > -1) {
              // Merge the updated data into the existing state
              this.workspaces[index] = { ...this.workspaces[index], ...updatedWorkspace }
            }
            return { success: true }
          }
        }
        return { success: false, error: responseData.message || 'Failed to update workspace' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update workspace' }
      } finally {
        this.loading = false
      }
    },

    async deleteWorkspace(workspaceId: string) {
      this.loading = true
      try {
        const response = await deleteWorkspace({ workspace_id: workspaceId })
        const responseData = response.data

        if (responseData.success) {
          // Remove from local state
          this.workspaces = this.workspaces.filter(w => w.id !== workspaceId && w._id !== workspaceId)
          
          // If they deleted their active workspace, fallback to the first available one
          if (this.currentWorkspaceId === workspaceId) {
            this.currentWorkspaceId = this.workspaces.length > 0 ? (this.workspaces[0].id || this.workspaces[0]._id as string) : null
          }
          return { success: true }
        }
        return { success: false, error: responseData.message || 'Failed to delete workspace' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete workspace' }
      } finally {
        this.loading = false
      }
    },

    // --- State Management ---

    setCurrentWorkspace(id: string) {
      this.currentWorkspaceId = id
    },

    clearCurrentWorkspace() {
      this.currentWorkspaceId = null
    }
  }
})