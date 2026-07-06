<script setup>
import { reactive, watch } from 'vue'

// 1. รับค่า (Props) จากหน้าหลัก (index.vue)
const props = defineProps({
  isOpen: Boolean,
  clickedLat: Number,
  clickedLng: Number,
  currentUser: Object
})

// 2. ส่งสัญญาณ (Emits) กลับไปหาหน้าหลักเมื่อกดปิด หรือกดบันทึก
const emit = defineEmits(['close', 'submit'])

// 3. ตัวแปรเก็บข้อมูลฟอร์ม
const form = reactive({
  name: '',
  category: '',
  capacity: '',
  isBreakfast: false,
  isLunch: false,
  isDinner: false,
  isQuickMeal: false,
  address: '',
  latitude: null,
  longitude: null
})

// 🌟 ดักจับเมื่อผู้ใช้คลิกแผนที่ (props.clickedLat/Lng เปลี่ยน) ให้เอามาอัปเดตในฟอร์ม
watch(() => props.clickedLat, (newVal) => { form.latitude = newVal })
watch(() => props.clickedLng, (newVal) => { form.longitude = newVal })

// ฟังก์ชันเคลียร์ฟอร์ม
const resetForm = () => {
  form.name = ''
  form.category = ''
  form.capacity = ''
  form.isBreakfast = false
  form.isLunch = false
  form.isDinner = false
  form.isQuickMeal = false
  form.address = ''
  form.latitude = null
  form.longitude = null
}

const closePanel = () => {
  emit('close')
}

const handleSubmit = () => {
  if (!props.currentUser) return alert('กรุณาล็อกอินก่อนเพิ่มร้านอาหาร')
  if (!form.latitude || !form.longitude) return alert('กรุณาจิ้มเลือกพิกัดร้านบนแผนที่')

  // แพ็กข้อมูลเตรียมส่ง
  const payload = {
    ...form,
    userId: props.currentUser.id,
    capacity: Number(form.capacity)
  }

  // ส่งข้อมูลที่แพ็กเสร็จแล้วกลับไปให้หน้า index.vue เป็นคนจัดการยิง API
  emit('submit', payload)
  
  // สมมติว่าบันทึกสำเร็จ ค่อยล้างฟอร์มแล้วปิด
  resetForm()
  closePanel()
}
</script>

<template>
  <div 
    v-if="isOpen" 
    class="absolute inset-0 bg-white z-20 flex flex-col h-full shadow-[2px_0_10px_rgba(0,0,0,0.05)] transform transition-transform duration-300"
  >
    <div class="px-6 py-5 border-b border-[#EEEFEA] flex justify-between items-center bg-[#F7F8F5]">
      <h2 class="text-lg font-semibold text-[#31352D]">เพิ่มร้านอาหารใหม่</h2>
      <button @click="closePanel" class="text-[#a3a79a] hover:text-[#c17a4f] p-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4 nice-scroll">
      <div>
        <label class="block text-xs font-medium text-[#8B9184] mb-1">ชื่อร้าน <span class="text-red-400">*</span></label>
        <input v-model="form.name" type="text" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10" placeholder="ระบุชื่อร้าน">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">หมวดหมู่ <span class="text-red-400">*</span></label>
          <select v-model="form.category" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
            <option value="" disabled>เลือกประเภท...</option>
            <option value="คาเฟ่">คาเฟ่</option>
            <option value="อาหารจานเดียว">อาหารจานเดียว</option>
            <option value="อาหารตามสั่ง">อาหารตามสั่ง</option>
            <option value="ชาบู/บุฟเฟต์">ชาบู/บุฟเฟต์</option>
            <option value="อาหารอีสาน">อาหารอีสาน</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">รองรับ (จำนวนคน)</label>
          <input v-model="form.capacity" type="number" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10" placeholder="เช่น 4, 10">
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-[#8B9184] mb-2">ช่วงเวลาที่เปิดขาย</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.isBreakfast" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] focus:ring-[#6E8F72] accent-[#6E8F72]"><span class="text-sm text-[#31352D]">เช้า</span></label>
          <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.isLunch" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] focus:ring-[#6E8F72] accent-[#6E8F72]"><span class="text-sm text-[#31352D]">เที่ยง</span></label>
          <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.isDinner" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] focus:ring-[#6E8F72] accent-[#6E8F72]"><span class="text-sm text-[#31352D]">เย็น</span></label>
        </div>
      </div>

      <label class="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-[#F7F8F5] border border-transparent hover:border-[#6E8F72]/30 transition-colors">
        <input v-model="form.isQuickMeal" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] focus:ring-[#6E8F72] accent-[#6E8F72]">
        <span class="text-sm text-[#31352D] font-medium">เป็นอาหารจานด่วน (ทำไว/รอไม่นาน)</span>
      </label>

      <div>
        <label class="block text-xs font-medium text-[#8B9184] mb-1">ที่อยู่ร้าน</label>
        <textarea v-model="form.address" rows="2" class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10" placeholder="รายละเอียดที่อยู่..."></textarea>
      </div>

      <div class="p-4 bg-[#FBF1EC] rounded-xl border border-[#F2DED4]">
        <p class="text-[13px] text-[#c17a4f] font-medium mb-2">📍 คลิกบนแผนที่เพื่อปักหมุดตำแหน่งร้าน</p>
        <div class="text-xs text-[#a0623d] space-y-1">
          <p>Lat: {{ form.latitude || '-' }}</p>
          <p>Lng: {{ form.longitude || '-' }}</p>
        </div>
      </div>
    </div>

    <div class="p-5 border-t border-[#EEEFEA] bg-white">
      <button @click="handleSubmit" class="w-full py-3 rounded-xl bg-[#6E8F72] hover:bg-[#5a765e] text-white font-medium text-sm transition-all shadow-md">
        บันทึกข้อมูลร้าน
      </button>
    </div>
  </div>
</template>