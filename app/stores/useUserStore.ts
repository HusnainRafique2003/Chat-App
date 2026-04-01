import { defineStore } from 'pinia'

// Updated to match your backend auth response perfectly
export interface UserInfo {
  id: string
  name: string
  email: string
  is_active: boolean
  access_token: string
}

interface UserState {
  user: UserInfo | null
  userList: UserInfo[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    userList: [],
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.user?.access_token,
  },

  actions: {
    // Call this when your login API request succeeds
    login(info: UserInfo) {
      this.user = info
    },
    logout() {
      this.user = null
    },
    $reset() {
      this.user = null
      this.userList = []
    },
  },

  // This ensures the token survives page refreshes!
  persist: true, 
})