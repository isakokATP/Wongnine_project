import { ref } from 'vue'

const isOpen = ref(false)
const message = ref('')
const title = ref('ยืนยันการทำรายการ')
let resolvePromise = null

export const useConfirm = () => {
  const confirm = (msg, opts = {}) => {
    message.value = msg
    title.value = opts.title || 'ยืนยันการทำรายการ'
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    resolvePromise?.(true)
  }

  const handleCancel = () => {
    isOpen.value = false
    resolvePromise?.(false)
  }

  return { isOpen, message, title, confirm, handleConfirm, handleCancel }
}