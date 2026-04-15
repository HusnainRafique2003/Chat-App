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

export interface CreateTeamParams {
  workspace_id: string
  name: string
  description?: string
  color?: string
}

export interface UpdateTeamParams {
  team_id: string
  name?: string
  description?: string
  color?: string
}

export interface DeleteTeamParams {
  team_id: string
}

export interface TeamMembersParams {
  team_id: string
  workspace_id: string
  user_ids: string[]
}
