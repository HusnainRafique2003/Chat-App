# WhatsApp-like Reaction System - Implementation Guide

## Overview

This document describes the WhatsApp-like message reaction system that has been implemented. Users can now:
- React to messages with emoji
- Only have **ONE active reaction per message** (per user)
- **Replace** their reaction with a different emoji
- **Toggle** (remove) their reaction by clicking it again

## Key Features

### 1. Single Reaction per User
- Each user can have at most ONE reaction emoji per message
- Attempting to react with a different emoji **replaces** the previous one
- Clicking the same emoji **removes** the reaction (toggle behavior)

### 2. Visual Indicators

#### In Emoji Picker
- Currently reacted emoji shows a **blue dot indicator** and is **scaled up**
- Hover shows clear action: "Click to remove" vs "Click to react"

#### In Message Reactions
- User's own reactions have a **blue ring highlight** and checkmark (✓)
- Tooltip shows who reacted and which action will happen

### 3. Unique Identification
- Reactions are identified by the combination of **userId + messageId**
- The system ensures no duplicate reactions from the same user

## Frontend Implementation

### Components Updated

#### MessageBubble.vue
- **`userReactionEmoji` computed property**: Identifies the emoji the current user has reacted with
- **Enhanced emoji picker**: Shows visual feedback for current reaction
- **Enhanced reaction display**: Highlights user's own reactions with ring and checkmark

#### MessageList.vue
- **`handleReaction()` function**: Calls store action when user interacts with emoji

### Store Logic (useMessageStore.ts)

#### `addReaction()` Action
```typescript
async addReaction(channelId: string, messageId: string, emoji: string)
```

**Logic Flow:**
1. Find the message in store
2. Check if user has an existing reaction using `reactions_summary.find(r => r.reacted_by_me)`
3. Determine action type:
   - **ADD**: No previous reaction → add new emoji
   - **REPLACE**: Different emoji → replace old with new
   - **TOGGLE**: Same emoji → remove reaction
4. Pass `previous_emoji` to API for backend validation
5. Update store with returned message data

### API Integration (useMessagesApi.ts)

#### `reactToMessage()` Function
```typescript
export async function reactToMessage(data: {
  channel_id: string
  message_ids: string[]
  emoji: string
  previous_emoji?: string | null
}): Promise<AxiosResponse>
```

**New Parameter:**
- `previous_emoji`: The emoji the user previously reacted with (if any)
  - Used for backend to validate toggle/replace logic
  - Prevents accidental duplicate reactions

**Request Body Example:**
```json
{
  "channel_id": "channel123",
  "message_ids": ["msg456"],
  "emoji": "❤️",
  "previous_emoji": "👍"  // User replacing 👍 with ❤️
}
```

## Backend Implementation Requirements

Your backend must implement the following logic in the `/api/messages/react` endpoint:

### Algorithm

```pseudocode
function handleReaction(userId, messageId, newEmoji, previousEmoji):
  // Validate user owns the message action
  validate(user is authenticated)
  
  // Check for existing user reaction
  existingReaction = findReaction(userId, messageId)
  
  if newEmoji == previousEmoji:
    // TOGGLE: User clicked same emoji → REMOVE
    if existingReaction exists:
      deleteReaction(existingReaction)
      return success
    else:
      return error("No reaction to remove")
  
  else if existingReaction exists:
    // REPLACE: User has different reaction → UPDATE
    updateReaction(existingReaction, newEmoji)
    return success
  
  else:
    // ADD: User has no reaction → CREATE
    createReaction(userId, messageId, newEmoji)
    return success
  
  // Return updated message with reactions_summary
  return message
```

### Key Backend Requirements

1. **Unique Constraint**: Ensure only ONE reaction per (userId, messageId) combination
   ```sql
   ALTER TABLE message_reactions ADD UNIQUE (user_id, message_id);
   ```

2. **Delete on Toggle**: When `newEmoji == previousEmoji`, DELETE the reaction record
3. **Update on Replace**: When user has existing different emoji, UPDATE it (don't create new)
4. **Validate User**: Verify user is authenticated and owns the reaction action

5. **Return Format**: Include `reactions_summary` in response:
   ```json
   {
     "success": true,
     "data": {
       "message": {
         "id": "msg456",
         "reactions_summary": [
           {
             "emoji": "❤️",
             "count": 2,
             "reacted_by_me": true,
             "reacted_by": ["user123", "user456"]
           }
         ]
       }
     }
   }
   ```

### Database Example (Laravel/MySQL)

```php
// In your Message Reaction controller
public function react(Request $request)
{
    $validated = $request->validate([
        'channel_id' => 'required|string',
        'message_ids' => 'required|array',
        'emoji' => 'required|string',
        'previous_emoji' => 'nullable|string',
    ]);

    $userId = $request->user()->id;
    $messageId = $validated['message_ids'][0]; // First message
    $newEmoji = $validated['emoji'];
    $previousEmoji = $validated['previous_emoji'];

    // Check for existing reaction
    $existing = MessageReaction::where('user_id', $userId)
        ->where('message_id', $messageId)
        ->first();

    // TOGGLE: Same emoji clicked → DELETE
    if ($newEmoji === $previousEmoji && $existing) {
        $existing->delete();
    }
    // REPLACE: Different emoji → UPDATE
    elseif ($existing && $newEmoji !== $previousEmoji) {
        $existing->update(['emoji' => $newEmoji]);
    }
    // ADD: No existing → CREATE
    elseif (!$existing) {
        MessageReaction::create([
            'user_id' => $userId,
            'message_id' => $messageId,
            'emoji' => $newEmoji,
        ]);
    }

    // Return updated message with reactions_summary
    $message = Message::with('reactions')
        ->find($messageId);

    return response()->json([
        'success' => true,
        'data' => [
            'message' => $this->formatMessageWithReactions($message),
        ],
    ]);
}

private function formatMessageWithReactions($message)
{
    $userId = auth()->id();

    return [
        'id' => $message->id,
        'reactions_summary' => $message->reactions
            ->groupBy('emoji')
            ->map(fn ($group, $emoji) => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'reacted_by_me' => $group->contains('user_id', $userId),
                'reacted_by' => $group->pluck('user_id')->unique()->values(),
            ])
            ->values()
            ->toArray(),
    ];
}
```

## User Experience Flow

### Scenario 1: Adding First Reaction
1. User hovers over message → sees "+ emoji" button
2. Clicks emoji button → emoji picker appears
3. All emojis shown with normal opacity
4. User clicks "❤️" → reaction added
5. Message shows "❤️ 1" badge with ring highlight

### Scenario 2: Toggling Reaction
1. User sees message with "❤️ 1" (their reaction)
2. Clicks emoji button → emoji picker appears
3. "❤️" shows as **scaled up** with **blue dot** indicator
4. User clicks same "❤️" → reaction removed
5. Message no longer shows "❤️" badge

### Scenario 3: Replacing Reaction
1. User sees message with "❤️ 1" (their reaction)
2. Clicks emoji button → emoji picker appears
3. "❤️" is marked with indicator
4. User clicks "😂" → replaces ❤️ with 😂
5. Message now shows "😂 1" with ring highlight

## Testing Checklist

### Frontend Tests
- [ ] Can add first reaction to message
- [ ] Can see own reaction highlighted in picker
- [ ] Can toggle (remove) own reaction
- [ ] Can replace reaction with different emoji
- [ ] Visual indicators show correctly
- [ ] Hover tooltips display correct action
- [ ] Clicking same emoji when reacted removes reaction
- [ ] Clicking different emoji replaces reaction

### Backend Tests
- [ ] Unique constraint prevents duplicate user reactions
- [ ] Previous emoji matches before deleting
- [ ] Reaction properly deleted when toggling
- [ ] Reaction properly updated when replacing
- [ ] Reaction created when adding new
- [ ] `reactions_summary` includes `reacted_by_me` flag
- [ ] Count is accurate across all scenarios

## Debugging

### Common Issues

**Problem**: User can react multiple times with same emoji
- **Solution**: Check backend unique constraint on (user_id, message_id)
- **Frontend**: Verify `previous_emoji` is being sent correctly

**Problem**: Replacing emoji creates duplicate instead of updating
- **Solution**: Backend must check for existing reaction and UPDATE not INSERT
- **Logic**: Only create new reaction if `!existing`

**Problem**: Toggling doesn't remove reaction
- **Solution**: Verify backend compares `newEmoji === previousEmoji` before deleting
- **Logging**: Add logs in frontend `addReaction()` to see action type

**Problem**: Reaction buttons show incorrect highlight
- **Solution**: Check that `reactions_summary[].reacted_by_me` is correct from API
- **Verify**: Use browser DevTools to inspect `message.reactions_summary`

## Console Logging

The system includes detailed logging at key points:

```typescript
// In store:
[Message Store] Reaction action: {
  messageId: "msg456",
  newEmoji: "❤️",
  previousEmoji: "👍",
  action: "REPLACE"  // or "ADD" or "TOGGLE/REMOVE"
}

[Message Store] Reaction updated successfully: {
  messageId: "msg456",
  newReactions: [...]
}

// In API:
[Messages API] Reacting to message: {
  emoji: "❤️",
  previous_emoji: "👍",
  isToggle: false,
  isReplace: true
}
```

Enable console in DevTools to see these logs.

## Socket.IO Integration (If Using Real-time)

If you have Socket.IO implemented, emit a reaction event:

```typescript
// In store after successful reaction:
socket.emit('message:reaction', {
  channelId,
  messageId,
  emoji,
  action: 'toggle' | 'replace' | 'add'
})

// Listener in socket handler:
socket.on('message:reaction', (data) => {
  const message = messages.find(m => m.id === data.messageId)
  // Update message.reactions_summary
})
```

## Migration Notes

If migrating from old reaction system:

1. **Data Cleanup**: Remove duplicate reactions from same user on same message
   ```sql
   DELETE FROM message_reactions mr
   WHERE mr.id NOT IN (
     SELECT MIN(id) FROM message_reactions 
     GROUP BY user_id, message_id
   );
   ```

2. **Add Unique Constraint**:
   ```sql
   ALTER TABLE message_reactions 
   ADD CONSTRAINT unique_user_message_reaction 
   UNIQUE (user_id, message_id);
   ```

3. **Test Thoroughly**: All scenarios before rolling to production
