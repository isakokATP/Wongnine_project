export default defineNuxtRouteMiddleware(async (to) => {
  const { currentUser, isAuthReady, initAuth } = useAuth()

  if (!isAuthReady.value) {
    await initAuth()
  }

  if (!currentUser.value && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }

  if (currentUser.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/')
  }
})
