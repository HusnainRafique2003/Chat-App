# Debugging Token Issue (401 Unauthorized)

## Problem
After login, the workspace API returns 401 (Unauthorized) with message "Invalid or expired token."

## Root Causes

### 1. Token Not Being Sent
The token might not be included in the request headers.

**Check:**
- Open browser DevTools → Network tab
- Login and go to dashboard
- Look for the GET request to `/api/workspaces/read`
- Check the request headers for `Authorization: Bearer {token}`

**If missing:**
- The token is `null` in the store
- The interceptor isn't running
- The store isn't persisting

### 2. Token Not Being Stored
The login response might not include a token, or it's not being saved.

**Check:**
- Open browser DevTools → Console
- Look for logs like:
  ```
  Login response token: eyJ0eXAi...
  After setAuth - Store token: eyJ0eXAi...
  ```

**If token is missing:**
- The backend login endpoint isn't returning `access_token`
- The response structure is different than expected

### 3. Token Not Being Persisted
The token is stored but not persisted to localStorage.

**Check:**
- Open browser DevTools → Application → LocalStorage
- Look for a key like `user` or similar
- It should contain the token and user data

**If missing:**
- Pinia persistence plugin isn't working
- The store definition is incorrect

### 4. Store Not Being Hydrated
The token is in localStorage but not loaded when dashboard mounts.

**Check:**
- Open browser DevTools → Console
- Look for logs like:
  ```
  Dashboard - Token available, fetching workspaces
  Workspace API - Token: eyJ0eXAi...
  ```

**If you see "No token yet":**
- The store is being hydrated asynchronously
- The dashboard is fetching before the store is ready

## Debugging Steps

### Step 1: Check Login Response
1. Open DevTools → Network tab
2. Login with credentials
3. Find the POST request to `/api/auth/login`
4. Check the response body
5. Verify it contains:
   ```json
   {
     "success": true,
     "data": {
       "user": {
         "access_token": "eyJ0eXAi..."
       }
     }
   }
   ```

### Step 2: Check Console Logs
1. Open DevTools → Console
2. Login and navigate to dashboard
3. Look for these logs:
   ```
   Login response user: {id: "...", email: "...", access_token: "..."}
   Login response token: eyJ0eXAi...
   After setAuth - Store token: eyJ0eXAi...
   Dashboard - Token available, fetching workspaces
   Workspace API - Token: eyJ0eXAi...
   ```

### Step 3: Check LocalStorage
1. Open DevTools → Application → LocalStorage
2. Look for the domain `localhost:3000`
3. Find a key that contains the token (usually `user` or similar)
4. The value should be a JSON string with the token

### Step 4: Check Network Request Headers
1. Open DevTools → Network tab
2. Go to dashboard (after login)
3. Find the GET request to `/api/workspaces/read`
4. Click on it and check the "Request Headers" tab
5. Look for:
   ```
   Authorization: Bearer eyJ0eXAi...
   token: eyJ0eXAi...
   ```

## Common Issues and Solutions

### Issue: Token is null in console logs
**Solution:**
- The backend login endpoint isn't returning `access_token`
- Check the API response structure matches the expected format
- Verify the field name is exactly `access_token` (not `token` or `accessToken`)

### Issue: Token is in localStorage but not in store
**Solution:**
- Restart the dev server
- Clear browser cache and localStorage
- The Pinia persistence plugin might not be loading

### Issue: Token is in store but not in request headers
**Solution:**
- The interceptor isn't running
- Check that `useUserStore()` is being called in the interceptor
- Verify the token is being set correctly in the store

### Issue: Token is in request headers but still getting 401
**Solution:**
- The token is invalid or expired
- The backend is rejecting the token format
- Check that the token format is correct (should be a JWT)
- Verify the backend is using the same secret key

## Files with Logging

The following files have been updated with console logs:

1. **app/stores/useUserStore.ts**
   - Logs token after login
   - Logs token after setAuth

2. **app/layouts/dashboard.vue**
   - Logs when token is available
   - Logs when waiting for token

3. **app/composables/useWorkspacesApi.ts**
   - Logs token before sending request
   - Logs warning if token is missing

## Next Steps

1. **Restart dev server** to ensure all changes are loaded
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Open DevTools** (F12)
4. **Login** and check console logs
5. **Go to dashboard** and check network requests
6. **Share the console logs** if the issue persists

## Expected Console Output

After successful login and navigation to dashboard:

```
Login response user: {id: "507f...", email: "john@example.com", access_token: "eyJ0eXAi..."}
Login response token: eyJ0eXAi...
After setAuth - Store token: eyJ0eXAi...
Dashboard - Token available, fetching workspaces
Workspace API - Token: eyJ0eXAi...
```

If you see different output, share it and we can debug further.
