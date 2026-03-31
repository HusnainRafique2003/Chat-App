import { defineStore } from 'pinia'

interface SessionState {
  tempMessage: string
  clickCount: number
  lastAction: string
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    tempMessage: '',
    clickCount: 0,
    lastAction: 'none',
  }),

  actions: {
    setMessage(msg: string) {
      this.tempMessage = msg
      this.lastAction = 'set message'
    },
    increment() {
      this.clickCount++
      this.lastAction = 'incremented'
    },
    $reset() {
      this.tempMessage = ''
      this.clickCount = 0
      this.lastAction = 'none'
    },
  },
})