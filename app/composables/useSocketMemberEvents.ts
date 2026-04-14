import { useSocket } from './useSocket'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useTeamStore } from '~/stores/useTeamStore'
import { useChannelStore } from '~/stores/useChannelStore'
import { useUserStore } from '~/stores/useUserStore'

/**
 * Initialize all socket event listeners for real-time member updates
 * Should be called once in the main layout or dashboard
 */
export function useSocketMemberEvents() {
  const { on } = useSocket()
  const workspaceStore = useWorkspaceStore()
  const teamStore = useTeamStore()
  const channelStore = useChannelStore()
  const userStore = useUserStore()

  /**
   * When a member is removed from a workspace
   */
  function setupWorkspaceMemberRemovedListener() {
    on('workspace_member_removed', async (data) => {
      console.log('[Socket] Workspace member removed:', data)
      
      const { userId, workspaceId } = data
      
      if (workspaceStore.currentWorkspaceId === workspaceId) {
        // If current user was removed, refresh workspace list
        if (userId === userStore.user?.id) {
          await workspaceStore.fetchWorkspaces()
        } else {
          // Refresh the current workspace members
          await workspaceStore.refreshWorkspaceMembers(workspaceId)
        }
      }
    })
  }

  /**
   * When a member is invited to a workspace
   */
  function setupWorkspaceMemberInvitedListener() {
    on('workspace_member_invited', async (data) => {
      console.log('[Socket] Workspace member invited:', data)
      
      const { userId, workspaceId, role } = data
      
      if (workspaceStore.currentWorkspaceId === workspaceId) {
        // Refresh workspace members to include the newly invited user
        await workspaceStore.refreshWorkspaceMembers(workspaceId)
      }

      // Optionally, if the current user was invited, add the workspace to their list
      if (userId === userStore.user?.id) {
        await workspaceStore.fetchWorkspaces()
      }
    })
  }

  /**
   * When a member is added to a team
   */
  function setupTeamMemberAddedListener() {
    on('team_member_added', async (data) => {
      console.log('[Socket] Team member added:', data)
      
      const { userId, teamId } = data
      
      if (teamStore.currentTeamId === teamId) {
        // Refresh the team to get updated member list
        const team = teamStore.teams.find(t => t.id === teamId)
        if (team) {
          // Re-fetch teams for the current workspace to get updated member count
          await teamStore.fetchTeams(team.workspace_id)
        }
      }
    })
  }

  /**
   * When a member is removed from a team
   */
  function setupTeamMemberRemovedListener() {
    on('team_member_removed', async (data) => {
      console.log('[Socket] Team member removed:', data)
      
      const { userId, teamId } = data
      
      if (teamStore.currentTeamId === teamId) {
        const team = teamStore.teams.find(t => t.id === teamId)
        if (team) {
          // If current user was removed from team, refresh team list
          if (userId === userStore.user?.id) {
            await teamStore.fetchTeams(team.workspace_id)
          } else {
            // Just refresh the member count
            await teamStore.fetchTeams(team.workspace_id)
          }
        }
      }
    })
  }

  /**
   * When a member is added to a channel
   */
  function setupChannelMemberAddedListener() {
    on('channel_member_added', async (data) => {
      console.log('[Socket] Channel member added:', data)
      
      const { userId, channelId } = data
      
      const channel = channelStore.channels.find(c => c.id === channelId)
      if (channel) {
        // Refresh channels to get updated member list
        await channelStore.fetchChannels(channel.team_id, channel.workspace_id)
      }
    })
  }

  /**
   * When a member is removed from a channel
   */
  function setupChannelMemberRemovedListener() {
    on('channel_member_removed', async (data) => {
      console.log('[Socket] Channel member removed:', data)
      
      const { userId, channelId } = data
      
      const channel = channelStore.channels.find(c => c.id === channelId)
      if (channel) {
        // If current user was removed from channel, remove it from the list
        if (userId === userStore.user?.id) {
          channelStore.channels = channelStore.channels.filter(c => c.id !== channelId)
          // Reset current channel if it was removed
          if (channelStore.currentChannelId === channelId) {
            channelStore.currentChannelId = channelStore.channels[0]?.id || null
          }
        } else {
          // Just refresh the channels to update member list
          await channelStore.fetchChannels(channel.team_id, channel.workspace_id)
        }
      }
    })
  }

  /**
   * Initialize all listeners
   */
  function initialize() {
    setupWorkspaceMemberRemovedListener()
    setupWorkspaceMemberInvitedListener()
    setupTeamMemberAddedListener()
    setupTeamMemberRemovedListener()
    setupChannelMemberAddedListener()
    setupChannelMemberRemovedListener()

    console.log('[Socket] Member event listeners initialized')
  }

  return {
    initialize,
    setupWorkspaceMemberRemovedListener,
    setupWorkspaceMemberInvitedListener,
    setupTeamMemberAddedListener,
    setupTeamMemberRemovedListener,
    setupChannelMemberAddedListener,
    setupChannelMemberRemovedListener
  }
}
