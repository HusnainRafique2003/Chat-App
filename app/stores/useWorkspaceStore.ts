import { defineStore } from 'pinia'
import type { ApiUser } from '~/stores/useUserStore'
import {
  addMembersToWorkspace,
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  removeMembersFromWorkspace,
  updateWorkspace
} from '~/composables/useWorkspacesApi'

export interface Workspace {
  id: string
  name: string
  description: string
  creator_id: string
  created_at: string
  updated_at: string
  members: ApiUser[]
}

export interface WorkspacePayload {
  workspace_id?: string
  name: string
  description: string
}

interface State {
  workspaces: Workspace[]
  loading: boolean
  currentWorkspaceId: string | null
}

export const useWorkspaceStore = defineStore('workspace-data', {
state: (): State => ({
    workspaces: [{
      id: 'demo-workspace',
      name: 'Demo Workspace',
      description: 'Development preview workspace for testing dashboard.',
      creator_id: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: []
    }],
    loading: false,
    currentWorkspaceId: 'demo-workspace',
  }),

  getters: {
    currentWorkspace: (state) => state.workspaces.find(w => w.id === state.currentWorkspaceId),
  },

  actions: {
async fetchWorkspaces() {
      this.loading = true
      try {
        const response = await getWorkspaces()
        const data = response.data
        console.log('Workspaces response:', data)
        if (data.success) {
          this.workspaces = data.data.workspaces || []
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

async createWorkspace(form: WorkspacePayload) {
      this.loading = true
      try {
        const response = await createWorkspace({ name: form.name, description: form.description })
        const data = response.data
        if (data.success) {
          this.workspaces.push(data.data.workspace)
          this.currentWorkspaceId = data.data.workspace?.id || null
          return { success: true }
        }
      } catch (error: any) {
        console.error('Create workspace failed:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async updateWorkspace(form: WorkspacePayload) {
      this.loading = true
      try {
        const response = await updateWorkspace({ workspace_id: form.workspace_id!, name: form.name, description: form.description })
        const data = response.data
        if (data.success) {
          const index = this.workspaces.findIndex(w => w.id === form.workspace_id)
          if (index > -1) {
            this.workspaces[index] = data.data.workspace
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Update workspace failed:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async deleteWorkspace(workspace_id: string) {
      this.loading = true
      try {
        const response = await deleteWorkspace({ workspace_id })
        const data = response.data
        if (data.success) {
          this.workspaces = this.workspaces.filter(w => w.id !== workspace_id)
          if (this.currentWorkspaceId === workspace_id) {
            this.currentWorkspaceId = this.workspaces[0]?.id || null
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Delete workspace failed:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async addMembers(workspace_id: string, user_ids: string[]) {
      this.loading = true
      try {
        const response = await addMembersToWorkspace({ workspace_id, user_ids })
        const data = response.data
        if (data.success) {
          const index = this.workspaces.findIndex(w => w.id === workspace_id)
          if (index > -1) {
            this.workspaces[index] = data.data.workspace
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Add members failed:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async removeMembers(workspace_id: string, user_ids: string[]) {
      this.loading = true
      try {
        const response = await removeMembersFromWorkspace({ workspace_id, user_ids })
        const data = response.data
        if (data.success) {
          const index = this.workspaces.findIndex(w => w.id === workspace_id)
          if (index > -1) {
            const workspace = this.workspaces[index]

            if (workspace) {
              workspace.members = workspace.members.filter(member => !user_ids.includes(member.id))
            }
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Remove members failed:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    setCurrentWorkspace(id: string) {
      this.currentWorkspaceId = id
    },

    clearCurrentWorkspace() {
      this.currentWorkspaceId = null
    },
  },
})
