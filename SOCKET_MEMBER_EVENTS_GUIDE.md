# Socket Member Events Implementation Guide

## Overview
This guide explains how to use the socket member events system for real-time member updates in workspaces, teams, and channels.

## Events Implemented

### Workspace Events
- **`workspace_member_removed`** - Triggered when a member is removed from a workspace
  - Payload: `{ userId: string; workspaceId: string }`
  - Auto-action: Refreshes workspace members if in current workspace or workspace list if current user was removed

- **`workspace_member_invited`** - Triggered when a member is invited to a workspace
  - Payload: `{ userId: string; workspaceId: string; role: string }`
  - Auto-action: Refreshes workspace members or workspace list depending on who was invited

### Team Events
- **`team_member_added`** - Triggered when a member is added to a team
  - Payload: `{ userId: string; teamId: string }`
  - Auto-action: Refreshes team member list for current team

- **`team_member_removed`** - Triggered when a member is removed from a team
  - Payload: `{ userId: string; teamId: string }`
  - Auto-action: Refreshes team list or removes team if current user was removed

### Channel Events
- **`channel_member_added`** - Triggered when a member is added to a channel
  - Payload: `{ userId: string; channelId: string }`
  - Auto-action: Refreshes channel members

- **`channel_member_removed`** - Triggered when a member is removed from a channel
  - Payload: `{ userId: string; channelId: string }`
  - Auto-action: Removes channel from list if current user was removed, or refreshes members

## How to Use

### 1. Enable Socket Member Events in Dashboard/Main Layout

In [app/pages/dashboard.vue](../../app/pages/dashboard.vue) or [app/layouts/default.vue](../../app/layouts/default.vue):

```vue
<script setup lang="ts">
import { useSocketMemberEvents } from '~/composables/useSocketMemberEvents'

// Initialize socket member events once on app load
const { initialize } = useSocketMemberEvents()

onMounted(() => {
  initialize()
})
</script>
```

### 2. Use Socket Events in Components

#### Example: Send Event from Component

```vue
<script setup lang="ts">
import { useSocket } from '~/composables/useSocket'

const { emit } = useSocket()

function inviteUserToWorkspace(userId: string, workspaceId: string) {
  // Emit the socket event
  emit('workspace_member_invited', {
    userId,
    workspaceId,
    role: 'admin'
  })
}
</script>
```

#### Example: Listen to Events in Component

```vue
<script setup lang="ts">
import { useSocket } from '~/composables/useSocket'

const { on } = useSocket()

onMounted(() => {
  on('workspace_member_removed', (data) => {
    console.log('User removed from workspace:', data)
    // Custom handling if needed
  })
  
  // Auto-cleanup happens on unmount
})
</script>
```

### 3. Using Socket Service Directly (Advanced)

For non-component contexts (stores, services):

```typescript
import socketService from '~/services/api/socket'

// Emit an event
socketService.emit('team_member_added', {
  userId: '123',
  teamId: 'team-456'
})

// Listen to an event
const unsubscribe = socketService.on('team_member_removed', (data) => {
  console.log('Member removed:', data)
})

// Cleanup when done
unsubscribe()
```

## Architecture

### Files Structure
- **`app/services/api/socket.ts`** - Core Socket.IO service (singleton pattern)
  - Handles connection initialization
  - Manages event emission and listening
  - Auto-reconnection logic
  
- **`app/composables/useSocket.ts`** - Vue composable for components
  - Provides `on()`, `emit()`, `joinRoom()`, `leaveRoom()` methods
  - Auto-cleanup on component unmount
  
- **`app/composables/useSocketMemberEvents.ts`** - Member event handlers
  - Sets up all member-related socket listeners
  - Auto-refreshes stores when events occur
  - Call `initialize()` once in dashboard/layout

- **`app/plugins/socket.io.ts`** - Nuxt plugin
  - Auto-initializes socket service on app startup
  - Makes socket globally accessible via `$socket`

### Connection Configuration

The socket URL is configured in [nuxt.config.ts](../../nuxt.config.ts):

```typescript
runtimeConfig: {
  public: {
    socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://178.104.58.236'
  }
}
```

Override in `.env.local` or environment variables:
```
NUXT_PUBLIC_SOCKET_URL=http://178.104.58.236
```

## Socket Admin Panel

Monitor live socket connections and events:
- **URL:** http://178.104.58.236/socket/socket-admin/#/
- View active connections
- Test emit/receive events
- Monitor room status

## Common Patterns

### Pattern 1: Join a Room on Component Mount
```typescript
const { joinRoom, leaveRoom } = useSocket()

onMounted(() => {
  joinRoom(`channel-${channelId}`)
})

onUnmounted(() => {
  leaveRoom(`channel-${channelId}`)
})
```

### Pattern 2: Acknowledge Message Delivery
```typescript
const { emit } = useSocket()

emit('messageSend', 
  { text: 'Hello', channelId },
  (ack) => {
    if (ack?.success) {
      console.log('Message delivered!')
    }
  }
)
```

### Pattern 3: Handle Connection State
```typescript
const { isConnected, reconnect, on } = useSocket()

on('connect_error', () => {
  if (!isConnected()) {
    console.log('Attempting to reconnect...')
    reconnect()
  }
})
```

## Best Practices

1. **Initialize once**: Call `useSocketMemberEvents().initialize()` only once in your main layout
2. **Use composable in components**: Use `useSocket()` in components rather than importing service directly
3. **Auto-cleanup**: Listeners added via `useSocket().on()` auto-cleanup on component unmount
4. **Check connection**: Use `isConnected()` before critical operations
5. **Error handling**: The socket service logs all connection/error events to console

## Troubleshooting

### Socket Not Connecting?
1. Check browser console for connection errors
2. Verify socket URL in [nuxt.config.ts](../../nuxt.config.ts)
3. Ensure `.env.local` has correct `NUXT_PUBLIC_SOCKET_URL`
4. Check Socket Admin panel to see if server is online

### Events Not Triggering?
1. Verify socket is connected: `isConnected()`
2. Check emit syntax matches event definition in `SocketEventMap`
3. Ensure backend is emitting events correctly
4. Check browser DevTools console for errors

### Memory Leaks?
- Listeners in components auto-cleanup, no manual work needed
- If using service directly, remember to call `unsubscribe()` or `off()`

## Type Safety

All events are TypeScript-aware:

```typescript
// This will cause TypeScript error if event name is wrong
emit('invalid_event', {}) // ❌ Error

// This will be properly typed
emit('workspace_member_removed', { 
  userId: '123',
  workspaceId: '456'
}) // ✅ Correct

// Type inference works automatically
on('team_member_added', (data) => {
  // data is properly typed as { userId: string; teamId: string }
  console.log(data.userId)
})
```

## Next Steps

1. **Integrate in dashboard**: Add `useSocketMemberEvents().initialize()` to your main layout
2. **Test events**: Use Socket Admin panel to trigger events and verify store updates
3. **Add more events**: Extend `SocketEventMap` in [socket.ts](../../services/api/socket.ts) for additional event types
4. **Monitor performance**: Check browser DevTools for connection quality and message throughput
