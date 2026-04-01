# Authentication Integration Guide

## Overview
The authentication system is fully integrated with your backend API at `http://178.104.58.236/api/auth`.

## Authentication Flow

### 1. User Signup (Registration)
**Route:** `/auth/register`
- User enters: name, email, workspace name, password
- API Endpoint: `POST /signup`
- Response: User object with `is_active: false` (email verification required)
- Next Step: Email verification

### 2. Email Verification
**Route:** `/auth/register` (step 2)
- User receives verification token via email
- User enters: email, verification token
- API Endpoint: `POST /verify-signup`
- Response: User object with `is_active: true` and `access_token`
- Next Step: Automatic redirect to dashboard

### 3. User Login
**Route:** `/auth/login`
- User enters: email, password
- API Endpoint: `POST /login`
- Response: User object with `access_token`
- Token is automatically stored in Pinia store and persisted
- Next Step: Redirect to dashboard

### 4. Forgot Password
**Route:** `/auth/forgot-password`
- User enters: email
- API Endpoint: `POST /forgot-password`
- Response: Confirmation message
- User receives reset link via email

### 5. Reset Password
**Route:** `/auth/reset-password?token=<reset_token>`
- User enters: reset token, new password, password confirmation
- API Endpoint: `POST /reset-password`
- Response: Success message
- Next Step: Redirect to login

### 6. Logout
**Triggered from:** Dashboard/App
- API Endpoint: `POST /logout`
- Token is cleared from store
- User is redirected to landing page

## Token Management

### Storage
- Token is stored in Pinia store (`useUserStore`)
- Automatically persisted to localStorage via `@pinia-plugin-persistedstate/nuxt`
- Persists across browser sessions

### Usage
- Token is automatically added to all API requests via axios interceptors
- Header: `Authorization: Bearer {token}`
- Also sent as: `token: {token}` header

### Interceptors
- **useApi.ts**: Handles auth endpoints (`/api/auth/*`)
- **useWorkspacesApi.ts**: Handles workspace endpoints (`/api/workspaces/*`)
- Both automatically inject the token from the store

## Protected Routes

### Middleware
- **auth.global.ts**: Protects all routes except public pages
- Public pages: `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`
- Protected pages: `/dashboard` and all other routes

### Validation
- On app load, `validateAuth()` is called to verify token validity
- If token is invalid or expired, user is logged out
- User is redirected to login page

## User Store (Pinia)

### State
```typescript
{
  user: ApiUser | null,
  token: string | null,
  isLoading: boolean
}
```

### Getters
- `isLoggedIn`: Returns true if user is active and has a token

### Actions
- `login(email, password)`: Authenticate user
- `register(form)`: Create new account
- `verifySignup(email, token)`: Verify email
- `forgotPassword(email)`: Request password reset
- `resetPassword(token, password, password_confirmation)`: Reset password
- `logout()`: Clear auth and logout
- `validateAuth()`: Verify token validity
- `setAuth(user)`: Set user and token
- `clearAuth()`: Clear user and token

## API Response Format

All endpoints return:
```json
{
  "success": boolean,
  "message": string,
  "data": object | null
}
```

## Error Handling

- All errors are caught and returned with user-friendly messages
- Form validation errors are displayed inline
- API errors are shown in error alerts
- Network errors are handled gracefully

## Testing the Flow

1. **Sign Up**: Go to `/auth/register` and create an account
2. **Verify Email**: Use the verification token from your email
3. **Login**: Go to `/auth/login` with your credentials
4. **Dashboard**: You'll be redirected to `/dashboard`
5. **Logout**: Click logout button to clear session
6. **Forgot Password**: Go to `/auth/forgot-password` to reset

## Files Modified

- `app/stores/useUserStore.ts`: User authentication store
- `app/composables/useApi.ts`: Auth API client with interceptor
- `app/composables/useWorkspacesApi.ts`: Workspace API client with interceptor
- `app/pages/auth/login.vue`: Login page
- `app/pages/auth/register.vue`: Registration and verification page
- `app/pages/auth/forgot-password.vue`: Forgot password page
- `app/pages/auth/reset-password.vue`: Reset password page
- `app/middleware/auth.global.ts`: Route protection middleware
- `nuxt.config.ts`: Configured `srcDir: 'app'` for proper page discovery
