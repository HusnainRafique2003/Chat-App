# Token Authentication Fix

## Problem
The backend returns two different tokens in the login response:

```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "access_token": "kjkFHC0D7TxBpAl9VXbgfhQ8OqQBHMBN1775113316",  // ← USE THIS for API auth
    "user": {
      "id": "69c39e24bffb6303f3051f66",
      "name": "Uzair Raza",
      "email": "uzairraza105@gmail.com",
      "access_token": "2dc66d8e4339b7cdc37372b9fec465204b38249cf587a03f72d24de64083879a"  // ← MongoDB internal token
    }
  }
}
```

**The Issue:**
- Frontend was using `user.access_token` (MongoDB token) for API authentication
- Should use top-level `access_token` (authentication token) instead

## Solution
Updated `app/stores/useUserStore.ts` to:

1. **Extract top-level token** from response
2. **Pass it to setAuth()** method
3. **Use it for all API requests**

### Changes Made

#### 1. Updated AuthUserPayload interface
```typescript
interface AuthUserPayload {
  access_token?: string  // ← Added top-level token
  user: ApiUser
}
```

#### 2. Updated setAuth() method
```typescript
setAuth(user: ApiUser, authToken?: string) {
  this.user = user
  // Use the provided auth token (top-level from response), fallback to user's token
  this.token = authToken ?? user.access_token ?? null
}
```

#### 3. Updated login() method
```typescript
async login(email: string, password: string) {
  // ... validation code ...
  
  const authToken = payload.data.access_token  // ← Extract top-level token
  const user = payload.data.user
  
  this.setAuth(user, authToken)  // ← Pass both
  
  return { success: true, message: payload.message || 'Login successful' }
}
```

#### 4. Updated verifySignup() method
```typescript
async verifySignup(email: string, token: string) {
  // ... validation code ...
  
  const authToken = payload.data.access_token  // ← Extract top-level token
  const user = payload.data.user
  
  this.setAuth(user, authToken)  // ← Pass both
  
  return { success: true, message: payload.message || 'Email verified successfully.' }
}
```

## How It Works Now

### Login Flow
1. User enters email/password
2. Backend returns response with two tokens
3. Frontend extracts **top-level `access_token`**
4. Stores it in `userStore.token`
5. All API requests use this token in headers:
   ```
   token: kjkFHC0D7TxBpAl9VXbgfhQ8OqQBHMBN1775113316
   Authorization: Bearer kjkFHC0D7TxBpAl9VXbgfhQ8OqQBHMBN1775113316
   ```

### Token Priority
```
1. Use top-level access_token (authentication token) ✅
2. Fallback to user.access_token (MongoDB token) ⚠️
3. No token (null) ❌
```

## API Requests
All API requests now send the correct authentication token:

```typescript
// In useApi.ts interceptor
apiClient.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const token = userStore.token  // ← Now has correct token
  
  if (token) {
    config.headers.token = token
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})
```

## Testing

### Before Fix
- ❌ 401 Unauthorized errors
- ❌ Wrong token being sent
- ❌ API requests failing

### After Fix
- ✅ Correct token sent with requests
- ✅ API requests should work
- ✅ Workspaces/Teams/Channels/Messages load

## Files Modified
- `app/stores/useUserStore.ts` - Updated token handling

## Next Steps

1. **Test login** - Verify token is correct
2. **Check console** - Look for token in logs
3. **Test API calls** - Workspaces, teams, channels should load
4. **Monitor requests** - Check Network tab to verify token is sent

## Debugging

### Check stored token
```javascript
// In browser console
const store = useUserStore()
console.log(store.token)  // Should show: kjkFHC0D7TxBpAl9VXbgfhQ8OqQBHMBN1775113316
```

### Check API requests
1. Open DevTools (F12)
2. Go to Network tab
3. Make an API request
4. Check request headers for `token` header
5. Should contain the top-level access_token

### Check response
```javascript
// In browser console after login
const store = useUserStore()
console.log('Token:', store.token)
console.log('User:', store.user)
console.log('Is Logged In:', store.isLoggedIn)
```

## Token Types Explained

| Token | Source | Purpose | Length |
|-------|--------|---------|--------|
| `access_token` (top-level) | Backend auth system | API authentication | ~50 chars |
| `user.access_token` | MongoDB | Internal database reference | ~64 chars (hex) |

## Summary

✅ **Fixed:** Frontend now uses correct authentication token
✅ **Result:** API requests will include proper token
✅ **Impact:** Workspaces, teams, channels, messages should load
✅ **Status:** Ready for testing
