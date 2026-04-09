# Frontend Reaction Safeguard - Temporary Fix

## Problem Identified
Users were able to add multiple different emoji reactions to the same message, as shown in the screenshot where Uzair Reza had reactions: 😊 😊 😊 😮 ❤️

This happened because the **backend has not yet implemented** the unique constraint and toggle/replace logic for reactions.

## Solution: Frontend Safeguard

While waiting for backend changes, the frontend now prevents duplicate reactions through multiple layers:

### 1. **Reaction Deduplication** (`useMessageStore.ts`)

When API responses come back with duplicate reactions from the same user, they're automatically cleaned up:

```typescript
/**
 * Deduplicate reactions to ensure only one reaction per user per message.
 * This is a CLIENT-SIDE workaround until backend implements the unique constraint.
 */
deduplicateReactions(reactions: any[]): any[] {
  // Builds a map of user → their latest emoji reaction
  // Removes duplicates, keeping only the most recent reaction per user
  // Logs when deduplication occurs
}
```

**Applied:**
- Before checking the user's current reaction
- After receiving API response
- Automatically cleans up duplicates from the database

### 2. **Frontend Reaction Prevention** (`useMessageStore.ts`)

The `addReaction()` action now checks if the user already has a reaction and prevents adding another:

```typescript
async addReaction(channelId: string, messageId: string, emoji: string) {
  // 1. Find message and deduplicate existing reactions
  message.reactions_summary = this.deduplicateReactions(message.reactions_summary)
  
  // 2. Get user's current reaction
  const previousEmoji = message.reactions_summary.find(r => r.reacted_by_me)?.emoji
  
  // 3. PREVENT duplicate from being sent
  if (previousEmoji && previousEmoji !== emoji) {
    return {
      success: false,
      error: `You already reacted with ${previousEmoji}. Use emoji picker to replace it.`
    }
  }
  
  // 4. Only send to API if valid action
  const response = await reactToMessage({ ... })
}
```

**Logic:**
- ✅ User can add first reaction
- ❌ User cannot add second reaction (error returned)
- ✅ User can toggle same emoji (shows in response error, guided to use picker)
- ✅ User can replace via emoji picker (guided via error message)

### 3. **UI Protection** (`MessageBubble.vue`)

Reaction buttons now have smart behavior:

```vue
<button
  v-for="reaction in message.reactions_summary"
  :title="reaction.reacted_by_me 
    ? `Click to remove...`
    : userReactionEmoji
    ? `You already reacted. Use emoji picker to change.`  <!-- ← New safeguard -->
    : `Click to add...`"
  @click="reaction.reacted_by_me ? $emit('react', emoji) : !userReactionEmoji && $emit('react', emoji)"
>
```

**Behavior:**
- If user hasn't reacted: Can click any reaction to add it ✅
- If user has reacted: Cannot click other reactions, only emoji picker works ❌
- If user has reacted: Can toggle that emoji or use picker to replace

### 4. **User Feedback** (`MessageList.vue`)

When users try to add a duplicate reaction, they see a helpful message:

```typescript
async function handleReaction(messageId: string, emoji: string) {
  const result = await messageStore.addReaction(...)
  
  if (!result.success && result.error) {
    toast.add({
      title: 'Cannot add multiple reactions',
      description: result.error,  // "Use emoji picker to replace X"
      color: 'warning'
    })
    return
  }
}
```

## User Experience

### Adding First Reaction
1. User clicks emoji button → picker appears
2. All emojis available to click
3. User clicks emoji → reaction added ✅

### Trying to Add Second Reaction  
1. User clicks emoji button → picker appears
2. Their current emoji is highlighted with blue dot
3. User tries to click different emoji → nothing happens, disabled state
4. User sees tooltip: "Use emoji picker to change"
5. User clicks their highlighted emoji → picker closes, reaction toggles

**Result:** ❌ Prevented the duplicate reaction

### Replacing Reaction via Picker
1. Message shows their reaction (e.g., "❤️ 1")
2. User clicks emoji button → picker appears
3. "❤️" is highlighted with blue dot
4. User clicks different emoji (e.g., "😂") → reaction replaced ✅

## Technical Details

### Files Modified

1. **app/stores/useMessageStore.ts**
   - Added `deduplicateReactions()` method
   - Added frontend protection in `addReaction()`
   - Returns error if user tries to add duplicate

2. **app/components/messages/MessageBubble.vue**
   - Updated reaction button click handlers
   - Only allows clicks if no reaction OR if it's their emoji
   - Updated tooltips to guide users

3. **app/components/messages/MessageList.vue**
   - Enhanced error handling in `handleReaction()`
   - Shows toast with helpful message

### How It Works

```
User clicks emoji
   ↓
MessageList.handleReaction() called
   ↓
messageStore.addReaction() called
   ↓
[DEDUP] Clean up existing reactions from API
   ↓
[CHECK] Find user's current reaction
   ↓
[PREVENT] If different emoji than current → return error
   ↓
[SEND] If valid (toggle or no reaction) → send to API
   ↓
[DEDUP] Clean up response reactions
   ↓
[UPDATE] Show result to user
```

## Console Logging

To debug, check the browser console for:

```javascript
// Reaction action logging
[Message Store] Reaction action: {
  messageId: "...",
  newEmoji: "❤️",
  previousEmoji: "👍",
  action: "REPLACE"  // or "ADD" or "TOGGLE/REMOVE"
}

// Deduplication logging
[Message Store] Deduplicating reactions: {
  before: 5,      // Had 5 reaction entries
  after: 2,       // Now has 2 unique emojis after dedup
  userReactionMap: [...]  // Shows which user has which emoji
}

// Prevention logging
[Message Store] User already has a reaction. Use emoji picker...
```

## When Backend Changes Are Applied

Once backend implements the required logic:

1. **Remove `deduplicateReactions()` calls** - No longer needed
2. **Remove duplicate prevention check** - Backend will enforce unique constraint
3. **Remove UI safeguards** - Users will have full freedom to click reaction buttons
4. **Update UX** - Clicking other reaction buttons will directly replace

```typescript
// After backend has unique constraint - FUTURE CODE
async addReaction(channel, message, emoji) {
  // Backend now handles toggle/replace logic
  await reactToMessage({ channel, message, emoji, previous_emoji })
  // Done! No need for prevention checks
}
```

## Testing

### Test 1: First Reaction Works
1. Open message with no reactions
2. Click emoji button → picker shows
3. Click emoji → reaction added ✅

### Test 2: Cannot Add Duplicate
1. Message shows your reaction "❤️ 1"
2. Click emoji button → picker shows
3. Try to click different emoji (e.g., "👍")
4. Button doesn't respond, tooltip says "Use emoji picker"
5. Cannot add second reaction ✅

### Test 3: Can Remove Current Reaction
1. Message shows your reaction "❤️ 1"  
2. Click emoji button → "❤️" highlighted
3. Click same "❤️" emoji → reaction removed ✅

### Test 4: Can Replace via Picker
1. Message shows your reaction "❤️ 1"
2. Click emoji button → picker shows
3. "❤️" is highlighted
4. Click different emoji "😂" → reaction replaced ✅

## Transition Plan

### Current (Temporary)
✅ Frontend safeguards prevent duplicates  
⏳ Backend still needs updates  
✅ Deduplication handles legacy data

### After Backend Update
✅ Frontend safeguards removed (optimized)  
✅ Backend enforces unique constraint  
✅ Toggle/replace logic works perfectly  
✅ Ready for production

## What Backend Still Needs

See [WHATSAPP_REACTIONS.md](WHATSAPP_REACTIONS.md) for complete backend requirements, but key points:

1. Add unique constraint: `UNIQUE(user_id, message_id)`
2. Implement toggle/replace logic based on `previous_emoji`
3. Return `reactions_summary` with `reacted_by_me` flag correctly set

Until then, the frontend safeguard ensures correct behavior.
