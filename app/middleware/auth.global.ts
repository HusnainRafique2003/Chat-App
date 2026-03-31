export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server || process.client) return
  
  const userStore = useUserStore()
  
  // Skip auth check if already logged in
  if (userStore.isLoggedIn) return
  
  // Skip for public routes
  const publicPages = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
  if (publicPages.includes(to.path)) return
  
  // Redirect to login for protected routes
  if (to.path.startsWith('/dashboard')) {
    return navigateTo('/auth/login')
  }
})

