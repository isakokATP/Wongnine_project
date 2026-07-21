<script setup>
const route = useRoute()
const { fetchMe } = useAuth()

const status = ref('loading')
const message = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    status.value = 'error'
    message.value = 'ไม่พบลิงก์ยืนยัน'
    return
  }

  try {
    const config = useRuntimeConfig()
    await $fetch(`${config.public.apiBase}/auth/verify-email`, {
      query: { token },
      credentials: 'include'
    })
    await fetchMe()
    status.value = 'success'
    message.value = 'ยืนยันอีเมลสำเร็จ!'
  } catch (err) {
    status.value = 'error'
    message.value = err.data?.message || 'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว'
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F7F8F5] font-['Prompt'] px-4">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-8 text-center">
      <div v-if="status === 'loading'" class="space-y-4">
        <div class="w-8 h-8 border-2 border-[#e8e9e3] border-t-[#6E8F72] rounded-full animate-spin mx-auto" />
        <p class="text-sm text-[#a3a79a]">กำลังยืนยันอีเมล...</p>
      </div>

      <div v-else-if="status === 'success'" class="space-y-3">
        <div class="text-4xl">✅</div>
        <h1 class="text-lg font-semibold text-[#31352D]">{{ message }}</h1>
        <NuxtLink to="/" class="inline-block mt-2 px-5 py-2 rounded-full bg-[#6E8F72] text-white text-sm font-medium">
          กลับหน้าหลัก
        </NuxtLink>
      </div>

      <div v-else class="space-y-3">
        <div class="text-4xl">⚠️</div>
        <h1 class="text-lg font-semibold text-[#c17a4f]">{{ message }}</h1>
        <NuxtLink to="/" class="inline-block mt-2 px-5 py-2 rounded-full bg-[#F7F8F5] text-[#6E8F72] text-sm font-medium">
          กลับหน้าหลัก
        </NuxtLink>
      </div>
    </div>
  </div>
</template>