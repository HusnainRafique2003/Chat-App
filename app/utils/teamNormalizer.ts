import type { Team, TeamMember } from '~/types/team'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? value as UnknownRecord : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeTeamMember(member: unknown): TeamMember {
  const record = asRecord(member)

  return {
    user_id: asString(record.user_id) || asString(record.id) || asString(record._id),
    role: asString(record.role)
  }
}

export function normalizeTeam(team: unknown): Team {
  const record = asRecord(team)
  const members = Array.isArray(record.members) ? record.members : []

  return {
    id: asString(record.id) || asString(record._id),
    _id: asString(record._id) || undefined,
    name: asString(record.name),
    description: asString(record.description),
    workspace_id: asString(record.workspace_id),
    creator_id: asString(record.creator_id),
    members_count: typeof record.members_count === 'number' ? record.members_count : members.length,
    members: members.map(member => normalizeTeamMember(member)),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at)
  }
}

export function extractTeams(payload: unknown): Team[] {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const items = Array.isArray(record.data)
    ? record.data
    : Array.isArray(data.teams)
      ? data.teams
      : (record.data && typeof record.data === 'object' ? [record.data] : [])

  return items.map(item => normalizeTeam(item))
}

export function extractTeam(payload: unknown): Team | null {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const team = data.team ?? record.team ?? record.data ?? payload
  const normalized = normalizeTeam(team)

  return normalized.id ? normalized : null
}
