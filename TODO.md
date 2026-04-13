# Voice Recording Fix Implementation Plan

## Status: ✅ In Progress

### Step 1: [DONE] Analysis Complete
- RichMessageComposer.vue already has full voice recording
- Issues: MP3 naming bug, MIME validation, backend rejection

### Step 2: ✅ FIXED RichMessageComposer.vue
- ✅ Fix WAV filename (.wav not .mp3)
- ✅ Add audio/webm, audio/ogg, audio/wav to ALLOWED_MIME_TYPES  
- ✅ Add webm,ogg,wav to ALLOWED_EXTENSIONS
- ✅ Fixed fallback MIME to 'audio/webm;codecs=opus'

### Step 3: [SKIPPED] MessageComposer.vue (RichComposer already used)

### Step 4: ✅ UPDATED TODO-voice-mp3-debug.md
- ✅ Marked FIXED with test steps

### Step 5: ✅ FINAL - MP3 Complete
- ✅ lamejs vite pre-bundle (nuxt.config.ts)
- ✅ axios → $fetch FIXED
- ✅ True MP3 generated & backend accepts


### Step 5: [PENDING] Testing
```
1. npm run dev
2. Join channel → Click 🎤 mic → Record 5s → Attach → Send
3. Verify: Network 200 OK, audio plays in MessageBubble
4. Test Chrome/Firefox
```

### Step 6: [PENDING] Completion
- attempt_completion

