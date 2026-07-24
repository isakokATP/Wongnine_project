<script setup>
// Nuxt 3 Auto-imports ref, computed ให้แล้ว สามารถเรียกใช้ได้เลย
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

// 🌟 1. Checklist สำหรับ Password
const passwordChecklist = computed(() => {
  const pwd = password.value
  return {
    isMinLength: pwd.length >= 8,
    hasSpecialChar: /(?=.*[!@#$%^&*(),.?":{}|<>\-_])/.test(pwd),
  }
})

// 🌟 2. เช็กว่ารหัสผ่านตรงกันหรือไม่ (คืนค่า null ถ้ายังไม่ได้พิมพ์ช่องยืนยัน)
const isPasswordMatch = computed(() => {
  if (!confirmPassword.value) return null 
  return password.value === confirmPassword.value
})

// 🌟 3. เช็กว่าฟอร์มพร้อมส่งหรือยัง (ใช้ปลดล็อกปุ่ม Submit)
const isFormValid = computed(() => {
  return name.value.trim() !== '' &&
         email.value.trim() !== '' &&
         passwordChecklist.value.isMinLength &&
         passwordChecklist.value.hasSpecialChar &&
         isPasswordMatch.value === true
})

const handleSubmit = async () => {
  name.value = name.value.trim()
  email.value = email.value.trim()

  if (!isFormValid.value) return

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
        register
      </h1>
      <p class="text-sm text-[#9a9d92] font-light mb-8">
        create your Wong Nine account
      </p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        
        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">username</label>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
            @blur="name = name.trim()"
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">email</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
            @blur="email = email.trim()"
          >
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">password</label>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
          >
          
          <div class="mt-2 text-xs font-light">
            <ul class="space-y-1">
              <li :class="passwordChecklist.isMinLength ? 'text-[#6E8F72]' : 'text-[#8B9184]'" class="transition-colors flex items-center">
                <span class="mr-1.5 text-sm">{{ passwordChecklist.isMinLength ? '✓' : '○' }}</span> อย่างน้อย 8 ตัวอักษร
              </li>
              <li :class="passwordChecklist.hasSpecialChar ? 'text-[#6E8F72]' : 'text-[#8B9184]'" class="transition-colors flex items-center">
                <span class="mr-1.5 text-sm">{{ passwordChecklist.hasSpecialChar ? '✓' : '○' }}</span> มีอักขระพิเศษ (เช่น !@#$%)
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1.5">verify password</label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full h-11 px-4 rounded-xl bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6E8F72]/10 transition-all"
          >
          <p v-if="isPasswordMatch === false" class="text-xs font-medium text-[#c17a4f] mt-1.5">
            รหัสผ่านไม่ตรงกัน
          </p>
          <p v-else-if="isPasswordMatch === true" class="text-xs font-medium text-[#6E8F72] mt-1.5">
            รหัสผ่านตรงกัน
          </p>
        </div>

        <!-- Error Message จาก Backend -->
        <p
          v-if="errorMessage"
          class="text-xs font-medium text-[#c17a4f] bg-[#FBF1EC] rounded-lg px-3 py-2"
        >
          {{ errorMessage }}
        </p>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="w-full h-11 rounded-xl bg-[#6E8F72] hover:bg-[#5a765e] text-white font-medium text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {{ isLoading ? 'กำลังสมัครสมาชิก...' : 'create account' }}
        </button>
      </form>

      <p class="text-center text-sm text-[#a3a79a] font-light mt-6">
        already have an account?
        <NuxtLink
          to="/login"
          class="text-[#6E8F72] font-medium hover:underline"
        >Login</NuxtLink>
      </p>
    </div>
  </div>
</template>