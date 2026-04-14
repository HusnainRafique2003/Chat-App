import socketService from '~/services/api/socket'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const socketUrl = config.public.socketUrl || 'http://178.104.58.236'

  // Initialize socket service on app start
  if (process.client) {
    socketService.initialize({
      url: socketUrl,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    })
  }

  // Make socket available globally via $socket
  return {
    provide: {
      socket: socketService
    }
  }
})
