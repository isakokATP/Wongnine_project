<script setup>
const { isOpen, message, title, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-[#31352D]/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 font-['Prompt']"
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
      <h3 class="text-base font-semibold text-[#31352D] mb-1">{{ title }}</h3>
      <p class="text-sm text-[#8B9184] mb-5">{{ message }}</p>

      <div class="flex gap-2">
        <button
          class="flex-1 h-10 rounded-xl bg-[#F7F8F5] hover:bg-[#e8e9e3] text-[#8B9184] font-medium text-sm transition-all"
          @click="handleCancel"
        >
          ยกเลิก
        </button>
        <button
          class="flex-1 h-10 rounded-xl bg-[#c17a4f] hover:bg-[#a0623d] text-white font-medium text-sm transition-all"
          @click="handleConfirm"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </div>
</template>