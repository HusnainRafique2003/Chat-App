<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '#ui/composables/useToast'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import type { Workspace, WorkspaceMember } from '~/types/workspace'

const props = defineProps<{
  workspaceId: string
  workspaceName: string
}>()

const open = defineModel<boolean>('open', { default: false })

const workspaceStore = useWorkspaceStore()
const userStore = useUserStore()
const toast = useToast()

const searchQuery = ref('')
const addingMemberId = ref<string | null>(null)
const removingMemberId = ref<string | null>(null)
const isLoadingUsers = ref(false)

// We now store the list of specifically available users here
const availableUsers = ref<Array<Pick<WorkspaceMember, 'id' | 'name' | 'email'>>>([])

type LegacyUser = { _id?: string }
type WorkspaceIdentity = Workspace & { created_id?: string, owner_id?: string, user_id?: string }

const currentUserId = computed(() => {
  const currentUser = userStore.user as (typeof userStore.user & LegacyUser)
  return currentUser?.id || currentUser?._id || ''
})

function isCreator(userId: string) {
  const w = workspaceStore.currentWorkspace as WorkspaceIdentity | undefined
  if (!w) return false
  return w.creator_id === userId || w.created_id === userId || w.owner_id === userId || w.user_id === userId
}

const isCurrentUserCreator = computed(() => {
  if (!currentUserId.value) return false
  return isCreator(currentUserId.value)
})

const currentMembers = computed(() => workspaceStore.currentWorkspace?.members || [])

// === SMART LOCAL FILTERING ===
const filteredAvailableUsers = computed(() => {
  return availableUsers.value.filter((user) => {
    // Local Search Filtering
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const name = (user.name || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) {
        return false
      }
    }
    return true
  })
})

const getInitials = (name: string) => name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)

const getAvatarColor = (index: number) => {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500']
  return colors[index % colors.length]
}

// Fetch the available users from the new API endpoint
async function loadAvailableUsers() {
  isLoadingUsers.value = true
  try {
    const result = await workspaceStore.fetchAvailableMembers(props.workspaceId)
    if (!result.success) {
      throw new Error(result.error || 'Could not load available users.')
    }

    availableUsers.value = result.members
  } catch (error) {
    console.error('Failed to fetch available users:', error)
    toast.add({ title: 'Error', description: 'Could not load available users.', color: 'error' })
  } finally {
    isLoadingUsers.value = false
  }
}

async function handleAddMember(userId: string) {
  addingMemberId.value = userId
  try {
    const result = await workspaceStore.addMembers(props.workspaceId, [userId])
    if (!result.success) {
      throw new Error(result.error || 'Failed to add member')
    }

    toast.add({ title: 'Member added to workspace', color: 'success' })

    // Instantly remove them from the available list so the UI updates
    availableUsers.value = availableUsers.value.filter(u => u.id !== userId)
    searchQuery.value = ''

    // Refresh the workspace members list to show them at the bottom
    await workspaceStore.refreshWorkspaceMembers(props.workspaceId)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add member'
    toast.add({ title: 'Error', description: errorMessage, color: 'error' })
  } finally {
    addingMemberId.value = null
  }
}

async function handleRemoveMember(userId: string) {
  removingMemberId.value = userId
  try {
    const result = await workspaceStore.removeMembers(props.workspaceId, [userId])
    if (!result.success) {
      throw new Error(result.error || 'Failed to remove member')
    }

    toast.add({ title: 'Member removed from workspace', color: 'success' })

    // Refresh both lists to keep them perfectly synced
    await loadAvailableUsers()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove member'
    toast.add({ title: 'Error', description: errorMessage, color: 'error' })
  } finally {
    removingMemberId.value = null
  }
}

watch(open, (newVal) => {
  if (newVal) {
    searchQuery.value = ''
    if (isCurrentUserCreator.value) {
      loadAvailableUsers()
    }
    workspaceStore.refreshWorkspaceMembers(props.workspaceId)
  }
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="isCurrentUserCreator ? `Manage Workspace - ${workspaceName}` : `Workspace Members - ${workspaceName}`"
    icon="i-lucide-briefcase"
    icon-color="primary"
    :hide-footer="true"
    @cancel="open = false"
  >
    <div class="flex flex-col gap-4">
      <div
        v-if="isCurrentUserCreator"
        class="shrink-0"
      >
        <label class="block text-sm font-medium text-[var(--ui-text)]">Search Available Users</label>
        <div class="relative mt-2">
          <UInput
            v-model="searchQuery"
            type="search"
            placeholder="Search available users by name or email..."
          >
            <template #leading>
              <UIcon
                name="i-lucide-search"
                class="h-4 w-4"
              />
            </template>
          </UInput>
          <div
            v-if="isLoadingUsers"
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
          <div>
            <h3 class="text-sm font-semibold text-[var(--ui-text)] mb-3">
              Available to Add ({{ filteredAvailableUsers.length }})
            </h3>
            <div class="space-y-2 max-h-[28vh] overflow-y-auto pr-2 pb-1 [scrollbar-width:thin]">
              <div
                v-if="isLoadingUsers && filteredAvailableUsers.length === 0"
                class="text-sm text-[var(--ui-text-muted)] text-center py-4"
              >
                Loading available users...
              </div>

              <div
                v-for="(member, index) in filteredAvailableUsers"
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
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--ui-primary)] text-white text-xs font-medium hover:bg-[var(--ui-primary)]/90 transition-colors disabled:opacity-50"
                  @click="handleAddMember(member.id)"
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
                v-if="!isLoadingUsers && filteredAvailableUsers.length === 0"
                class="text-sm text-[var(--ui-text-muted)] text-center py-4"
              >
                {{ searchQuery ? 'No users matched your search.' : 'No available users to add.' }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col gap-3"
          :class="{ 'border-t border-[var(--ui-border)] pt-4': isCurrentUserCreator }"
        >
          <h3 class="text-sm font-semibold text-[var(--ui-text)] shrink-0">
            Workspace Members ({{ currentMembers.length }})
          </h3>
          <div
            class="space-y-2 overflow-y-auto pr-2 pb-1 [scrollbar-width:thin]"
            :class="isCurrentUserCreator ? 'max-h-[35vh]' : 'max-h-[50vh]'"
          >
            <div
              v-for="(member, index) in currentMembers"
              :key="member.id || member.user_id"
              class="flex items-center justify-between p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                  :class="getAvatarColor(index)"
                >
                  {{ getInitials(member.name || 'U') }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-[var(--ui-text)] truncate">
                      {{ member.name || 'Unknown User' }}
                    </p>
                    <span
                      v-if="isCreator(member.id || member.user_id)"
                      class="shrink-0 rounded-full bg-[var(--ui-primary)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--ui-primary)]"
                    >Creator</span>
                  </div>
                  <p class="text-xs text-[var(--ui-text-muted)] truncate">
                    {{ member.email }}
                  </p>
                </div>
              </div>
              <button
                v-if="isCurrentUserCreator && !isCreator(member.id || member.user_id)"
                type="button"
                :disabled="removingMemberId !== null"
                class="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                @click="handleRemoveMember(member.id || member.user_id)"
              >
                <span v-if="removingMemberId !== (member.id || member.user_id)">Remove</span>
                <UIcon
                  v-else
                  name="i-lucide-loader"
                  class="h-3 w-3 animate-spin"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
