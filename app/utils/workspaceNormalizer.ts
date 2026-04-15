import type { Workspace, WorkspaceMember } from '~/types/workspace'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? value as UnknownRecord : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asWorkspaceMember(value: unknown): WorkspaceMember {
  const record = asRecord(value)
  const nestedUser = asRecord(record.user)

  return {
    id: asString(record.id) || asString(record._id) || asString(record.user_id) || asString(nestedUser.id) || asString(nestedUser._id),
    _id: asString(record._id) || undefined,
    user_id: asString(record.user_id) || undefined,
    name: asString(record.name) || asString(nestedUser.name),
    email: asString(record.email) || asString(nestedUser.email),
    is_active: typeof record.is_active === 'boolean' ? record.is_active : (typeof nestedUser.is_active === 'boolean' ? nestedUser.is_active : true),
    access_token: typeof record.access_token === 'string'
      ? record.access_token
      : (typeof nestedUser.access_token === 'string' ? nestedUser.access_token : null),
    created_at: asString(record.created_at) || asString(nestedUser.created_at) || undefined,
    updated_at: asString(record.updated_at) || asString(nestedUser.updated_at) || undefined
  }
}

export function normalizeWorkspace(workspace: unknown): Workspace {
  const record = asRecord(workspace)
  const members = Array.isArray(record.members)
    ? record.members
    : Array.isArray(record.users)
      ? record.users
      : []

  return {
    id: asString(record.id) || asString(record._id),
    _id: asString(record._id) || undefined,
    name: asString(record.name),
    description: asString(record.description),
    creator_id: asString(record.creator_id),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    members: members.map(member => asWorkspaceMember(member))
  }
}

export function extractWorkspaces(payload: unknown): Workspace[] {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const items = Array.isArray(record.data)
    ? record.data
    : Array.isArray(data.workspaces)
      ? data.workspaces
      : (record.data && typeof record.data === 'object' ? [record.data] : [])

  return items.map(item => normalizeWorkspace(item))
}

export function extractWorkspace(payload: unknown, workspaceId?: string): Workspace | null {
  const record = asRecord(payload)
  const data = asRecord(record.data)

  if (Array.isArray(record.data)) {
    const match = record.data.find((item) => {
      const itemRecord = asRecord(item)
      const id = asString(itemRecord.id) || asString(itemRecord._id)
      return workspaceId ? id === workspaceId : Boolean(id)
    })

    return match ? normalizeWorkspace(match) : null
  }

  const workspace = data.workspace ?? record.data ?? payload
  const normalized = normalizeWorkspace(workspace)
  return normalized.id ? normalized : null
}
