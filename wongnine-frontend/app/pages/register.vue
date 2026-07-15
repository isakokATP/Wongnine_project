<script setup>
definePageMeta({ middleware: 'auth' })

useHead({
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap' }]
})

const { register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  name.value = name.value.trim()
  email.value = email.value.trim()

  if (!name.value || !email.value || !password.value) {
    errorMessage.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'รหัสผ่านไม่ตรงกัน'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await register(name.value, email.value, password.value)
    await navigateTo('/')
  } catch (err) {
    errorMessage.value = err.data?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F7F8F5] font-['Prompt'] px-4">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-8">
      <h1 class="text-2xl font-semibold text-[#31352D] tracking-tight mb-1">
        สมัครสมาชิก
      </h1>
      <p class="text-sm text-[#9a9d92] font-light mb-8">
        สร้างบัญชีเพื่อเริ่มต้นใช้งาน Wong Nine
      </p>

      <form
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">ชื่อ</label>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
            @blur="name = name.trim()"
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">อีเมล</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
            @blur="email = email.trim()"
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">รหัสผ่าน</label>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">ยืนยันรหัสผ่าน</label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
          >
        </div>

        <p
          v-if="errorMessage"
          class="text-xs font-medium text-[#c17a4f] bg-[#FBF1EC] rounded-lg px-3 py-2"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full h-11 rounded-xl bg-[#6E8F72] hover:bg-[#5a765e] text-white font-medium text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {{ isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก' }}
        </button>
      </form>

      <p class="text-center text-sm text-[#a3a79a] font-light mt-6">
        มีบัญชีอยู่แล้ว?
        <NuxtLink
          to="/login"
          class="text-[#6E8F72] font-medium hover:underline"
        >เข้าสู่ระบบ</NuxtLink>
      </p>
    </div>
  </div>
</template>
