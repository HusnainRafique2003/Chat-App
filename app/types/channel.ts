export interface ChannelMember {
  user_id: string
  role: string
  id?: string
  _id?: string
}

export interface Channel {
  id: string
  _id?: string
  name: string
  description?: string
  workspace_id: string
  team_id: string
  type: 'public' | 'private' | 'direct'
  direct_id: null
  created_id: string
  members: ChannelMember[]
  created_at: string
  updated_at: string
  direct_user_id?: string
  user_id?: string
}

export interface CreateChannelParams {
  name: string
  workspace_id: string
  team_id?: string
  type: 'public' | 'private' | 'direct'
  direct_user_id?: string
  user_id?: string
  members?: string[]
  description?: string
}

export interface UpdateChannelParams {
  channel_id: string
  name?: string
  type?: string
}

export interface DeleteChannelParams {
  channel_id: string
}

export interface ChannelMemberParams {
  channel_id: string
  user_id: string
}
