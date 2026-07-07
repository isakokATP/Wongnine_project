<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  clickedLat: Number,
  clickedLng: Number,
  currentUser: Object
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  name: '',
  category: '',
  averagePrice: null,
  capacity: null,
  isBreakfast: false,
  isLunch: false,
  isDinner: false,
  isQuickMeal: false,
  address: '',
  googleMapsUrl: '',
  directionsText: '',
  navigationType: 'walking',
  latitude: null,
  longitude: null,
  reviewRating: 5,
  reviewComment: ''
})

const selectedFile = ref(null)
const imagePreview = ref(null)

watch(() => props.clickedLat, (newVal) => { form.latitude = newVal })
watch(() => props.clickedLng, (newVal) => { form.longitude = newVal })

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    imagePreview.value = URL.createObjectURL(file) // สร้าง URL จำลองเพื่อโชว์พรีวิว
  }
}

const removeImage = () => {
  selectedFile.value = null
  imagePreview.value = null
}

const resetForm = () => {
  form.name = ''
  form.category = ''
  form.averagePrice = null
  form.capacity = null
  form.isBreakfast = false
  form.isLunch = false
  form.isDinner = false
  form.isQuickMeal = false
  form.address = ''
  form.googleMapsUrl = ''
  form.directionsText = ''
  form.navigationType = 'walking'
  form.latitude = null
  form.longitude = null
  form.reviewRating = 5
  form.reviewComment = ''
  removeImage()
}

const closePanel = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!props.currentUser) return alert('กรุณาล็อกอินก่อนเพิ่มร้านอาหาร')
  if (!form.name || !form.category) return alert('กรุณากรอกชื่อร้านและหมวดหมู่ให้ครบถ้วน')
  if (!form.latitude || !form.longitude) return alert('กรุณาจิ้มเลือกพิกัดร้านบนแผนที่')

  let finalImageUrl = null

  if (selectedFile.value) {
    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)

      const uploadRes = await $fetch('http://localhost:3001/restaurants/upload-image', {
        method: 'POST',
        body: formData
      })
      finalImageUrl = uploadRes.imageUrl
    } catch (err) {
      console.error('Upload Error:', err)
      alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่')
      return
    }
  }

  const payload = {
    name: form.name,
    category: form.category,
    averagePrice: Number(form.averagePrice) || 0,
    capacity: Number(form.capacity) || 0,
    isBreakfast: form.isBreakfast,
    isLunch: form.isLunch,
    isDinner: form.isDinner,
    isQuickMeal: form.isQuickMeal,
    latitude: form.latitude,
    longitude: form.longitude,
    address: form.address,
    imageUrl: finalImageUrl,
    googleMapsUrl: form.googleMapsUrl,
    directionsText: form.directionsText,
    navigationType: form.navigationType,
    reviewUserId: props.currentUser.id,
    reviewRating: Number(form.reviewRating),
    reviewComment: form.reviewComment
  }

  emit('submit', payload)
  resetForm()
}
</script>

<template>
  <div 
    v-if="isOpen" 
    class="absolute inset-0 bg-white z-20 flex flex-col h-full shadow-[2px_0_10px_rgba(0,0,0,0.05)] transform transition-transform duration-300"
  >
    <div class="px-6 py-5 border-b border-[#EEEFEA] flex justify-between items-center bg-[#F7F8F5]">
      <h2 class="text-lg font-semibold text-[#31352D]">เพิ่มร้านอาหาร & รีวิวแรก</h2>
      <button @click="closePanel" class="text-[#a3a79a] hover:text-[#c17a4f] p-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5 nice-scroll">
      
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-[#6E8F72] flex items-center gap-2 border-b border-[#EEEFEA] pb-2">
          1. ข้อมูลร้านอาหาร
        </h3>
        
        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ชื่อร้าน <span class="text-red-400">*</span></label>
          <input v-model="form.name" type="text" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[#8B9184] mb-1">หมวดหมู่ <span class="text-red-400">*</span></label>
            <select v-model="form.category" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
              <option value="ก๋วยเตี๋ยว">ก๋วยเตี๋ยว</option>
              <option value="คาเฟ่">คาเฟ่</option>
              <option value="อาหารจานเดียว">อาหารจานเดียว</option>
              <option value="อาหารตามสั่ง">อาหารตามสั่ง</option>
              <option value="ชาบู/บุฟเฟต์">ชาบู/บุฟเฟต์</option>
              <option value="อาหารอีสาน">อาหารอีสาน</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[#8B9184] mb-1">ราคาเฉลี่ย/หัว (บาท)</label>
            <input v-model="form.averagePrice" type="number" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-2">ช่วงเวลาเปิดขาย & ประเภท</label>
          <div class="flex flex-wrap gap-4 mb-3">
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.isBreakfast" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] accent-[#6E8F72]"><span class="text-sm text-[#31352D]">เช้า</span></label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.isLunch" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] accent-[#6E8F72]"><span class="text-sm text-[#31352D]">เที่ยง</span></label>
            <label class="flex items-center gap-2 cursor-pointer"><input v-model="form.isDinner" type="checkbox" class="w-4 h-4 rounded text-[#6E8F72] accent-[#6E8F72]"><span class="text-sm text-[#31352D]">เย็น</span></label>
            <label class="flex items-center gap-2 cursor-pointer ml-auto"><input v-model="form.isQuickMeal" type="checkbox" class="w-4 h-4 rounded text-[#E0A06E] accent-[#E0A06E]"><span class="text-sm font-medium text-[#31352D]">จานด่วน</span></label>
          </div>
        </div>
      </div>

      <div class="space-y-4 pt-2">
        <h3 class="text-sm font-semibold text-[#6E8F72] flex items-center gap-2 border-b border-[#EEEFEA] pb-2">
          2. ที่ตั้งและการเดินทาง
        </h3>
        
        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ที่อยู่ร้าน</label>
          <textarea v-model="form.address" rows="1" class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10"></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">อธิบายเส้นทาง (Directions)</label>
          <textarea v-model="form.directionsText" rows="2" class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10" placeholder="เช่น เดินออกจาก MRT เลี้ยวซ้าย..."></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[#8B9184] mb-1">วิธีเดินทางหลัก</label>
            <select v-model="form.navigationType" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
              <option value="walking">เดินเท้า (Walking)</option>
              <option value="driving">ขับรถ (Driving)</option>
              <option value="transit">รถสาธารณะ (Transit)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[#8B9184] mb-1">ลิงก์ Google Maps</label>
            <input v-model="form.googleMapsUrl" type="url" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
          </div>
        </div>

        <div class="p-3 bg-[#FBF1EC] rounded-xl border border-[#F2DED4] flex items-center justify-between">
          <p class="text-[13px] text-[#c17a4f] font-medium">📍 จิ้มพิกัดร้านบนแผนที่</p>
          <span class="text-xs text-[#a0623d]">{{ form.latitude ? 'เลือกแล้ว ✓' : 'ยังไม่ได้เลือก' }}</span>
        </div>
      </div>

      <div class="space-y-4 pt-2">
        <h3 class="text-sm font-semibold text-[#E0A06E] flex items-center gap-2 border-b border-[#EEEFEA] pb-2">
          3. รีวิวร้านอาหาร
        </h3>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">คะแนน (1-5 ดาว) <span class="text-red-400">*</span></label>
          <input v-model="form.reviewRating" type="number" min="1" max="5" step="0.5" class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#E0A06E]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0A06E]/10">
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ข้อความรีวิว <span class="text-red-400">*</span></label>
          <textarea v-model="form.reviewComment" rows="3" class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#E0A06E]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0A06E]/10" placeholder="รสชาติเป็นยังไงบ้าง..."></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-2">รูปภาพอาหาร/หน้าร้าน</label>
          <div v-if="!imagePreview" class="w-full flex items-center justify-center">
            <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-[#EEEFEA] border-dashed rounded-xl cursor-pointer bg-[#F7F8F5] hover:bg-[#e8e9e3] transition-colors">
              <p class="text-xs text-[#a3a79a] font-medium">+ คลิกอัปโหลดรูป</p>
              <input type="file" class="hidden" accept="image/*" @change="handleFileChange" />
            </label>
          </div>
          <div v-else class="relative w-full h-32 rounded-xl overflow-hidden border border-[#EEEFEA]">
            <img :src="imagePreview" class="w-full h-full object-cover" />
            <button @click="removeImage" class="absolute top-2 right-2 bg-white/90 text-red-500 rounded-full p-1.5 shadow hover:bg-red-50">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>

    </div>

    <div class="p-5 border-t border-[#EEEFEA] bg-white">
      <button @click="handleSubmit" class="w-full py-3 rounded-xl bg-[#6E8F72] hover:bg-[#5a765e] text-white font-medium text-sm transition-all shadow-md">
        บันทึกข้อมูลร้าน & รีวิว
      </button>
    </div>
  </div>
</template>