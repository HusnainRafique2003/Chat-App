<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useWorkspaceStore } from "~/stores/workspace";
import { useTeamStore } from "~/stores/team";
import { useChannelStore } from "~/stores/channel";

// 1. Initialize Stores
const workspaceStore = useWorkspaceStore();
const teamStore = useTeamStore();
const channelStore = useChannelStore();

// 2. Extract State (Use storeToRefs to keep them reactive in the template!)
const { workspaces, activeWorkspaceId } = storeToRefs(workspaceStore);
const { teams, activeTeamId } = storeToRefs(teamStore);
const { channels, activeChannelId } = storeToRefs(channelStore);

// Modals UI State
const isWorkspaceModalOpen = ref(false);
const isTeamModalOpen = ref(false);
const isChannelModalOpen = ref(false);

// UI Helpers
function getInitials(name: string) {
  if (!name) return "?";
  return name.substring(0, 2).toUpperCase();
}

// --- THE CHAIN REACTION LOGIC ---

async function handleWorkspaceSelect(id: string) {
  workspaceStore.setActiveWorkspace(id);
  teamStore.setActiveTeam(null);
  channelStore.setActiveChannel(null);

  await teamStore.fetchTeams(id);

  // Auto-select first team
  if (teamStore.teams.length > 0) {
    handleTeamSelect(teamStore.teams[0].id);
  }
}

async function handleTeamSelect(id: string) {
  teamStore.setActiveTeam(id);
  channelStore.setActiveChannel(null);

  await channelStore.fetchChannels(id);

  // Auto-select first channel (when API works)
  if (channelStore.channels.length > 0) {
    channelStore.setActiveChannel(channelStore.channels[0].id);
  }
}

// Initial Load
onMounted(async () => {
  await workspaceStore.fetchWorkspaces();
  if (workspaceStore.workspaces.length > 0) {
    handleWorkspaceSelect(workspaceStore.workspaces[0].id);
  }
});
</script>
<template>
  <div
    class="flex h-screen bg-[#EEEDE9] text-[#371B17] border-r border-[#371B17]/10 dark:bg-[#09090b] dark:text-[#fafafa] dark:border-white/10 font-sans w-[320px] transition-colors duration-300">

    <div
      class="w-24 flex flex-col items-center py-6 border-r border-[#371B17]/10 dark:border-white/10 shrink-0 overflow-y-auto hide-scrollbar">

      <div class="flex flex-col items-center w-full mb-8">
        <p class="text-[9px] font-bold uppercase tracking-widest mb-4 opacity-70">
          Workspaces
        </p>

        <div class="flex flex-col gap-3 items-center">
          <UTooltip v-for="workspace in workspaces" :key="workspace.id" :text="workspace.name" side="right"
            :popper="{ arrow: true }">
            <button @click="handleWorkspaceSelect(workspace.id)"
              class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all" :class="activeWorkspaceId === workspace.id
                ? 'bg-[#371B17] text-[#EEEDE9] shadow-md ring-2 ring-offset-2 ring-offset-[#EEEDE9] ring-[#371B17] dark:bg-[#818cf8] dark:text-[#09090b] dark:ring-offset-[#09090b] dark:ring-[#818cf8]'
                : 'bg-[#371B17]/10 text-[#371B17] hover:bg-[#371B17]/20 dark:bg-white/10 dark:text-[#fafafa] dark:hover:bg-white/20'
                ">
              {{ getInitials(workspace.name) }}
            </button>
          </UTooltip>
        </div>
      </div>

      <div class="flex flex-col items-center w-full">
        <p class="text-[9px] font-bold uppercase tracking-widest mb-4 opacity-70">
          Teams
        </p>
        <div class="flex flex-col gap-3 items-center">
          <UTooltip v-for="team in teams" :key="team.id" :text="team.name" side="right" :popper="{ arrow: true }">
            <button @click="handleTeamSelect(team.id)"
              class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all ring-offset-[#EEEDE9] dark:ring-offset-[#09090b]"
              :class="[
                activeTeamId === team.id
                  ? 'ring-2 ring-offset-2 ring-[#371B17] dark:ring-[#818cf8]'
                  : 'hover:opacity-80',
                'bg-rose-100 text-[#371B17]',
              ]">
              {{ getInitials(team.name) }}
            </button>
          </UTooltip>

          <UTooltip text="Create New Team" side="right">
            <button @click="isTeamModalOpen = true"
              class="w-12 h-12 rounded-xl border-2 border-dashed border-[#371B17]/30 text-[#371B17]/50 hover:border-[#371B17] transition-colors">
              <UIcon name="i-lucide-plus" class="text-xl" />
            </button>
          </UTooltip>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col pt-6 pb-4 px-4 h-full relative overflow-y-auto">

      <div class="flex items-center justify-between cursor-pointer group mb-8">
        <h1 class="text-lg font-bold truncate pr-2">
          {{
            workspaces.find((w) => w.id === activeWorkspaceId)?.name ||
            "Archive Workspace"
          }}
        </h1>
        <UIcon name="i-lucide-chevron-down" class="text-lg opacity-50 group-hover:opacity-100" />
      </div>

      <div class="mb-8">
        <div class="flex items-center justify-between mb-3 px-2">
          <p class="text-[10px] font-bold uppercase tracking-widest opacity-70">
            Channels
          </p>
          <button @click="isChannelModalOpen = true" class="opacity-50 hover:opacity-100">
            <UIcon name="i-lucide-plus-circle" class="text-sm" />
          </button>
        </div>

        <div class="flex flex-col gap-1">
          <button v-for="channel in channels" :key="channel.id" @click="handleChannelSelect(channel.id)"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left" :class="activeChannelId === channel.id
              ? 'bg-[#371B17]/10 dark:bg-white/10 font-bold'
              : 'hover:bg-[#371B17]/5 dark:hover:bg-white/5 font-medium opacity-80'
              ">
            <span class="opacity-50 font-normal">#</span>
            <span class="truncate">{{ channel.name }}</span>
          </button>

          <p v-if="channels.length === 0" class="text-[10px] opacity-40 px-3 italic">
            No channels in this team
          </p>
        </div>
      </div>

      <div>
        <p class="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-3 px-2">
          Direct Messages
        </p>
        <div class="flex flex-col gap-1">
          <button v-for="dm in directMessages" :key="dm.id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-[#371B17]/5 dark:hover:bg-white/5 transition-colors">
            <span class="w-2 h-2 rounded-full" :class="dm.online
              ? 'bg-emerald-500'
              : 'border border-[#371B17] dark:border-white'
              "></span>
            <span class="truncate opacity-80">{{ dm.name }}</span>
          </button>
        </div>
      </div>

      <div class="mt-auto flex items-center gap-3 pt-4 px-2">
        <UAvatar src="https://i.pravatar.cc/150?u=elena" size="sm" />
        <div class="flex-1 min-w-0 flex flex-col">
          <span class="text-sm font-bold truncate">Elena V.</span>
          <span class="text-[9px] uppercase tracking-wider opacity-60 truncate">Creative Lead</span>
        </div>
        <UIcon name="i-lucide-settings" class="text-lg opacity-50" />
      </div>
    </div>

    <TeamModal v-model:open="isTeamModalOpen" mode="create" />
    <ChannelModal v-model:open="isChannelModalOpen" mode="create" />
  </div>
</template>
<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
