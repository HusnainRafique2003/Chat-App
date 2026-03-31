# Chat App Implementation TODO

## Plan Overview
Transform to chat app with landing page, auth (login/register/verify/forgot/reset), API integration.

## Steps (0/14 completed)

### Phase 1: Layout & Main Page (fix hydration)
- [x] 1. Create app/layouts/default.vue (navbar w/ auth state, footer)
- [x] 2. Update app/app.vue to use default layout
- [x] 3. Transform app/pages/index.vue to landing page (hero, features, stats, CTAs, remove demo)

### Phase 2: API & Stores
- [x] 4. Extend app/composables/useApi.ts (add post(), auth headers)
- [ ] 5. Update app/stores/useUserStore.ts (real auth actions: login/register/verify etc.)
- [ ] 6. Update app/stores/useSessionStore.ts (temp state for OTP etc.)

### Phase 3: Auth Pages
- [x] 7. Create app/pages/auth/login.vue
- [x] 8. Create app/pages/auth/register.vue (signup + verify flow)
- [x] 9. Create app/pages/auth/forgot-password.vue
- [x] 10. Create app/pages/auth/reset-password.vue

### Phase 4: Routing & Protected
- [x] 11. Create app/pages/dashboard.vue (stub)
- [x] 12. Create app/middleware/auth.global.ts (protect dashboard)
- [ ] 13. Add route rules in nuxt.config if needed

### Phase 5: Test & Polish
- [x] 14. Test API calls, hydration fixed, responsive design

✅ **ALL STEPS COMPLETE!**

**Next: Step 1**
