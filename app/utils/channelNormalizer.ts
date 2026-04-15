import type { Channel, ChannelMember } from '~/types/channel'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? value as UnknownRecord : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeChannelMember(member: unknown): ChannelMember {
  const record = asRecord(member)

  return {
    user_id: asString(record.user_id) || asString(record.id) || asString(record._id),
    role: asString(record.role),
    id: asString(record.id) || undefined,
    _id: asString(record._id) || undefined
  }
}

export function normalizeChannel(channel: unknown, defaults?: { workspaceId?: string, teamId?: string }): Channel {
  const record = asRecord(channel)
  const members = Array.isArray(record.members) ? record.members : []
  const typeValue = asString(record.type, 'public')
  const type = typeValue === 'private' || typeValue === 'direct' ? typeValue : 'public'

  return {
    id: asString(record.id) || asString(record._id),
    _id: asString(record._id) || undefined,
    name: asString(record.name),
    description: asString(record.description) || undefined,
    workspace_id: asString(record.workspace_id) || defaults?.workspaceId || '',
    team_id: asString(record.team_id) || defaults?.teamId || '',
    type,
    direct_id: null,
    created_id: asString(record.created_id),
    members: members.map(member => normalizeChannelMember(member)),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    direct_user_id: asString(record.direct_user_id) || undefined,
    user_id: asString(record.user_id) || undefined
  }
}

export function extractChannels(payload: unknown, defaults?: { workspaceId?: string, teamId?: string }): Channel[] {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const items = Array.isArray(record.data)
    ? record.data
    : Array.isArray(data.channels)
      ? data.channels
      : Array.isArray(data.data)
        ? data.data
        : []

  return items.map(item => normalizeChannel(item, defaults))
}

export function extractChannel(payload: unknown, defaults?: { workspaceId?: string, teamId?: string }): Channel | null {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const channel = data.channel ?? record.channel ?? record.data ?? payload
  const normalized = normalizeChannel(channel, defaults)

  return normalized.id ? normalized : null
}
