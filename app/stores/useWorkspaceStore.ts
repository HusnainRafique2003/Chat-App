import { defineStore } from 'pinia'
import {
  addWorkspaceMemberRequest,
  createWorkspaceRequest,
  deleteWorkspaceRequest,
  fetchAvailableWorkspaceMembersRequest,
  getWorkspaceRequest,
  getWorkspacesRequest,
  removeWorkspaceMemberRequest,
  searchWorkspaceMembersRequest,
  updateWorkspaceRequest
} from '~/services/workspaceService'
import type { Workspace } from '~/types/workspace'
import { extractWorkspace, extractWorkspaces } from '~/utils/workspaceNormalizer'

interface StoreMemberRecord {
  id?: string
  _id?: string
  user_id?: string
  name?: string
  email?: string
  avatar?: string
  user?: {
    name?: string
    email?: string
  }
}

interface MemberListPayload {
  data?: StoreMemberRecord[] | {
    members?: StoreMemberRecord[]
    available_members?: StoreMemberRecord[]
  }
  available_members?: StoreMemberRecord[]
}

interface State {
  workspaces: Workspace[]
  loading: boolean
  currentWorkspaceId: string | null
}

interface WorkspacePayload {
  success?: boolean
  message?: string
}

let workspaceListRequest: Promise<void> | null = null
const workspaceMembersRequests = new Map<string, Promise<void>>()

export const useWorkspaceStore = defineStore('workspace-data', {
  state: (): State => ({
    workspaces: [],
    loading: false,
    currentWorkspaceId: null
  }),
  persist: {
    pick: ['currentWorkspaceId']
  },
  getters: {
    currentWorkspace: state => state.workspaces.find(workspace => workspace.id === state.currentWorkspaceId)
  },

  actions: {
    async fetchWorkspaces() {
      if (this.loading && workspaceListRequest) {
        await workspaceListRequest
        return
      }

      this.loading = true

      workspaceListRequest = (async () => {
        const result = await getWorkspacesRequest()
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch workspaces')
        }

        const payload = result.data?.data
        this.workspaces = extractWorkspaces(payload)

        if (this.workspaces.length > 0 && !this.currentWorkspaceId) {
          this.currentWorkspaceId = this.workspaces[0]?.id || null
        }
      })()

      try {
        await workspaceListRequest
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      } finally {
        workspaceListRequest = null
        this.loading = false
      }
    },

    async refreshWorkspaceMembers(workspaceId: string) {
      const existingRequest = workspaceMembersRequests.get(workspaceId)
      if (existingRequest) {
        await existingRequest
        return
      }

      const request = (async () => {
        const result = await getWorkspaceRequest(workspaceId)
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch workspace')
        }

        const workspace = extractWorkspace(result.data?.data, workspaceId)
        if (!workspace) {
          return
        }

        const index = this.workspaces.findIndex(item => item.id === workspaceId || item._id === workspaceId)
        if (index > -1) {
          this.workspaces[index] = {
            ...this.workspaces[index],
            members: workspace.members
          }
        }
      })()

      workspaceMembersRequests.set(workspaceId, request)

      try {
        await request
      } catch (error) {
        console.error('Failed to refresh workspace members:', error)
      } finally {
        workspaceMembersRequests.delete(workspaceId)
      }
    },

    async createWorkspace(data: { name: string, description?: string }) {
      this.loading = true

      try {
        const result = await createWorkspaceRequest(data)
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to create workspace' }
        }

        const payload = result.data?.data as WorkspacePayload | undefined
        const workspace = extractWorkspace(result.data?.data)

        if (payload?.success && workspace) {
          this.workspaces.push(workspace)
          this.setCurrentWorkspace(workspace.id)
          return { success: true, workspace }
        }

        return { success: false, error: payload?.message || 'Failed to create workspace' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to create workspace' }
      } finally {
        this.loading = false
      }
    },

    async updateWorkspace(workspaceId: string, data: { name?: string, description?: string }) {
      this.loading = true

      try {
        const result = await updateWorkspaceRequest({ workspace_id: workspaceId, ...data })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to update workspace' }
        }

        const payload = result.data?.data as WorkspacePayload | undefined
        const workspace = extractWorkspace(result.data?.data)

        if (payload?.success && workspace) {
          const index = this.workspaces.findIndex(item => item.id === workspaceId || item._id === workspaceId)
          if (index > -1) {
            this.workspaces[index] = { ...this.workspaces[index], ...workspace }
          }

          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to update workspace' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update workspace' }
      } finally {
        this.loading = false
      }
    },

    async deleteWorkspace(workspaceId: string) {
      this.loading = true

      try {
        const result = await deleteWorkspaceRequest({ workspace_id: workspaceId })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to delete workspace' }
        }

        const payload = result.data?.data as WorkspacePayload | undefined
        if (payload?.success) {
          this.workspaces = this.workspaces.filter(item => item.id !== workspaceId && item._id !== workspaceId)

          if (this.currentWorkspaceId === workspaceId) {
            this.currentWorkspaceId = this.workspaces[0]?.id || this.workspaces[0]?._id || null
          }

          return { success: true }
        }

        return { success: false, error: payload?.message || 'Failed to delete workspace' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete workspace' }
      } finally {
        this.loading = false
      }
    },

    async searchMembers(workspaceId: string, query: string) {
      try {
        const result = await searchWorkspaceMembersRequest(workspaceId, query)
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to search members', members: [] }
        }

        const payload = result.data as MemberListPayload
        const source = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.members)
            ? payload.data.members
            : []

        const members = source.map(member => ({
          id: member.id || member._id || member.user_id,
          name: member.name || member.user?.name || 'Unknown',
          email: member.email || member.user?.email || '',
          avatar: member.avatar
        }))

        return { success: true, members }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to search members', members: [] }
      }
    },

    async fetchAvailableMembers(workspaceId: string) {
      try {
        const result = await fetchAvailableWorkspaceMembersRequest(workspaceId)
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to fetch available members', members: [] }
        }

        const payload = result.data as MemberListPayload
        const source = Array.isArray(payload?.data?.available_members)
          ? payload.data.available_members
          : Array.isArray(payload?.available_members)
            ? payload.available_members
            : Array.isArray(payload?.data)
              ? payload.data
              : []

        const members = source.map(member => ({
          id: member.id || member._id || member.user_id,
          name: member.name || 'Unknown User',
          email: member.email || ''
        }))

        return { success: true, members }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch available members', members: [] }
      }
    },

    async addMembers(workspaceId: string, userIds: string[]) {
      try {
        const result = await addWorkspaceMemberRequest({ workspace_id: workspaceId, user_ids: userIds })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to add workspace member' }
        }

        await this.refreshWorkspaceMembers(workspaceId)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add workspace member' }
      }
    },

    async removeMembers(workspaceId: string, userIds: string[]) {
      try {
        const result = await removeWorkspaceMemberRequest({ workspace_id: workspaceId, user_ids: userIds })
        if (!result.success) {
          return { success: false, error: result.message || 'Failed to remove workspace member' }
        }

        await this.refreshWorkspaceMembers(workspaceId)
        return { success: true }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to remove workspace member' }
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
