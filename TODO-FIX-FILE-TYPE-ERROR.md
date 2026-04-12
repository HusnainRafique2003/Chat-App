# Fix "File type not allowed" Backend Validation Error

Approved plan to resolve Laravel validation error on file uploads by aligning client-side validation with likely backend expectations and improving error handling.

## Steps:

### 1. Update Client Validation in RichMessageComposer.vue [✅ COMPLETED]
   - Expand `ALLOWED_MIME_TYPES` to include: image/webp, image/svg+xml, application/vnd.rar, application/epub+zip, etc.
   - Expand `ALLOWED_EXTENSIONS`: webp, svg, rar, epub, 7z.
   - Enhance `validateFile()`: Dual check MIME + extension; warn on mismatches.
   - Update error message to match backend phrasing.

### 2. Improve Error Handling in useMessageStore.ts [PENDING]
   - In `createMessage()`: Parse `error.response.data.errors.file[0]` specifically.
   - Map to user-friendly toast: "File type not allowed by server. Try JPG/PNG/PDF."
   - Add log for debugging failed MIME.

### 3. Minor Error Logging in useMessagesApi.ts [PENDING]
   - Log full `error.response.data.errors` object.

### 4. Testing [PENDING]
   - Test uploads: JPG, WEBP, HEIC, PDF, ZIP, MP4, MP3, DOCX.
   - Verify toasts show correctly.
   - Check console for logs.

### 5. Linting & Completion [PENDING]
   - Run `npx eslint . --fix`.
   - Archive this TODO or mark ✅.

**Progress**: 0/5 complete

