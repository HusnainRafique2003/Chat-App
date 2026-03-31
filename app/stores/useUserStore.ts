import { defineStore } from 'pinia'
import { postApi, type ApiResponse } from '~/composables/useApi'

const API_BASE = 'http://178.104.58.236/api/auth'

// API User type
export interface ApiUser {
  id: string
  name: string
  email: string
  is_active: boolean
  access_token: string | null
  created_at: string
  updated_at: string
}

interface UserState {
  user: ApiUser | null
  token: string | null
  isLoading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: null,
    isLoading: false,
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.user?.is_active && !!state.token,
  },

  actions: {
    setAuth(user: ApiUser) {
      this.user = user
      if (user.access_token) {
        this.token = user.access_token
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true
      try {
        const response = await postApi<ApiResponse<ApiUser>>('/login', { email, password })
        const data = response.data as ApiResponse<ApiUser>
        if (data.success) {
          this.setAuth(data.data.user)
          console.log(data.message || 'Login successful')
          return { success: true }
        }
      } catch (error: any) {
        console.error(error.message || 'Login failed')
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async register(form: { name: string, email: string, workspace: string, password: string, password_confirmation: string }) {
      this.isLoading = true
      try {
        const response = await postApi<ApiResponse<ApiUser>>('/signup', form)
        const data = response.data as ApiResponse<ApiUser>
        if (data.success) {
          console.log('Account created! Check your email to verify.')
          return { success: true }
        }
      } catch (error: any) {
        console.error(error.message || 'Registration failed')
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async verifySignup(email: string, token: string) {
      this.isLoading = true
      try {
        const response = await postApi<ApiResponse<ApiUser>>('/verify-signup', { email, token })
        const data = response.data as ApiResponse<ApiUser>
        if (data.success) {
          this.setAuth(data.data.user)
          console.log('Email verified!')
          return { success: true }
        }
      } catch (error: any) {
        console.error(error.message || 'Verification failed')
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async forgotPassword(email: string) {
      this.isLoading = true
      try {
        const response = await postApi('/forgot-password', { email })
        const data = response.data as ApiResponse<any>
        if (data.success) {
          console.log('Password reset email sent!')
          return { success: true }
        }
      } catch (error: any) {
        console.error(error.message || 'Failed to send reset email')
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async resetPassword(token: string, password: string, password_confirmation: string) {
      this.isLoading = true
      try {
        const response = await postApi('/reset-password', { token, password, password_confirmation })
        const data = response.data as ApiResponse<any>
        if (data.success) {
          console.log('Password reset successful!')
          return { success: true }
        }
      } catch (error: any) {
        console.error(error.message || 'Password reset failed')
        return { success: false, error: error.message }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      if (!this.token) return
      try {
        await postApi('/logout')
      } catch {
        // Ignore logout errors
      } finally {
        this.user = null
        this.token = null
      }
      console.log('Logged out successfully')
    },

    $reset() {
      this.user = null
      this.token = null
      this.isLoading = false
    },
  },
})
