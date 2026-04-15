import { defineStore } from 'pinia'
import {
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resetPasswordRequest,
  verifySignupRequest
} from '~/services/authService'
import type { ApiEnvelope } from '~/types/api'

export interface ApiUser {
  id: string
  name: string
  email: string
  is_active: boolean
  access_token: string | null
  created_at?: string
  updated_at?: string
}

interface AuthUserPayload {
  access_token?: string
  user: ApiUser
}

interface UserState {
  user: ApiUser | null
  token: string | null
  isLoading: boolean
}

let activeLoginController: AbortController | null = null

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: null,
    isLoading: false
  }),

  getters: {
    isLoggedIn: state => Boolean(state.user?.is_active && state.token)
  },

  persist: {
    pick: ['user', 'token']
  },

  actions: {
    setAuth(user: ApiUser, authToken?: string) {
      this.user = user
      // Use the provided auth token (top-level from response), fallback to user's token
      this.token = authToken ?? user.access_token ?? null
    },

    clearAuth() {
      this.user = null
      this.token = null
    },

    async login(email: string, password: string) {
      if (activeLoginController) {
        activeLoginController.abort()
      }

      const controller = new AbortController()
      activeLoginController = controller
      this.isLoading = true

      try {
        const response = await loginRequest(email, password, controller.signal)
        const payload = response.raw.data as unknown as ApiEnvelope<AuthUserPayload>

        if (!payload.success || !payload.data?.user) {
          return { success: false, error: payload.message || 'Login failed' }
        }

        const authToken = payload.data.access_token
        const user = payload.data.user

        this.setAuth(user, authToken)
        return { success: true, message: payload.message || 'Login successful' }
      } catch (error) {
        if (error instanceof Error && (error.name === 'CanceledError' || error.name === 'AbortError')) {
          return { success: false, error: 'Login request was cancelled. Please try again.' }
        }

        return { success: false, error: extractMessage(error, 'Login failed') }
      } finally {
        if (activeLoginController === controller) {
          activeLoginController = null
        }
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
        const response = await registerRequest(form)
        const payload = response.raw.data as unknown as ApiEnvelope<AuthUserPayload>

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

    async verifySignup(email: string, token: string) {
      this.isLoading = true

      try {
        const response = await verifySignupRequest(email, token)
        const payload = response.raw.data as unknown as ApiEnvelope<AuthUserPayload>

        if (!payload.success || !payload.data?.user) {
          return { success: false, error: payload.message || 'Verification failed' }
        }

        const authToken = payload.data.access_token
        const user = payload.data.user

        this.setAuth(user, authToken)
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
        const response = await forgotPasswordRequest(email)
        const payload = response.raw.data as unknown as ApiEnvelope<null>

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
        const response = await resetPasswordRequest(token, password, password_confirmation)
        const payload = response.raw.data as unknown as ApiEnvelope<null>

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
      const authToken = this.token
      this.clearAuth()

      if (authToken) {
        try {
          await logoutRequest()
        } catch {
          // Ignore logout API errors (e.g. 401 stale token)
        }
      }

      return { success: true }
    },

    async validateAuth(): Promise<{ valid: boolean }> {
      if (!this.token || !this.user) {
        this.clearAuth()
        return { valid: false }
      }

      // Token and user exist, validation passes
      return { valid: true }
    }
  }
})
