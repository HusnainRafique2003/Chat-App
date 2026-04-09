<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChannelStore, type Channel } from '~/stores/useChannelStore'
import { useWorkspaceStore } from '~/stores/useWorkspaceStore'
import { useUserStore } from '~/stores/useUserStore'
import MemberManagementModal from '~/components/modals/MemberManagementModal.vue'

const channelStore = useChannelStore()
const workspaceStore = useWorkspaceStore()
const userStore = useUserStore()

const showMemberModal = ref(false)
const maxVisibleMembers = 5

const channel = computed(() => channelStore.currentChannel)

// Get member details from workspace members
const channelMembers = computed(() => {
  if (!channel.value?.members) return []
  
  const workspaceMembers = workspaceStore.currentWorkspace?.members || []
  return channel.value.members.map(m => {
    const memberData = workspaceMembers.find((wm: any) => 
      wm.id === m.user_id || wm._id === m.user_id || wm.user_id === m.user_id
    )
    return {
      ...m,
      name: memberData?.name || memberData?.user?.name || 'Unknown',
      email: memberData?.email || memberData?.user?.email || '',
      avatar: memberData?.avatar
    }
  })
})

// Dynamically calculate the channel name (handles DMs vs regular channels)
const channelDisplayName = computed(() => {
  if (!channel.value) return ''

  if (channel.value.type !== 'direct') {
    return `# ${channel.value.name}`
  }

  // It's a Direct Message. Find the other user's name.
  const currentUserId = userStore.user?.id || (userStore.user as any)?._id
  
  const otherMember = channelMembers.value.find(m => {
    const memberId = m.user_id || (m as any).id || (m as any)._id
    return memberId && memberId !== currentUserId
  })

  if (otherMember && otherMember.name !== 'Unknown') {
    return `💬 ${otherMember.name}`
  }

  // Fallback if member details aren't loaded yet
  const fallbackName = channel.value.name.replace('DM: ', '')
  const looksLikeUserId = Boolean(fallbackName && /^[a-f0-9]{24}$/i.test(fallbackName))
  
  return `💬 ${looksLikeUserId ? 'Unknown User' : fallbackName}`
})

const visibleMembers = computed(() => {
  return channelMembers.value.slice(0, maxVisibleMembers)
})

const hiddenMembersCount = computed(() => {
  return Math.max(0, channelMembers.value.length - maxVisibleMembers)
})

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
</script>

<template>
  <div v-if="channel" class="flex items-start gap-4 min-w-0">
    <div class="min-w-0 flex-1">
      <h2 class="text-lg font-bold text-[var(--ui-text-highlighted)] truncate">
        {{ channelDisplayName }}
      </h2>
      <p v-if="channel.description" class="text-sm text-[var(--ui-text-muted)] truncate">
        {{ channel.description }}
      </p>
      <p v-else class="text-sm text-[var(--ui-text-muted)]">
        {{ channelMembers.length }} {{ channelMembers.length === 1 ? 'member' : 'members' }}
      </p>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <div class="flex items-center gap-1">
        <div
          v-for="(member, index) in visibleMembers"
          :key="member.user_id"
          :title="member.name"
          class="relative flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
          :class="getAvatarColor(index)"
        >
          {{ getInitials(member.name) }}
        </div>
      </div>

      <button
        v-if="hiddenMembersCount > 0 || channel.type !== 'direct'"
        type="button"
        @click="showMemberModal = true"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-muted)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-primary)]/10 hover:border-[var(--ui-primary)] hover:text-[var(--ui-primary)] transition-all"
        :title="`${hiddenMembersCount > 0 ? hiddenMembersCount + ' more members' : 'Manage members'}`"
      >
        <span class="text-sm font-bold">+</span>
      </button>
    </div>
  </div>

  <MemberManagementModal
    v-model:open="showMemberModal"
    :channel-id="channel?.id || ''"
    :channel-name="channel?.name || ''"
    :members="channelMembers"
  />
</template>