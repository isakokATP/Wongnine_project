import { ref } from 'vue'

const currentUser = ref(null)
const isAuthReady = ref(false)
let refreshPromise = null

export const useAuth = () => {
  const config = useRuntimeConfig()

  const resendVerification = async () => {
    return await apiFetch('/auth/resend-verification', { method: 'POST' })
  }

  const refreshAccessToken = () => {
    if (!refreshPromise) {
      refreshPromise = $fetch(`${config.public.apiBase}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      }).finally(() => {
        refreshPromise = null
      })
    }
    return refreshPromise
  }

  const apiFetch = async (path, options = {}) => {
    const base = config.public.apiBase.replace(/\/$/, '')
    try {
      return await $fetch(`${base}${path}`, { ...options, credentials: 'include' })
    } catch (err) {
      if (err.statusCode === 401 || err.response?.status === 401) {
        try {
          await refreshAccessToken()
          return await $fetch(`${base}${path}`, { ...options, credentials: 'include' })
        } catch (refreshErr) {
          currentUser.value = null
          throw refreshErr
        }
      }
      throw err
    }
  }

  const login = async (email, password) => {
    await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    await fetchMe()
  }

  const register = async (name, email, password) => {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password }
    })
    await fetchMe()
  }

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      currentUser.value = null
      navigateTo('/')
    }
  }

  const fetchMe = async () => {
    try {
      const user = await apiFetch('/auth/me')
      currentUser.value = user
      return user
    } catch (error) {
      currentUser.value = null
      return null
    }
  }

  const initAuth = async () => {
    if (isAuthReady.value) return
    await fetchMe()
    isAuthReady.value = true
  }

  return {
    currentUser,
    isAuthReady,
    apiFetch,
    login,
    register,
    logout,
    fetchMe,
    initAuth
  }
}
