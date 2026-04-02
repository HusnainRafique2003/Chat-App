# Where to See the Rich Editor

## Two Places to Access the Rich Message Editor

### 1. MessageWorkspace Demo Page
**URL:** `/dashboard` (if you navigate to the MessageWorkspace component)

**Features:**
- Full demo of rich editor
- Channel ID input to load messages
- Search functionality
- Message display with reactions
- Edit/Delete messages
- Integration notes panel

**What You'll See:**
```
┌─────────────────────────────────────────────────────────┐
│ Message Workspace                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Channel ID Input] [Load Messages Button]             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ # general                                       │   │
│  │ Messages loaded                                 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │ [Message bubbles displayed here]                │   │
│  │                                                 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ┌─ TOOLBAR ─────────────────────────────────┐  │   │
│  │ │ B  I  🔗  {}  📎  🎤  📅                  │  │   │
│  │ ├────────────────────────────────────────────┤  │   │
│  │ │ [Rich Text Editor Area]                   │  │   │
│  │ │ Type your message here...                 │  │   │
│  │ │                                            │  │   │
│  │ ├────────────────────────────────────────────┤  │   │
│  │ │                    [Send Message Button]  │  │   │
│  │ └────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Dashboard Messaging Interface
**URL:** `/dashboard` (main dashboard with sidebar)

**Features:**
- Sidebar with teams and channels
- Click channel to open messaging
- Rich editor at bottom
- Message thread display
- Professional layout

**What You'll See:**
```
┌──────────────┬─────────────────────────────────────────┐
│ SIDEBAR      │ MAIN CONTENT                            │
│              │                                         │
│ Teams        │ ┌─────────────────────────────────────┐ │
│ • Team 1     │ │ # general                           │ │
│ • Team 2     │ │ 5 unread messages                   │ │
│              │ ├─────────────────────────────────────┤ │
│ Channels     │ │                                     │ │
│ • general    │ │ [Message bubbles]                   │ │
│ • random     │ │                                     │ │
│ • dev        │ │                                     │ │
│              │ ├─────────────────────────────────────┤ │
│              │ │ ┌─ TOOLBAR ─────────────────────┐  │ │
│              │ │ │ B  I  🔗  {}  📎  🎤  📅    │  │ │
│              │ │ ├────────────────────────────────┤  │ │
│              │ │ │ [Rich Text Editor]             │  │ │
│              │ │ │                                │  │ │
│              │ │ ├────────────────────────────────┤  │ │
│              │ │ │              [Send Button]    │  │ │
│              │ │ └────────────────────────────────┘  │ │
│              │ └─────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────┘
```

## Toolbar Buttons Explained

### Text Formatting
- **B** (Bold) - Select text and click, or Ctrl+B
- **I** (Italic) - Select text and click, or Ctrl+I
- **🔗** (Link) - Click to enter URL, then select text

### Code
- **{}** (Code Block) - Insert multi-line code with syntax highlighting

### Attachments
- **📎** (File) - Click to select file from computer
- **🎤** (Voice) - Click to start recording, click again to stop

### Date
- **📅** (Calendar) - Click to insert today's date

## How to Test

### Test Text Formatting
1. Type some text
2. Select text with mouse
3. Click Bold button - text becomes **bold**
4. Click Italic button - text becomes *italic*

### Test Code Block
1. Click {} button
2. Type code (e.g., `console.log('hello')`)
3. Code appears with syntax highlighting

### Test File Upload
1. Click 📎 button
2. Select a file from your computer
3. File name appears below toolbar
4. Click X to remove file

### Test Voice Recording
1. Click 🎤 button
2. Browser asks for microphone permission
3. Speak into microphone
4. Click 🎤 again to stop
5. "Voice note recorded" appears
6. Click "Attach" to include in message

### Test Date Insertion
1. Click 📅 button
2. Click "Today" button
3. Current date appears in editor as "📅 Month Day, Year"

### Test Sending
1. Type message or use formatting
2. Press Enter or click Send button
3. Message is sent with all formatting preserved

## Components Used

- **RichMessageComposer.vue** - The rich editor component
- **MessageBubble.vue** - Displays sent messages
- **MessageList.vue** - Message thread container
- **MessageWorkspace.vue** - Demo/workspace page

## API Integration

When backend resolves token issues, messages will be sent with:
- `html` - Formatted HTML content
- `text` - Plain text version
- `file` - Optional file attachment

Example payload:
```json
{
  "html": "<p><strong>Hello</strong> world</p>",
  "text": "Hello world",
  "file": null
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Toggle bold |
| Ctrl+I | Toggle italic |
| Ctrl+` | Toggle code |
| Enter | Send message |
| Shift+Enter | New line in editor |

## Styling Features

- ✅ Dark mode support
- ✅ Responsive design
- ✅ Professional appearance
- ✅ Syntax highlighting
- ✅ Smooth animations
- ✅ Hover effects
- ✅ Focus states

## Next Steps

1. **Test the editor** - Try all features
2. **Check console** - Look for any errors
3. **Test with backend** - Once token issue is resolved
4. **Add more features** - Emoji picker, mentions, etc.
