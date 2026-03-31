import { defineStore } from 'pinia'

export interface UserInfo {
  name: string
  age: number
  email: string
}

interface UserState {
  user: UserInfo | null
  userList: UserInfo[]
  isAdmin: boolean
  visitCount: number
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    userList: [],
    isAdmin: false,
    visitCount: 0,
  }),

  getters: {
    isLoggedIn: (state): boolean => state.user !== null,
    fullGreeting: (state): string =>
      state.user ? `Welcome back, ${state.user.name}!` : 'You are not logged in.',
  },

  actions: {
    login(info: UserInfo) {
      this.user = info
      this.isAdmin = info.email.includes('admin')
      this.visitCount++
    },
    logout() {
      this.user = null
      this.isAdmin = false
    },
    addToList(info: UserInfo) {
      this.userList.push(info)
    },
    $reset() {
      this.user = null
      this.userList = []
      this.isAdmin = false
      this.visitCount = 0
    },
  },

  persist: true,
})