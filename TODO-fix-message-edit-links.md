# Fix Message Edit Links Preservation

## Plan Steps (Approved)

**Primary Fix**: Replace EditMessageModal's plain textarea with Tiptap rich editor.

## TODO Steps

### 1. [x] Create Rich Editor in EditMessageModal.vue
- Copy Tiptap setup from RichMessageComposer.vue ✅
- Add minimal toolbar: Bold, Italic, Link ✅
- Load message.content (HTML) into editor on open ✅
- Extract getHTMLContent() on save ✅

### 2. [x] Remove HTML Stripping
- Delete stripHtmlTags() function ✅
- Update watch() to load raw HTML content ✅
- Remove plain textarea ✅

### 3. [x] Update UI & Logic
- Replace textarea with EditorContent ✅
- Keep change detection (compare HTML) ✅
- Add link dialog support (minimal) ✅

### 4. [ ] Test
- Create message with link
- Edit text → verify link preserved
- Edit link text → verify update works
- Verify rendering in MessageBubble

### 5. [ ] Cleanup
- Remove unused refs/code
- Mark complete

**Status**: Starting Step 1
