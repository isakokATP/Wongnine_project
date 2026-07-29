import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

export const useAppToast = () => {
  const addToast = (message, type = 'info', duration = 3500) => {
    const id = ++idCounter
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (message) => addToast(message, 'success')
  const error = (message) => addToast(message, 'error')
  const info = (message) => addToast(message, 'info')

  return { toasts, addToast, removeToast, success, error, info }
}