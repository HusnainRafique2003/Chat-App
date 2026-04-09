<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import { useChannelStore } from '~/stores/useChannelStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import { addChannelMember, removeChannelMember } from '~/composables/useChannelsApi'
import { searchWorkspaceMembers } from '~/composables/useWorkspacesApi'

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
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const open = defineModel<boolean>('open', { default: false })

const channelStore = useChannelStore()
const workspaceStore = useWorkspaceStore()
const userStore = useUserStore()
const toast = useToast()

const searchQuery = ref('')
const isAddingMember = ref(false)
const isRemovingMember = ref(false)
const isSearching = ref(false)
const searchResults = ref<Array<{ id: string; name: string; email: string; avatar?: string }>>([])

// Get all workspace members not in the channel (fallback)
const allAvailableMembers = computed(() => {
  const workspaceMembers = workspaceStore.currentWorkspace?.members || []
  const currentMemberIds = new Set(props.members.map(m => m.user_id))
  const currentUserId = userStore.user?.id || (userStore.user as any)?._id

  return workspaceMembers
    .filter((member: any) => {
      const memberId = member.id || member._id || member.user_id
      return !currentMemberIds.has(memberId) && memberId !== currentUserId
    })
    .map((member: any) => ({
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
    'bg-red-500',
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

    const response = await searchWorkspaceMembers(workspaceId, query)
    
    if (response.data?.success || response.data?.data) {
      let results = Array.isArray(response.data?.data) ? response.data.data : response.data?.data?.members || []
      
      // Filter out current members
      const currentMemberIds = new Set(props.members.map(m => m.user_id))
      const currentUserId = userStore.user?.id || (userStore.user as any)?._id
      
      results = results.filter((member: any) => {
        const memberId = member.id || member._id || member.user_id
        return !currentMemberIds.has(memberId) && memberId !== currentUserId
      })
      
      // Normalize the results
      searchResults.value = results.map((member: any) => ({
        id: member.id || member._id || member.user_id,
        name: member.name || member.user?.name || 'Unknown',
        email: member.email || member.user?.email || '',
        avatar: member.avatar
      }))
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('Search error:', error)
    // Fallback to local filtering if search fails
    const query_lower = query.toLowerCase()
    searchResults.value = allAvailableMembers.value.filter(m =>
      m.name.toLowerCase().includes(query_lower) ||
      m.email.toLowerCase().includes(query_lower)
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

  isAddingMember.value = true
  try {
    const response = await addChannelMember({
      channel_id: props.channelId,
      user_id: userId
    })

    if (response.data?.success || response.status === 200) {
      toast.add({
        title: 'Member added',
        description: 'Member has been added to the channel',
        color: 'success'
      })
      searchQuery.value = ''
      searchResults.value = []
      // Refresh the channel to update members list
      const channel = channelStore.currentChannel
      if (channel?.id) {
        await channelStore.fetchChannels(channel.team_id, channel.workspace_id)
      }
    } else {
      toast.add({
        title: 'Error',
        description: response.data?.message || 'Failed to add member',
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
    isAddingMember.value = false
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

  isRemovingMember.value = true
  try {
    const response = await removeChannelMember({
      channel_id: props.channelId,
      user_id: userId
    })

    if (response.data?.success || response.status === 200) {
      toast.add({
        title: 'Member removed',
        description: 'Member has been removed from the channel',
        color: 'success'
      })
      // Refresh the channel to update members list
      const channel = channelStore.currentChannel
      if (channel?.id) {
        await channelStore.fetchChannels(channel.team_id, channel.workspace_id)
      }
    } else {
      toast.add({
        title: 'Error',
        description: response.data?.message || 'Failed to remove member',
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
    isRemovingMember.value = false
  }
}

// Debounce search
let searchTimeout: any
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout)
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
    :title="`Manage Members - ${channelName}`"
    icon="i-mdi-account-multiple"
    icon-color="primary"
    @cancel="open = false"
  >
    <div class="flex flex-col gap-4 max-h-[600px] overflow-hidden">
      <!-- Search Bar -->
      <div>
        <label class="block text-sm font-medium text-[var(--ui-text)]">Search Members</label>
        <div class="relative mt-2">
          <UInput
            v-model="searchQuery"
            type="search"
            placeholder="Search by name or email..."
          >
            <template #leading>
              <UIcon name="i-lucide-search" class="h-4 w-4" />
            </template>
          </UInput>
          <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
            <UIcon name="i-lucide-loader" class="h-4 w-4 animate-spin text-[var(--ui-primary)]" />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6 min-h-0 overflow-hidden">
        <!-- Add Members Section -->
        <div class="flex flex-col gap-3 overflow-y-auto min-h-0">
          <div v-if="searchQuery || filteredMembers.length > 0">
            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-3 sticky top-0 bg-[var(--ui-bg)] py-1">
              {{ searchQuery ? `Search Results (${filteredMembers.length})` : `Available Members (${filteredMembers.length})` }}
            </h3>
            <div class="space-y-2">
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
                    <p class="text-sm font-medium text-[var(--ui-text)] truncate">{{ member.name }}</p>
                    <p class="text-xs text-[var(--ui-text-muted)] truncate">{{ member.email }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="addMember(member.id)"
                  :disabled="isAddingMember"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--ui-primary)] text-white text-xs font-medium hover:bg-[var(--ui-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!isAddingMember">Add</span>
                  <UIcon v-else name="i-lucide-loader" class="h-3 w-3 animate-spin" />
                </button>
              </div>
              <p v-if="searchQuery && filteredMembers.length === 0 && !isSearching" class="text-sm text-[var(--ui-text-muted)] text-center py-4">
                No members found
              </p>
            </div>
          </div>
          <div v-else class="text-sm text-[var(--ui-text-muted)] py-4 text-center">
            All workspace members are already added
          </div>
        </div>

        <!-- Current Members Section -->
        <div class="flex flex-col gap-3 border-t border-[var(--ui-border)] pt-4">
          <h3 class="text-sm font-semibold text-[var(--ui-text)]">
            Channel Members ({{ currentMembers.length }})
          </h3>
          <div class="space-y-2 max-h-56 overflow-y-auto">
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
                  <p class="text-sm font-medium text-[var(--ui-text)] truncate">{{ member.name }}</p>
                  <p class="text-xs text-[var(--ui-text-muted)] truncate">{{ member.email }}</p>
                </div>
              </div>
              <button
                type="button"
                @click="removeMember(member.user_id)"
                :disabled="isRemovingMember"
                class="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!isRemovingMember">Remove</span>
                <UIcon v-else name="i-lucide-loader" class="h-3 w-3 animate-spin" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
