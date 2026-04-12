# Chat App Task Tracker

## Remove Paragraph Tags from Messages (In Progress)
**Status**: [3/4 complete]

### ✅ 1. Plan approved and TODO created
### ✅ 2. Edit RichMessageComposer.vue 
   - Added `stripHtmlToText()` + `isPlainContent()` helpers
   - Updated `getHTMLContent()` - strips outer <p> wrapper for plain text
   - Modified `sendMessage()` - plain text → textContent, formatted → HTML  
### ☐ 3. Test scenarios
   - Plain single-line text ✓ no <p>
   - Multi-line/formatted ✓ preserves HTML
   - Backend storage ✓ plain text  
   - Added console.log for debugging
### ☐ 4. Update TODO-trim-messages.md & complete task
   - Run `pnpm dev`
   - Test in browser
   - `attempt_completion`

**Next**: Test implementation
