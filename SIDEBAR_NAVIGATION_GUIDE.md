# Sidebar Navigation Guide

## What You Should See

### After Login

```
┌─────────────────────────────────────────┐
│ CHATSPHERE                              │
├─────────────────────────────────────────┤
│                                         │
│  [Workspace Buttons]                    │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ UZ  │  │ UR  │  │ UW  │            │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  WORKSPACE                              │
│  Uzair workspace                        │
│  Default workspace                      │
│                                         │
│  TEAMS                                  │
│  👥 Team 1                              │
│  👥 Team 2                              │
│                                         │
│  CHANNELS                               │
│  # general                              │
│  # random                               │
│  # dev                                  │
│                                         │
│  DIRECT MESSAGES                        │
│  (none yet)                             │
│                                         │
├─────────────────────────────────────────┤
│ [Logout Button]                         │
└─────────────────────────────────────────┘
```

## Step-by-Step Navigation

### Step 1: Workspace Selection
```
1. Look at top of sidebar
2. See workspace buttons (initials like "UZ", "UR", "UW")
3. Click any button to select workspace
4. Selected workspace has blue background
```

### Step 2: View Workspace Details
```
1. After selecting workspace
2. See workspace name and description below buttons
3. Example: "Uzair workspace - Default workspace"
```

### Step 3: Select Team
```
1. Look at TEAMS section
2. See list of teams (👥 icon)
3. Click team to select it
4. Selected team has darker background
```

### Step 4: View Channels
```
1. After selecting team
2. Look at CHANNELS section
3. See list of channels (# icon)
4. Click channel to open messaging
```

### Step 5: Send Messages
```
1. After selecting channel
2. Main area shows messaging interface
3. Type message in composer at bottom
4. Click Send or press Enter
```

## Sidebar Sections

### Workspaces (Top)
- Shows all workspaces you're member of
- Displays as buttons with initials
- Click to switch workspace
- Only one can be active at a time

### Workspace Info
- Shows selected workspace name
- Shows workspace description
- Updates when you switch workspaces

### Teams
- Shows teams in selected workspace
- Click to select team
- Teams change when you switch workspaces
- Shows "No teams yet" if workspace has no teams

### Channels
- Shows channels in selected team
- Click to open messaging
- Channels change when you switch teams
- Shows "No channels yet" if team has no channels
- Plus icon (+) to create new channel

### Direct Messages
- For future 1-on-1 conversations
- Currently empty
- Will show when you start DMs

## Workspace Buttons Explained

Each workspace shows as a button with initials:

| Button | Workspace |
|--------|-----------|
| UZ | Uzair workspace |
| UR | Uzair Raza Bhutta Workspace |
| UW | Uzair Workspace |

Click any button to switch to that workspace.

## What Happens When You Click

### Click Workspace Button
```
1. Workspace becomes active (blue background)
2. Workspace name/description updates
3. Teams list updates to show teams in that workspace
4. Channels list clears (will load when you select team)
```

### Click Team
```
1. Team becomes active (darker background)
2. Channels list updates to show channels in that team
3. Ready to select a channel
```

### Click Channel
```
1. Channel becomes active (darker background)
2. Main area shows messaging interface
3. Messages load from backend
4. Ready to send messages
```

## Troubleshooting

### Workspaces Not Showing
- Check if you're logged in
- Check browser console for errors
- Verify token is correct
- Try refreshing page

### Teams Not Showing
- Make sure you selected a workspace
- Check if workspace has teams
- Try clicking different workspace
- Check console for errors

### Channels Not Showing
- Make sure you selected a team
- Check if team has channels
- Try clicking different team
- Check console for errors

### Messaging Not Showing
- Make sure you selected a channel
- Check if channel exists
- Try clicking different channel
- Check console for errors

## Console Debugging

Open DevTools (F12) → Console and check for:

```javascript
// Should see these logs:
"Dashboard - Token available, fetching workspaces"
"Workspaces loaded: 3"
"Dashboard - Workspace changed, fetching teams for: ..."
"Teams loaded: 1"
"Dashboard - Team changed, fetching channels for: ..."
"Channels loaded: 5"
```

If you don't see these logs, something isn't loading correctly.

## Expected Behavior

### First Load
1. ✅ Workspace buttons appear
2. ✅ First workspace auto-selected
3. ✅ Teams load for that workspace
4. ✅ First team auto-selected
5. ✅ Channels load for that team

### After Switching Workspace
1. ✅ Workspace button highlights
2. ✅ Workspace info updates
3. ✅ Teams list updates
4. ✅ First team auto-selected
5. ✅ Channels load for new team

### After Switching Team
1. ✅ Team highlights
2. ✅ Channels list updates
3. ✅ First channel auto-selected
4. ✅ Messaging interface shows

## Summary

✅ Workspaces load and display
✅ Teams load when workspace selected
✅ Channels load when team selected
✅ Messaging ready when channel selected
✅ Navigation is smooth and responsive
