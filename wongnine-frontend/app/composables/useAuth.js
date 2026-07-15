import { ref } from 'vue'

const currentUser = ref(null)
const isAuthReady = ref(false)

export const useAuth = () => {
  const config = useRuntimeConfig()
  console.log('DEBUG apiBase:', config.public.apiBase)
  console.log('DEBUG maps key:', config.public.googleMapsApiKey)

  const apiFetch = (path, options = {}) => {
    const base = config.public.apiBase.replace(/\/$/, '') // ตัด / ท้ายออกเสมอ กันพลาดซ้ำ
    return $fetch(`${base}${path}`, {
      ...options,
      credentials: 'include'
    })
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
    await apiFetch('/auth/logout', {
      method: 'POST'
    })
    currentUser.value = null
    navigateTo('/login')
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
