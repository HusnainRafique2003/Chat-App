import { io, Socket as SocketType } from 'socket.io-client'

interface SocketOptions {
  url: string
  reconnection?: boolean
  reconnectionDelay?: number
  reconnectionDelayMax?: number
  reconnectionAttempts?: number
  transports?: string[]
}

type SocketEvent = 
  | 'workspace_member_removed'
  | 'workspace_member_invited'
  | 'team_member_added'
  | 'team_member_removed'
  | 'channel_member_added'
  | 'channel_member_removed'
  | 'messageSend'
  | 'messageReceived'
  | 'userTyping'
  | 'userTypingStop'
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'reconnect'
  | 'reconnect_attempt'
  | 'reconnect_failed'

interface SocketEventMap {
  workspace_member_removed: { userId: string; workspaceId: string }
  workspace_member_invited: { userId: string; workspaceId: string; role: string }
  team_member_added: { userId: string; teamId: string }
  team_member_removed: { userId: string; teamId: string }
  channel_member_added: { userId: string; channelId: string }
  channel_member_removed: { userId: string; channelId: string }
  messageSend: any
  messageReceived: any
  userTyping: any
  userTypingStop: any
  connect: void
  disconnect: void
  connect_error: Error
  reconnect: void
  reconnect_attempt: void
  reconnect_failed: void
}

type SocketCallback<E extends SocketEvent> = (data: SocketEventMap[E]) => void

class SocketService {
  private static instance: SocketService
  private socket: SocketType | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false
  private url: string = ''

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  initialize(options: SocketOptions): void {
    if (this.socket) {
      console.warn('Socket already initialized')
      return
    }

    this.url = options.url

    const socketOptions = {
      reconnection: options.reconnection ?? true,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
      reconnectionDelayMax: options.reconnectionDelayMax ?? 5000,
      reconnectionAttempts: options.reconnectionAttempts ?? 5,
      transports: options.transports ?? ['websocket', 'polling'],
      path: '/socket.io/',
      autoConnect: true,
      query: {
        token: this._getToken()
      }
    }

    this.socket = io(this.url, socketOptions)
    this._setupDefaultListeners()
    console.log(`[Socket] Initialized with URL: ${this.url}`)
  }

  private _setupDefaultListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('[Socket] Connected')
      this._executeListeners('connect', undefined)
    })

    this.socket.on('disconnect', () => {
      this.isConnected = false
      console.log('[Socket] Disconnected')
      this._executeListeners('disconnect', undefined)
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
      this._executeListeners('connect_error', error)
    })

    this.socket.on('reconnect_attempt', () => {
      console.log('[Socket] Reconnect attempt...')
      this._executeListeners('reconnect_attempt', undefined)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed')
      this._executeListeners('reconnect_failed', undefined)
    })

    this.socket.on('reconnect', () => {
      this.isConnected = true
      console.log('[Socket] Reconnected')
      this._executeListeners('reconnect', undefined)
    })
  }

  private _getToken(): string {
    if (process.client) {
      return localStorage.getItem('auth_token') || ''
    }
    return ''
  }

  emit<E extends SocketEvent>(event: E, data?: SocketEventMap[E], callback?: (ack: any) => void): void {
    if (!this.socket) {
      console.warn(`[Socket] Socket not initialized, cannot emit "${event}"`)
      return
    }

    if (callback) {
      this.socket.emit(event, data, callback)
    } else {
      this.socket.emit(event, data)
    }

    console.log(`[Socket] Emitted "${event}":`, data)
  }

  on<E extends SocketEvent>(event: E, callback: SocketCallback<E>): () => void {
    if (!this.socket) {
      console.warn(`[Socket] Socket not initialized, cannot listen to "${event}"`)
      return () => {}
    }

    this.socket.on(event, callback as any)

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(callback)

    console.log(`[Socket] Listener added for "${event}"`)

    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  off<E extends SocketEvent>(event: E, callback: SocketCallback<E>): void {
    if (!this.socket) return

    this.socket.off(event, callback as any)

    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    }

    console.log(`[Socket] Listener removed for "${event}"`)
  }

  private _executeListeners<E extends SocketEvent>(event: E, data: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[Socket] Error executing listener for "${event}":`, error)
        }
      })
    }
  }

  joinRoom(room: string): void {
    this.emit('joinRoom' as any, { room })
  }

  leaveRoom(room: string): void {
    this.emit('leaveRoom' as any, { room })
  }

  isConnectedTo(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      console.log('[Socket] Manually disconnected')
    }
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.connect()
      console.log('[Socket] Manually reconnected')
    }
  }

  removeAllListeners(): void {
    this.listeners.forEach((listeners) => {
      listeners.clear()
    })
    this.listeners.clear()
  }
}

export default SocketService.getInstance()
export type { SocketEvent, SocketEventMap, SocketCallback }
