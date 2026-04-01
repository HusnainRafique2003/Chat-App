import { defineStore } from 'pinia'
import axios from 'axios'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    workspaces: [] as any[],
    activeWorkspaceId: null as string | null,
    // Make sure your NEW token is pasted here!
    token: 'UHYtskvnQeOBZCxS43BeZNVzjHPD9e9S1775030389' 
  }),

  actions: {
    // Inside stores/workspace.ts -> fetchWorkspaces()
    async fetchWorkspaces() {
        try {
          const response = await axios.request({
            url: 'http://178.104.58.236/api/workspaces/read',
            method: 'GET',
            headers: { 
              token: this.token 
            },
            data: {} // The quirky trick that bypasses the "Token Required" error
          })
          
          // 🚨 ADD THIS LOG: Let's see exactly what the server sent back!
          console.log("🔥 WORKSPACE RESPONSE:", response.data)
  
          if (response.data?.success) {
            // Sometimes the backend returns response.data.workspaces, 
            // sometimes it's response.data.data.workspaces, or response.data.data
            const rawData = response.data.data
            this.workspaces = rawData?.workspaces || rawData || []
          } else {
            console.warn("Workspace API rejected:", response.data)
          }
        } catch (err: any) {
          console.error("Workspace Error:", err.response?.data || err.message)
        }
    },
    setActiveWorkspace(id: string) {
      this.activeWorkspaceId = id
    }
  }
})