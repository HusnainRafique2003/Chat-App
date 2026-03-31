<script setup lang="ts">
import { ref } from 'vue'
import type { WorkspacePayload } from '~/components/modals/WorkspaceModal.vue'
import type { TeamPayload }      from '~/components/modals/TeamModal.vue'
import type { ChannelPayload }   from '~/components/modals/ChannelModal.vue'

const deleteWorkspaceOpen = ref(false)
const deleteTeamOpen      = ref(false)
const deleteChannelOpen   = ref(false)
const workspaceCreateOpen = ref(false)
const workspaceUpdateOpen = ref(false)
const teamCreateOpen      = ref(false)
const teamUpdateOpen      = ref(false)
const channelCreateOpen   = ref(false)
const channelUpdateOpen   = ref(false)
const memberAddOpen       = ref(false)
const memberRemoveOpen    = ref(false)

const loadingStates = ref<Record<string, boolean>>({})
const activityLog   = ref<string[]>([])

function simulateLoading(key: string, closeFn: () => void) {
  loadingStates.value[key] = true
  setTimeout(() => {
    loadingStates.value[key] = false
    closeFn()
    activityLog.value.unshift(`✅ [${new Date().toLocaleTimeString()}] ${key} completed`)
  }, 1500)
}

function onCancel(action: string) {
  activityLog.value.unshift(`❌ [${new Date().toLocaleTimeString()}] ${action} cancelled`)
}

const sampleMembers = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin'  as const },
  { id: '2', name: 'Bob Smith',     email: 'bob@example.com',   role: 'member' as const },
  { id: '3', name: 'Carol White',   email: 'carol@example.com', role: 'guest'  as const },
]
const targetMember = sampleMembers[1]

function onDeleteWorkspace() {
  simulateLoading('deleteWorkspace', () => { deleteWorkspaceOpen.value = false })
}
function onDeleteTeam() {
  simulateLoading('deleteTeam', () => { deleteTeamOpen.value = false })
}
function onDeleteChannel() {
  simulateLoading('deleteChannel', () => { deleteChannelOpen.value = false })
}
function onCreateWorkspace(p: WorkspacePayload) {
  activityLog.value.unshift(`✅ Create workspace: "${p.name}" | private: ${p.isPrivate}`)
  simulateLoading('createWorkspace', () => { workspaceCreateOpen.value = false })
}
function onUpdateWorkspace(p: WorkspacePayload) {
  activityLog.value.unshift(`✅ Update workspace: "${p.name}" | private: ${p.isPrivate}`)
  simulateLoading('updateWorkspace', () => { workspaceUpdateOpen.value = false })
}
function onCreateTeam(p: TeamPayload) {
  activityLog.value.unshift(`✅ Create team: "${p.name}" | color: ${p.color}`)
  simulateLoading('createTeam', () => { teamCreateOpen.value = false })
}
function onUpdateTeam(p: TeamPayload) {
  activityLog.value.unshift(`✅ Update team: "${p.name}" | color: ${p.color}`)
  simulateLoading('updateTeam', () => { teamUpdateOpen.value = false })
}
function onCreateChannel(p: ChannelPayload) {
  activityLog.value.unshift(`✅ Create channel: "#${p.name}" | type: ${p.type}`)
  simulateLoading('createChannel', () => { channelCreateOpen.value = false })
}
function onUpdateChannel(p: ChannelPayload) {
  activityLog.value.unshift(`✅ Update channel: "#${p.name}" | type: ${p.type}`)
  simulateLoading('updateChannel', () => { channelUpdateOpen.value = false })
}
function onAddMembers(emails: string[], role: string) {
  activityLog.value.unshift(`✅ Invited ${emails.length} member(s) as "${role}": ${emails.join(', ')}`)
  simulateLoading('addMember', () => { memberAddOpen.value = false })
}
function onRemoveMember(id: string) {
  const member = sampleMembers.find(m => m.id === id)
  activityLog.value.unshift(`✅ Removed member: "${member?.name ?? id}"`)
  simulateLoading('removeMember', () => { memberRemoveOpen.value = false })
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">

    <BaseCard title="Activity Log" icon="i-lucide-terminal" color="primary">
      <div class="font-mono text-xs flex flex-col gap-1 min-h-10">
        <p v-if="activityLog.length === 0" class="text-muted">No activity yet.</p>
        <p v-for="(log, i) in activityLog" :key="i" class="text-default">{{ log }}</p>
      </div>
      <template #footer>
        <UButton
          v-if="activityLog.length > 0"
          label="Clear Log"
          color="neutral"
          variant="ghost"
          size="sm"
          leading-icon="i-lucide-trash-2"
          @click="activityLog = []"
        />
      </template>
    </BaseCard>

    <BaseCard title="BaseButton — Colors & Variants" icon="i-mdi-gesture-tap" color="primary">
      <div class="flex flex-col gap-3">
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Colors</p>
        <div class="flex flex-wrap gap-2">
          <BaseButton label="Primary"   color="primary" />
          <BaseButton label="Secondary" color="secondary" />
          <BaseButton label="Success"   color="success" />
          <BaseButton label="Warning"   color="warning" />
          <BaseButton label="Error"     color="error" />
          <BaseButton label="Neutral"   color="neutral" />
        </div>
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Variants</p>
        <div class="flex flex-wrap gap-2">
          <BaseButton label="Solid"   variant="solid" />
          <BaseButton label="Outline" variant="outline" />
          <BaseButton label="Soft"    variant="soft" />
          <BaseButton label="Ghost"   variant="ghost" />
          <BaseButton label="Link"    variant="link" />
        </div>
        <p class="text-xs text-muted font-semibold uppercase tracking-wide">Sizes & States</p>
        <div class="flex flex-wrap gap-2 items-center">
          <BaseButton label="XS"        size="xs" />
          <BaseButton label="SM"        size="sm" />
          <BaseButton label="MD"        size="md" />
          <BaseButton label="LG"        size="lg" />
          <BaseButton label="With Icon" leading-icon="i-mdi-home" />
          <BaseButton label="Loading"   :loading="true" />
          <BaseButton label="Disabled"  :disabled="true" />
        </div>
        <BaseButton label="Block Button" :block="true" color="secondary" />
      </div>
    </BaseCard>

    <BaseCard title="BaseBadge — Colors & Variants" icon="i-mdi-tag" color="secondary">
      <div class="flex flex-wrap gap-2">
        <BaseBadge label="Primary"   color="primary" />
        <BaseBadge label="Secondary" color="secondary" />
        <BaseBadge label="Success"   color="success" />
        <BaseBadge label="Warning"   color="warning" />
        <BaseBadge label="Error"     color="error" />
        <BaseBadge label="Neutral"   color="neutral" />
        <BaseBadge label="With Icon" color="primary"   icon="i-mdi-star" />
        <BaseBadge label="Outline"   color="secondary" variant="outline" />
        <BaseBadge label="Subtle"    color="success"   variant="subtle" />
        <BaseBadge label="Solid"     color="error"     variant="solid" />
      </div>
    </BaseCard>

    <BaseCard title="BaseCard — Variants" icon="i-mdi-card-outline" color="neutral">
      <div class="flex flex-col gap-3">
        <BaseCard
          title="Simple Card"
          description="A basic card with title and description."
          icon="i-mdi-information"
          color="primary"
        >
          <p class="text-sm text-muted">Card body content goes here.</p>
        </BaseCard>
        <BaseCard
          title="Hoverable Card"
          description="Hover to see the shadow effect."
          icon="i-mdi-cursor-default"
          color="success"
          :hoverable="true"
        >
          <p class="text-sm text-muted">This card lifts on hover.</p>
        </BaseCard>
        <BaseCard
          title="Loading Card"
          description="Shows spinner instead of content."
          icon="i-lucide-loader-2"
          color="warning"
          :loading="true"
        />
      </div>
    </BaseCard>

    <BaseCard title="BaseInput — Variants" icon="i-mdi-form-textbox" color="primary">
      <div class="grid grid-cols-1 gap-4">
        <BaseInput label="Default Input"  placeholder="Type something..." />
        <BaseInput label="With Icon"      placeholder="Search..." icon="i-mdi-magnify" />
        <BaseInput label="Required"       placeholder="Required field" :required="true" />
        <BaseInput label="With Error"     placeholder="Bad input" error="This field has an error." />
        <BaseInput label="Password"       placeholder="Enter password" type="password" icon="i-mdi-lock" />
        <BaseInput label="Disabled"       placeholder="Cannot type here" :disabled="true" />
      </div>
    </BaseCard>

    <BaseCard title="ConfirmDeleteModal — name confirmation" icon="i-lucide-trash-2" color="error">
      <p class="text-sm text-muted mb-4">
        Type the <strong class="text-default">exact name</strong> to unlock delete.
      </p>
      <div class="flex flex-wrap gap-2">
        <BaseButton label="Delete Workspace" color="error"
          leading-icon="i-mdi-briefcase" @click="deleteWorkspaceOpen = true" />
        <BaseButton label="Delete Team" color="error" variant="soft"
          leading-icon="i-mdi-account-group" @click="deleteTeamOpen = true" />
        <BaseButton label="Delete Channel" color="error" variant="outline"
          leading-icon="i-mdi-pound" @click="deleteChannelOpen = true" />
      </div>
    </BaseCard>

    <BaseCard title="WorkspaceModal — create & update" icon="i-mdi-briefcase" color="primary">
      <div class="flex flex-wrap gap-2">
        <BaseButton label="Create Workspace" color="primary"
          leading-icon="i-lucide-plus" @click="workspaceCreateOpen = true" />
        <BaseButton label="Update Workspace" color="warning" variant="soft"
          leading-icon="i-lucide-pencil" @click="workspaceUpdateOpen = true" />
      </div>
    </BaseCard>

    <BaseCard title="TeamModal — create & update" icon="i-mdi-account-group" color="secondary">
      <div class="flex flex-wrap gap-2">
        <BaseButton label="Create Team" color="secondary"
          leading-icon="i-lucide-plus" @click="teamCreateOpen = true" />
        <BaseButton label="Update Team" color="warning" variant="soft"
          leading-icon="i-lucide-pencil" @click="teamUpdateOpen = true" />
      </div>
    </BaseCard>

    <BaseCard title="ChannelModal — create & update" icon="i-mdi-pound" color="success">
      <div class="flex flex-wrap gap-2">
        <BaseButton label="Create Channel" color="success"
          leading-icon="i-lucide-plus" @click="channelCreateOpen = true" />
        <BaseButton label="Update Channel" color="warning" variant="soft"
          leading-icon="i-lucide-pencil" @click="channelUpdateOpen = true" />
      </div>
    </BaseCard>

    <BaseCard title="MemberModal — add & remove" icon="i-mdi-account-multiple" color="warning">
      <div class="flex flex-wrap gap-2">
        <BaseButton label="Add Members" color="primary"
          leading-icon="i-mdi-account-plus" @click="memberAddOpen = true" />
        <BaseButton label="Remove Member" color="error" variant="soft"
          leading-icon="i-mdi-account-remove" @click="memberRemoveOpen = true" />
      </div>
    </BaseCard>

  </div>

  <!-- ALL MODALS -->
  <ConfirmDeleteModal v-model:open="deleteWorkspaceOpen" entity-type="workspace"
    entity-name="My Engineering Hub" :loading="loadingStates['deleteWorkspace']"
    @confirm="onDeleteWorkspace" @cancel="onCancel('Workspace delete')" />

  <ConfirmDeleteModal v-model:open="deleteTeamOpen" entity-type="team"
    entity-name="Frontend Squad" :loading="loadingStates['deleteTeam']"
    @confirm="onDeleteTeam" @cancel="onCancel('Team delete')" />

  <ConfirmDeleteModal v-model:open="deleteChannelOpen" entity-type="channel"
    entity-name="general" :loading="loadingStates['deleteChannel']"
    @confirm="onDeleteChannel" @cancel="onCancel('Channel delete')" />

  <WorkspaceModal v-model:open="workspaceCreateOpen" mode="create"
    :loading="loadingStates['createWorkspace']"
    @submit="onCreateWorkspace" @cancel="onCancel('Workspace create')" />

  <WorkspaceModal v-model:open="workspaceUpdateOpen" mode="update"
    :initial="{ name: 'My Engineering Hub', description: 'Main workspace', isPrivate: true }"
    :loading="loadingStates['updateWorkspace']"
    @submit="onUpdateWorkspace" @cancel="onCancel('Workspace update')" />

  <TeamModal v-model:open="teamCreateOpen" mode="create"
    workspace-name="My Engineering Hub" :loading="loadingStates['createTeam']"
    @submit="onCreateTeam" @cancel="onCancel('Team create')" />

  <TeamModal v-model:open="teamUpdateOpen" mode="update"
    workspace-name="My Engineering Hub"
    :initial="{ name: 'Frontend Squad', color: 'bg-violet-500' }"
    :loading="loadingStates['updateTeam']"
    @submit="onUpdateTeam" @cancel="onCancel('Team update')" />

  <ChannelModal v-model:open="channelCreateOpen" mode="create"
    team-name="Frontend Squad" :loading="loadingStates['createChannel']"
    @submit="onCreateChannel" @cancel="onCancel('Channel create')" />

  <ChannelModal v-model:open="channelUpdateOpen" mode="update"
    team-name="Frontend Squad"
    :initial="{ name: 'general', type: 'text', isPrivate: false }"
    :loading="loadingStates['updateChannel']"
    @submit="onUpdateChannel" @cancel="onCancel('Channel update')" />

  <MemberModal v-model:open="memberAddOpen" mode="add"
    entity-type="workspace" entity-name="My Engineering Hub"
    :existing-members="sampleMembers" :loading="loadingStates['addMember']"
    @add="onAddMembers" @cancel="onCancel('Add member')" />

  <MemberModal v-model:open="memberRemoveOpen" mode="remove"
    entity-type="workspace" entity-name="My Engineering Hub"
    :target-member="targetMember" :loading="loadingStates['removeMember']"
    @remove="onRemoveMember" @cancel="onCancel('Remove member')" />
</template>