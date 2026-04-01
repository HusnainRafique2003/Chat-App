import { defineStore } from 'pinia'
import { postApi, type ApiEnvelope } from '~/composables/useApi'

// Updated to match your backend auth response perfectly
export interface UserInfo {
export interface ApiUser {
  id: string
  name: string
  email: string
  is_active: boolean
  access_token: string
}

interface UserState {
  user: UserInfo | null
  userList: UserInfo[]
  access_token: string | null
  created_at: string
  updated_at: string
}

interface AuthUserPayload {
  user: ApiUser
}

interface UserState {
  user: ApiUser | null
  token: string | null
  isLoading: boolean
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    userList: [],
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.user?.access_token,
    token: null,
    isLoading: false
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.user?.is_active && state.token)
  },

  persist: true,

  actions: {
    // Call this when your login API request succeeds
    login(info: UserInfo) {
      this.user = info
    setAuth(user: ApiUser) {
      this.user = user
      this.token = user.access_token ?? null
    },

    clearAuth() {
      this.user = null
    },
    $reset() {
      this.user = null
      this.userList = []
      this.token = null
    },

    async login(email: string, password: string) {
      this.isLoading = true

      try {
        const response = await postApi<ApiEnvelope<AuthUserPayload>>('/login', { email, password })
        const payload = response.data

        if (!payload.success || !payload.data?.user) {
          return { success: false, error: payload.message || 'Login failed' }
        }

        this.setAuth(payload.data.user)
        return { success: true, message: payload.message || 'Login successful' }
      } catch (error) {
        return { success: false, error: extractMessage(error, 'Login failed') }
      } finally {
        this.isLoading = false
      }
    },

    async register(form: {
      name: string
      email: string
      workspace: string
      password: string
      password_confirmation: string
    }) {
      this.isLoading = true

      try {
        const response = await postApi<ApiEnvelope<AuthUserPayload>>('/signup', form)
        const payload = response.data

        if (!payload.success) {
          return { success: false, error: payload.message || 'Registration failed' }
        }

        return {
          success: true,
          message: payload.message || 'User registered successfully. Please check your email for verification.',
          user: payload.data?.user ?? null
        }
      } catch (error) {
        return { success: false, error: extractMessage(error, 'Registration failed') }
      } finally {
        this.isLoading = false
      }
    },

  // This ensures the token survives page refreshes!
  persist: true, 
})
    async verifySignup(email: string, token: string) {
      this.isLoading = true

      try {
        const response = await postApi<ApiEnvelope<AuthUserPayload>>('/verify-signup', { email, token })
        const payload = response.data

        if (!payload.success || !payload.data?.user) {
          return { success: false, error: payload.message || 'Verification failed' }
        }

        this.setAuth(payload.data.user)
        return { success: true, message: payload.message || 'Email verified successfully. You can now login.' }
      } catch (error) {
        return { success: false, error: extractMessage(error, 'Verification failed') }
      } finally {
        this.isLoading = false
      }
    },

    async forgotPassword(email: string) {
      this.isLoading = true

      try {
        const response = await postApi<ApiEnvelope<null>>('/forgot-password', { email })
        const payload = response.data

        if (!payload.success) {
          return { success: false, error: payload.message || 'Failed to send reset email' }
        }

        return { success: true, message: payload.message || 'Password reset link sent to your email' }
      } catch (error) {
        return { success: false, error: extractMessage(error, 'Failed to send reset email') }
      } finally {
        this.isLoading = false
      }
    },

    async resetPassword(token: string, password: string, password_confirmation: string) {
      this.isLoading = true

      try {
        const response = await postApi<ApiEnvelope<null>>('/reset-password', { token, password, password_confirmation })
        const payload = response.data

        if (!payload.success) {
          return { success: false, error: payload.message || 'Password reset failed' }
        }

        return { success: true, message: payload.message || 'Password reset successfully' }
      } catch (error) {
        return { success: false, error: extractMessage(error, 'Password reset failed') }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      if (!this.token) {
        this.clearAuth()
        return { success: true }
      }

      try {
        await postApi<ApiEnvelope<null>>('/logout', {})
        return { success: true }
      } catch {
        return { success: false }
      } finally {
        this.clearAuth()
      }
    }
  }
})
