export interface WorkspaceMember {
  id: string
  _id?: string
  user_id?: string
  name: string
  email: string
  is_active: boolean
  access_token: string | null
  created_at?: string
  updated_at?: string
}

export interface Workspace {
  id: string
  _id?: string
  name: string
  description: string
  creator_id: string
  created_at: string
  updated_at: string
  members: WorkspaceMember[]
}

export interface CreateWorkspaceParams {
  name: string
  description?: string
}

export interface UpdateWorkspaceParams {
  workspace_id: string
  name?: string
  description?: string
}

export interface DeleteWorkspaceParams {
  workspace_id: string
}

export interface WorkspaceMembersParams {
  workspace_id: string
  user_ids: string[]
}
