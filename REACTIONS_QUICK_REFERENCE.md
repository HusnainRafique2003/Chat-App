# WhatsApp-like Reactions - Quick Reference

## 🛡️ Frontend Safeguard Added

**Until backend is updated**, the frontend now prevents duplicate reactions:
- If user already has a reaction, they **MUST** use the emoji picker to change it
- Clicking other reaction badges when they have a reaction is disabled
- Clear tooltip guides users: "Use emoji picker to change"
- Deduplication applied to any existing duplicate reactions from API

## What Changed?

Your reaction system now works like WhatsApp: **one reaction per user per message**.

## The Three Actions

| Action | Condition | Result |
|--------|-----------|--------|
| **ADD** | User has no reaction yet | New reaction emoji appears |
| **REPLACE** | User clicks different emoji | Old emoji replaced with new one |
| **TOGGLE** | User clicks same emoji again | Reaction removed entirely |

## Code Changes Summary

### 1. API Call (`useMessagesApi.ts`)
```typescript
// OLD: Only sent channel_id, message_ids, emoji
export async function reactToMessage(data: {
  channel_id: string
  message_ids: string[]
  emoji: string
})

// NEW: Also sends what emoji the user previously had
export async function reactToMessage(data: {
  channel_id: string
  message_ids: string[]
  emoji: string
  previous_emoji?: string | null  // ← NEW
})
```

### 2. Store Logic (`useMessageStore.ts`)
```typescript
async addReaction(channelId: string, messageId: string, emoji: string) {
  // NEW: Find user's current reaction first
  const userReaction = message.reactions_summary.find(r => r.reacted_by_me)
  const previousEmoji = userReaction?.emoji || null
  
  // Determine action:
  // - ADD if previousEmoji is null
  // - REPLACE if different emoji
  // - TOGGLE if same emoji
  
  // Pass previousEmoji to API
  await reactToMessage({ ..., previous_emoji: previousEmoji })
}
```

### 3. UI (`MessageBubble.vue`)
```typescript
// NEW: Computed property for user's current reaction
const userReactionEmoji = computed(() => {
  const userReaction = props.message.reactions_summary.find(r => r.reacted_by_me)
  return userReaction?.emoji || null
})

// Emoji picker now:
// - Highlights current reaction with blue dot
// - Scales up current reaction
// - Shows tooltip: "Click to remove X" if it's their emoji

// Reaction badges now:
// - Show ring highlight if it's user's reaction
// - Show checkmark (✓) indicator
// - Different tooltip based on whether user reacted
```

## Backend Implementation (Critical!)

Your backend `/api/messages/react` endpoint **MUST** implement this logic:

```python
def react_to_message(user_id, message_id, emoji, previous_emoji):
    existing = Reaction.query.filter_by(
        user_id=user_id, 
        message_id=message_id
    ).first()
    
    # Case 1: TOGGLE - same emoji clicked
    if emoji == previous_emoji:
        if existing:
            existing.delete()  # Remove reaction
        return {"success": True}
    
    # Case 2: REPLACE - different emoji
    elif existing:
        existing.emoji = emoji  # Update existing
        return {"success": True}
    
    # Case 3: ADD - no existing reaction
    else:
        Reaction.create(user_id, message_id, emoji)
        return {"success": True}
```

**Database constraint (required!):**
```sql
UNIQUE(user_id, message_id)  -- One reaction per user per message
```

## Testing the Feature

### Test 1: Add Reaction
1. Open a message
2. Click emoji button → emoji picker appears
3. Click any emoji → reaction added
4. That emoji now has a ring and checkmark

### Test 2: Toggle Reaction  
1. Message shows your reaction (e.g., "❤️ 1")
2. Click emoji button → current emoji highlighted with blue dot
3. Click same emoji → reaction removed
4. Badge disappears

### Test 3: Replace Reaction
1. Message shows your reaction (e.g., "❤️ 1")
2. Click emoji button → "❤️" is marked
3. Click different emoji (e.g., "😂")
4. Reaction changes from "❤️ 1" to "😂 1"

## Frontend-Only Testing (Without Backend)

If backend changes are pending, you can still test the frontend logic:

```javascript
// In browser console on a message with reactions:
const msg = messageStore.messages[0]
console.log(msg.reactions_summary)

// Should show:
[
  { emoji: "❤️", count: 2, reacted_by_me: true, reacted_by: ["user1", "user2"] },
  { emoji: "👍", count: 1, reacted_by_me: false, reacted_by: ["user3"] }
]
```

## Common Mistakes to Avoid

### ❌ Backend: Creating duplicate reactions instead of updating
```python
# WRONG - always creates new
Reaction.create(user_id, message_id, emoji)

# RIGHT - check if exists first
if existing:
    existing.emoji = emoji
else:
    Reaction.create(user_id, message_id, emoji)
```

### ❌ Backend: Not deleting on toggle
```python
# WRONG - still in database even after toggle
if emoji == previous_emoji:
    return {"success": True}  # Forgot to delete!

# RIGHT
if emoji == previous_emoji:
    existing.delete()
    return {"success": True}
```

### ❌ Backend: No unique constraint
```sql
-- WRONG - allows duplicates
CREATE TABLE message_reactions (
    id, user_id, message_id, emoji
)

-- RIGHT
CREATE TABLE message_reactions (
    id, user_id, message_id, emoji,
    UNIQUE(user_id, message_id)
)
```

### ❌ Frontend: Not passing previous_emoji
```typescript
// WRONG - backend can't tell if it's toggle or add
await reactToMessage({ channel_id, message_ids, emoji })

// RIGHT
await reactToMessage({ 
    channel_id, 
    message_ids, 
    emoji,
    previous_emoji: userReaction?.emoji || null  // ← Include this!
})
```

## Debug Commands

Check what's being sent to the backend:
```javascript
// In browser Network tab or console:
// Look for POST /api/messages/react
// Check Request payload - should include:
{
  "channel_id": "...",
  "message_ids": ["..."],
  "emoji": "❤️",
  "previous_emoji": null  // or the user's previous emoji
}
```

Check reaction state:
```javascript
// In console on a message:
const msg = messageStore.messages[0]
const userReaction = msg.reactions_summary.find(r => r.reacted_by_me)
console.log('User reaction:', userReaction?.emoji || 'None')
console.log('All reactions:', msg.reactions_summary)
```

## Files Modified

1. **app/composables/useMessagesApi.ts**
   - Updated `reactToMessage()` to include `previous_emoji` parameter
   - Added detailed logging

2. **app/stores/useMessageStore.ts**
   - Updated `addReaction()` action
   - Added logic to detect current user reaction
   - Passes `previous_emoji` to API
   - Added detailed logging

4. **app/components/messages/MessageBubble.vue**
   - Added `userReactionEmoji` computed property
   - Enhanced emoji picker with visual indicators
   - Enhanced reaction display with highlighting
   - Added frontend protection: prevents clicking other reactions if user already reacted

5. **app/components/messages/MessageList.vue**
   - Updated `handleReaction()` to display error messages
   - Shows warning when user tries to add multiple reactions

6. **WHATSAPP_REACTIONS.md** (new)
   - Comprehensive implementation guide
   - Backend requirements
   - Database examples
   - Testing checklist

## Next Steps

1. ✅ Frontend changes complete WITH safeguards
2. ✅ Reaction deduplication implemented
3. ⏳ Update backend `/api/messages/react` endpoint
4. ⏳ Add unique constraint to database
5. ⏳ Test all three scenarios (add, replace, toggle)
6. ⏳ Deploy and monitor

## Frontend Safeguard Details

While backend is being updated, the frontend now:

### 1. **Deduplicates Reactions**
   - Automatically cleans up any duplicate reactions from API responses
   - Uses `deduplicateReactions()` method in store
   - Logs deduplication actions for debugging

### 2. **Prevents Duplicate Reactions**
   - If user already has a reaction, clicking other reaction badges does nothing
   - Users must use the emoji picker to change/remove their reaction
   - Prevents accidental duplicate submissions

### 3. **Shows Clear Feedback**
   - Disabled state for reaction buttons when user already reacted
   - Tooltip: "Use emoji picker to change"
   - Toast warning if user tries to add another reaction via API

This safeguard ensures correct behavior even if the backend creates duplicates temporarily.
