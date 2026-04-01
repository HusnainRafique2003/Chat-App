# TODO: Fix Remaining TS Errors (Blocking Nuxt Dev UI)

## Updated Plan for 7 Errors:
- [ ] Step 1: Fix app/components/AppSidebar.vue (type arrays, result?., ref fix)
- [ ] Step 2: Fix app/components/modals/WorkspaceModal.vue (add icon/isPrivate to interface)
- [ ] Step 3: Verify app/components/messages/MessageWorkspace.vue template refs
- [ ] Step 4: Run `npx nuxi typecheck` (expect 0 errors)
- [ ] Step 5: `pnpm dev` - landing page loads
- [ ] Step 6: Test login → dashboard UI

Progress: Original userStore errors fixed. Now fixing build blockers.
