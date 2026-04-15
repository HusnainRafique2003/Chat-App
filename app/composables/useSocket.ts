import socketService from '~/services/api/socket'
import type { SocketEvent, SocketCallback } from '~/services/api/socket'

export function useSocket() {
  const listeners: Array<() => void> = []

  // Auto-cleanup on unmount
  onUnmounted(() => {
    listeners.forEach((unsubscribe) => {
      try {
        unsubscribe()
      } catch (error) {
        console.error('[useSocket] Error during cleanup:', error)
      }
    })
  })

  /**
   * Listen to a socket event
   * Auto-cleanup is handled on component unmount
   */
  function on<E extends SocketEvent>(event: E, callback: SocketCallback<E>): void {
    const unsubscribe = socketService.on(event, callback)
    listeners.push(unsubscribe)
  }

  /**
   * Emit a socket event
   */
  function emit<E extends SocketEvent>(event: E, data?: any, callback?: (ack: any) => void): void {
    socketService.emit(event, data, callback)
  }

  /**
   * Join a room
   */
  function joinRoom(room: string): void {
    socketService.joinRoom(room)
  }

  /**
   * Leave a room
   */
  function leaveRoom(room: string): void {
    socketService.leaveRoom(room)
  }

  /**
   * Check if socket is connected
   */
  function isConnected(): boolean {
    return socketService.isConnectedTo()
  }

  /**
   * Disconnect from socket
   */
  function disconnect(): void {
    socketService.disconnect()
  }

  /**
   * Reconnect to socket
   */
  function reconnect(): void {
    socketService.reconnect()
  }

  /**
   * Manually remove a listener
   */
  function off<E extends SocketEvent>(event: E, callback: SocketCallback<E>): void {
    socketService.off(event, callback)
    const index = listeners.findIndex(
      listener => listener && listener.toString().includes(event)
    )
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  return {
    on,
    emit,
    joinRoom,
    leaveRoom,
    isConnected,
    disconnect,
    reconnect,
    off
  }
}
