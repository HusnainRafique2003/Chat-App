import { apiService } from '~/api/apiService'

export async function loginRequest(email: string, password: string, signal?: AbortSignal) {
  return await apiService({
    url: '/auth/login',
    method: 'POST',
    data: { email, password },
    signal,
    required: ['email', 'password'],
    dedupe: false
  })
}

export async function registerRequest(data: {
  name: string
  email: string
  workspace: string
  password: string
  password_confirmation: string
}) {
  return await apiService({
    url: '/auth/signup',
    method: 'POST',
    data,
    required: ['name', 'email', 'workspace', 'password', 'password_confirmation'],
    dedupe: false
  })
}

export async function verifySignupRequest(email: string, token: string) {
  return await apiService({
    url: '/auth/verify-signup',
    method: 'POST',
    data: { email, token },
    required: ['email', 'token'],
    dedupe: false
  })
}

export async function forgotPasswordRequest(email: string) {
  return await apiService({
    url: '/auth/forgot-password',
    method: 'POST',
    data: { email },
    required: ['email'],
    dedupe: false
  })
}

export async function resetPasswordRequest(token: string, password: string, password_confirmation: string) {
  return await apiService({
    url: '/auth/reset-password',
    method: 'POST',
    data: { token, password, password_confirmation },
    required: ['token', 'password', 'password_confirmation'],
    dedupe: false
  })
}

export async function logoutRequest() {
  return await apiService({
    url: '/auth/logout',
    method: 'POST',
    data: {},
    dedupe: false
  })
}
