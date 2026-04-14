# Socket Member Events - Quick Reference

## Quick Start

### 1. Initialize Once in Dashboard/Layout

```vue
<script setup lang="ts">
import { useSocketMemberEvents } from '~/composables/useSocketMemberEvents'

const { initialize } = useSocketMemberEvents()
onMounted(() => initialize())
</script>
```

## Events Overview

| Event | Payload | When Triggered |
|-------|---------|---|
| `workspace_member_removed` | `{userId, workspaceId}` | Member removed from workspace |
| `workspace_member_invited` | `{userId, workspaceId, role}` | Member invited to workspace |
| `team_member_added` | `{userId, teamId}` | Member added to team |
| `team_member_removed` | `{userId, teamId}` | Member removed from team |
| `channel_member_added` | `{userId, channelId}` | Member added to channel |
| `channel_member_removed` | `{userId, channelId}` | Member removed from channel |

## Using in Components

### Listen to Events
```typescript
const { on } = useSocket()

on('workspace_member_removed', (data) => {
  console.log(`User ${data.userId} removed`)
  // Auto-cleanup on unmount
})
```

### Emit Events
```typescript
const { emit } = useSocket()

emit('workspace_member_invited', {
  userId: 'user123',
  workspaceId: 'ws456', 
  role: 'admin'
})
```

### Room Management
```typescript
const { joinRoom, leaveRoom } = useSocket()

joinRoom('channel-123')   // Join a room
leaveRoom('channel-123')  // Leave a room
```

### Connection Status
```typescript
const { isConnected, reconnect, disconnect } = useSocket()

if (isConnected()) {
  console.log('Connected!')
} else {
  reconnect()
}
```

## What Auto-Happens

When you call `initialize()` from `useSocketMemberEvents`:

✅ Member removed → Auto-refreshes member list or workspace list  
✅ Member invited → Auto-fetches updated members  
✅ Team member added → Auto-refreshes team  
✅ Team member removed → Auto-updates team list  
✅ Channel member added → Auto-refreshes channels  
✅ Channel member removed → Auto-removes from list or refreshes  

## Configuration

Set socket URL in `.env.local`:
```
NUXT_PUBLIC_SOCKET_URL=http://178.104.58.236
```

Or update [nuxt.config.ts](../../nuxt.config.ts):
```typescript
socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://178.104.58.236'
```

## Monitoring

View live events and connections:
- **Admin Panel:** http://178.104.58.236/socket/socket-admin/#/

## Troubleshooting

**Not connecting?** Check console for errors, verify socket URL
**Events not working?** Ensure `initialize()` was called, check DevTools
**Need custom handling?** Use `on()` in components for component-specific listeners

## Files

- **Service:** [app/services/api/socket.ts](../../app/services/api/socket.ts)
- **Composable:** [app/composables/useSocket.ts](../../app/composables/useSocket.ts)  
- **Member Events:** [app/composables/useSocketMemberEvents.ts](../../app/composables/useSocketMemberEvents.ts)
- **Plugin:** [app/plugins/socket.io.ts](../../app/plugins/socket.io.ts)
- **Full Guide:** [SOCKET_MEMBER_EVENTS_GUIDE.md](./SOCKET_MEMBER_EVENTS_GUIDE.md)
