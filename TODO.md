# Nuxt Dev Server Fix - TODO Steps

## Plan Status: Approved ✅

**Step 1: Create TODO.md** ⭕ (current)

**Step 2: Fix CSS warnings in main.css** ✅
- Move @import fonts to TOP
- Fix .truncate-2: display: box → display: flex

**Step 3: Update nuxt.config.ts** ✅
- Remove/comment vite.optimizeDeps.include

**Step 4: Clean cache & reinstall** ✅
- Kill dev servers (Ctrl+C)
- `pnpm store prune && rm -rf .nuxt node_modules/.vite && pnpm i`

**Step 5: Test dev server** 🔄
- `pnpm dev`
- Check http://localhost:3000/

**Step 6: Complete** ⭕

