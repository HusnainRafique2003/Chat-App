# How to Restart and Test the Application

## Issue
After updating the workspace API, the dev server may have cached old module exports. This causes errors like:
```
SyntaxError: The requested module does not provide an export named 'addMembersToWorkspace'
```

## Solution: Restart the Dev Server

### Step 1: Stop the Dev Server
- Press `Ctrl+C` in the terminal where the dev server is running
- Wait for it to fully stop

### Step 2: Clear Build Cache
Run one of these commands:

**Option A - Using npm:**
```bash
npm run dev:clean
```

**Option B - Manual cleanup:**
```bash
rm -rf .nuxt .vite node_modules/.vite
npm run dev
```

**Option C - Just restart (if cache isn't the issue):**
```bash
npm run dev
```

### Step 3: Test the Login Flow

1. **Go to Landing Page**
   - Navigate to `http://localhost:3000`
   - You should see the landing page with hero section, features, and reviews

2. **Click "Sign In"**
   - Go to `/auth/login`
   - Enter valid credentials:
     - Email: `john@example.com` (or any registered email)
     - Password: `password123` (or the password you registered with)

3. **Expected Flow**
   - Login form submits
   - Token is stored in Pinia store
   - Token is persisted to localStorage
   - You're redirected to `/dashboard`
   - Dashboard loads with sidebar showing workspaces
   - Workspaces are fetched from API and displayed

4. **Dashboard Features**
   - Sidebar shows list of workspaces
   - Click on a workspace to switch between them
   - Current workspace details are displayed
   - Logout button clears session and returns to login

## What Was Fixed

### Files Updated:
1. **app/composables/useWorkspacesApi.ts**
   - Removed: `createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`, `addMembersToWorkspace()`, `removeMembersFromWorkspace()`
   - Kept: `getWorkspaces()` - only reads workspaces

2. **app/stores/useWorkspaceStore.ts**
   - Removed: `createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`, `addMembers()`, `removeMembers()`
   - Kept: `fetchWorkspaces()`, `setCurrentWorkspace()`, `clearCurrentWorkspace()`

3. **app/components/AppSidebar.vue**
   - Removed: Create workspace button and modal
   - Kept: Workspace list and switching functionality

4. **app/layouts/dashboard.vue**
   - Fixed: Changed `<Icon>` to `<UIcon>`
   - Calls `fetchWorkspaces()` on mount

5. **app/pages/auth/login.vue**
   - Added: Small delay before navigation to ensure store persists
   - Fixed: All `<Icon>` components to `<UIcon>`

6. **app/pages/auth/register.vue**
   - Fixed: All `<Icon>` components to `<UIcon>`

7. **app/pages/auth/reset-password.vue**
   - Fixed: All `<Icon>` components to `<UIcon>`

## Troubleshooting

### Still Getting Module Export Errors?
1. Stop the dev server completely
2. Delete the `.nuxt` folder: `rm -rf .nuxt`
3. Delete the `.vite` folder: `rm -rf .vite`
4. Run `npm run dev` again

### Login Not Redirecting to Dashboard?
1. Check browser console for errors
2. Verify the token is being stored (check localStorage)
3. Check that the middleware is allowing access to `/dashboard`
4. Verify the workspace API is returning data

### Workspaces Not Loading?
1. Check that you're logged in (token should exist)
2. Check browser console for API errors
3. Verify the backend API is running at `http://178.104.58.236/api/workspaces`
4. Check that the token is being sent in the request headers

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout and clear session

### Workspaces
- `GET /api/workspaces/read` - Fetch all workspaces for the user

## Next Steps

Once the login flow is working:
1. Test switching between workspaces in the sidebar
2. Test logout functionality
3. Verify token persistence across page refreshes
4. Test the complete auth flow (signup, verification, login)
