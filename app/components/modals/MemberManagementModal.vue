<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import { useChannelStore } from '~/stores/useChannelStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import type { Channel } from '~/types/channel'
import type { WorkspaceMember } from '~/types/workspace'

interface MemberData {
  user_id: string
  name: string
  email: string
  role: string
  avatar?: string
}

interface Props {
  channelId: string
  channelName: string
  members: MemberData[]
}

const props = defineProps<Props>()
const open = defineModel<boolean>('open', { default: false })

const channelStore = useChannelStore()
const workspaceStore = useWorkspaceStore()
const userStore = useUserStore()
const toast = useToast()

const searchQuery = ref('')
const addingMemberId = ref<string | null>(null)
const removingMemberId = ref<string | null>(null)

const isSearching = ref(false)
const searchResults = ref<Array<{ id: string, name: string, email: string, avatar?: string }>>([])

type LegacyUser = { _id?: string }
type LegacyChannel = Channel & {
  creator_id?: string
  created_by?: string
  owner_id?: string
  user_id?: string
}
type WorkspaceMemberRecord = WorkspaceMember & {
  user?: {
    name?: string
    email?: string
  }
}

// Get the current user's ID
const currentUserId = computed(() => {
  const currentUser = userStore.user as (typeof userStore.user & LegacyUser)
  return currentUser?.id || currentUser?._id || ''
})

// Helper to reliably identify the channel creator from any ID
function isCreator(userId: string) {
  const c = channelStore.currentChannel as LegacyChannel | undefined
  if (!c) return false
  return c.created_id === userId
    || c.creator_id === userId
    || c.created_by === userId
    || c.owner_id === userId
    || c.user_id === userId
}

// Check if the currently logged-in user is the creator
const isCurrentUserCreator = computed(() => {
  if (!currentUserId.value) return false
  return isCreator(currentUserId.value)
})

// Get all workspace members not in the channel (fallback)
const allAvailableMembers = computed(() => {
  const workspaceMembers = workspaceStore.currentWorkspace?.members || []
  const currentMemberIds = new Set(props.members.map(m => m.user_id))

  return workspaceMembers
    .filter((member: WorkspaceMemberRecord) => {
      const memberId = member.id || member._id || member.user_id
      return !currentMemberIds.has(memberId) && memberId !== currentUserId.value
    })
    .map((member: WorkspaceMemberRecord) => ({
      id: member.id || member._id || member.user_id,
      name: member.name || member.user?.name || 'Unknown',
      email: member.email || member.user?.email || '',
      avatar: member.avatar
    }))
})

// Show search results if available, otherwise show all available members
const filteredMembers = computed(() => {
  if (searchQuery.value.trim() && searchResults.value.length > 0) {
    return searchResults.value
  }

  if (!searchQuery.value.trim()) {
    return allAvailableMembers.value
  }

  return []
})

const currentMembers = computed(() => props.members)

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

const getAvatarColor = (index: number) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-red-500'
  ]
  return colors[index % colors.length]
}

// Search for members in database
async function performSearch(query: string) {
  if (!query.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const workspaceId = workspaceStore.currentWorkspaceId
    if (!workspaceId) {
      toast.add({
        title: 'Error',
        description: 'Workspace ID not available',
        color: 'error'
      })
      return
    }

    const response = await workspaceStore.searchMembers(workspaceId, query)
    if (!response.success) {
      searchResults.value = []
      return
    }

    const currentMemberIds = new Set(props.members.map(m => m.user_id))
    searchResults.value = response.members.filter(member => !currentMemberIds.has(member.id) && member.id !== currentUserId.value)
  } catch (error) {
    console.error('Search error:', error)
    // Fallback to local filtering if search fails
    const queryLower = query.toLowerCase()
    searchResults.value = allAvailableMembers.value.filter(m =>
      m.name.toLowerCase().includes(queryLower)
      || m.email.toLowerCase().includes(queryLower)
    )
  } finally {
    isSearching.value = false
  }
}

async function addMember(userId: string) {
  if (!props.channelId) {
    toast.add({
      title: 'Error',
      description: 'Channel ID is not available',
      color: 'error'
    })
    return
  }

  addingMemberId.value = userId
  try {
    const response = await channelStore.addMember(props.channelId, userId)

    if (response.success) {
      toast.add({
        title: 'Member added',
        description: 'Member has been added to the channel',
        color: 'success'
      })
      searchQuery.value = ''
      searchResults.value = []
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Failed to add member',
        color: 'error'
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to add member'
    toast.add({
      title: 'Error',
      description: errorMsg,
      color: 'error'
    })
    console.error('Error adding member:', error)
  } finally {
    addingMemberId.value = null
  }
}

async function removeMember(userId: string) {
  if (!props.channelId) {
    toast.add({
      title: 'Error',
      description: 'Channel ID is not available',
      color: 'error'
    })
    return
  }

  removingMemberId.value = userId
  try {
    const response = await channelStore.removeMember(props.channelId, userId)

    if (response.success) {
      toast.add({
        title: 'Member removed',
        description: 'Member has been removed from the channel',
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Failed to remove member',
        color: 'error'
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to remove member'
    toast.add({
      title: 'Error',
      description: errorMsg,
      color: 'error'
    })
    console.error('Error removing member:', error)
  } finally {
    removingMemberId.value = null
  }
}

// === NEW: Leave Channel Function ===
async function leaveChannel(userId: string) {
  if (!props.channelId) return

  removingMemberId.value = userId
  try {
    const response = await channelStore.removeMember(props.channelId, userId)

    if (response.success) {
      toast.add({
        title: 'Left channel',
        description: 'You have successfully left the channel.',
        color: 'success'
      })

      open.value = false // Close the modal immediately

      // If they left the channel they are currently viewing, clear it from the UI
      if (channelStore.currentChannelId === props.channelId) {
        channelStore.clearCurrentChannel()
      }

      // Refresh the channel list so it disappears from their sidebar
      const channel = channelStore.channels.find(c => c.id === props.channelId)
      if (channel) {
        await channelStore.fetchChannels(channel.team_id, channel.workspace_id)
      }
    } else {
      toast.add({
        title: 'Error',
        description: response.error || 'Failed to leave channel',
        color: 'error'
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to leave channel'
    toast.add({
      title: 'Error',
      description: errorMsg,
      color: 'error'
    })
  } finally {
    removingMemberId.value = null
  }
}

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (newQuery) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    performSearch(newQuery)
  }, 300)
})

watch(open, (newVal) => {
  if (newVal) {
    searchQuery.value = ''
    searchResults.value = []
  }
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="isCurrentUserCreator ? `Manage Members - ${channelName}` : `View Members - ${channelName}`"
    icon="i-mdi-account-multiple"
    icon-color="primary"
    :hide-footer="true"
    @cancel="open = false"
  >
    <div class="flex flex-col gap-4">
      <div
        v-if="isCurrentUserCreator"
        class="shrink-0"
      >
        <label class="block text-sm font-medium text-[var(--ui-text)]">Search Members</label>
        <div class="relative mt-2">
          <UInput
            v-model="searchQuery"
            type="search"
            placeholder="Search by name or email..."
          >
            <template #leading>
              <UIcon
                name="i-lucide-search"
                class="h-4 w-4"
              />
            </template>
          </UInput>
          <div
            v-if="isSearching"
            class="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <UIcon
              name="i-lucide-loader"
              class="h-4 w-4 animate-spin text-[var(--ui-primary)]"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div
          v-if="isCurrentUserCreator"
          class="flex flex-col gap-3"
        >
          <div v-if="searchQuery || filteredMembers.length > 0">
            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-3">
              {{ searchQuery ? `Search Results (${filteredMembers.length})` : `Available Members (${filteredMembers.length})` }}
            </h3>
            <div class="space-y-2 max-h-[28vh] overflow-y-auto pr-2 pb-1 [scrollbar-width:thin]">
              <div
                v-for="(member, index) in filteredMembers"
                :key="member.id"
                class="flex items-center justify-between p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] hover:bg-[var(--ui-bg-muted)]/80 transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                    :class="getAvatarColor(index)"
                  >
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-[var(--ui-text)] truncate">
                      {{ member.name }}
                    </p>
                    <p class="text-xs text-[var(--ui-text-muted)] truncate">
                      {{ member.email }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  :disabled="addingMemberId !== null"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--ui-primary)] text-white text-xs font-medium hover:bg-[var(--ui-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="addMember(member.id)"
                >
                  <span v-if="addingMemberId !== member.id">Add</span>
                  <UIcon
                    v-else
                    name="i-lucide-loader"
                    class="h-3 w-3 animate-spin"
                  />
                </button>
              </div>
              <p
                v-if="searchQuery && filteredMembers.length === 0 && !isSearching"
                class="text-sm text-[var(--ui-text-muted)] text-center py-4"
              >
                No members found
              </p>
            </div>
          </div>
          <div
            v-else
            class="text-sm text-[var(--ui-text-muted)] py-4 text-center"
          >
            All workspace members are already added
          </div>
        </div>

        <div
          class="flex flex-col gap-3"
          :class="{ 'border-t border-[var(--ui-border)] pt-4': isCurrentUserCreator }"
        >
          <h3 class="text-sm font-semibold text-[var(--ui-text)] shrink-0">
            Channel Members ({{ currentMembers.length }})
          </h3>

          <div
            class="space-y-2 overflow-y-auto pr-2 pb-1 [scrollbar-width:thin]"
            :class="isCurrentUserCreator ? 'max-h-[35vh]' : 'max-h-[50vh]'"
          >
            <div
              v-for="(member, index) in currentMembers"
              :key="member.user_id"
              class="flex items-center justify-between p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                  :class="getAvatarColor(index)"
                >
                  {{ getInitials(member.name) }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-[var(--ui-text)] truncate">
                      {{ member.name }}
                    </p>
                    <span
                      v-if="isCreator(member.user_id)"
                      class="shrink-0 rounded-full bg-[var(--ui-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--ui-primary)]"
                    >Creator</span>
                  </div>
                  <p class="text-xs text-[var(--ui-text-muted)] truncate">
                    {{ member.email }}
                  </p>
                </div>
              </div>

              <button
                v-if="isCurrentUserCreator && !isCreator(member.user_id)"
                type="button"
                :disabled="removingMemberId !== null"
                class="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="removeMember(member.user_id)"
              >
                <span v-if="removingMemberId !== member.user_id">Remove</span>
                <UIcon
                  v-else
                  name="i-lucide-loader"
                  class="h-3 w-3 animate-spin"
                />
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="!isCurrentUserCreator"
          class="pt-4 border-t border-[var(--ui-border)] flex justify-end"
        >
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-log-out"
            label="Leave Channel"
            :loading="removingMemberId === currentUserId"
            class="transition-transform duration-300 hover:-translate-y-0.5 cursor-pointer"
            @click="leaveChannel(currentUserId)"
          />
        </div>
      </div>
    </div>
  </BaseModal>
</template>
