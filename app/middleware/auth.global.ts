export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return // Skip SSR

  const userStore = useUserStore()
  
  console.log('Auth middleware - isLoggedIn:', userStore.isLoggedIn, 'path:', to.path)
  
  // Skip auth check if already logged in
  if (userStore.isLoggedIn) return
  
  // Skip for public routes
  const publicPages = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
  if (publicPages.includes(to.path)) return
  
  // Redirect to login for protected routes
  return navigateTo('/auth/login')
})

