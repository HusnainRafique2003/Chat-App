/**
 * Centralized API Configuration
 * All API endpoints and base URLs are defined here for easy maintenance
 */

export const API_CONFIG = {
  BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://178.104.58.236/api',
  TIMEOUT: 15000,
  ENDPOINTS: {
    AUTH: '/auth',
    WORKSPACES: '/workspaces',
    TEAMS: '/team',
    CHANNELS: '/channel',
    MESSAGES: '/messages',
    MESSAGE: '/message'
  }
}

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
