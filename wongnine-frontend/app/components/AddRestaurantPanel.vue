<script setup>
import { reactive, ref, watch } from 'vue'

const config = useRuntimeConfig()

const props = defineProps({
  isOpen: Boolean,
  clickedLat: Number,
  clickedLng: Number,
  currentUser: Object
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  name: '',
  address: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  openTime: '',
  closeTime: '',
  isQuickMeal: false,
  googleMapsUrl: '',
  directionsText: '',
  navigationType: 'walking',
  latitude: null,
  longitude: null,
  reviewRating: 5,
  reviewComment: ''
})

const MAX_IMAGES = 3

const restaurantImages = ref([]) // File[] สูงสุด 3 รูป (รูปร้าน)
const restaurantImagePreviews = ref([])
const reviewImages = ref([]) // File[] สูงสุด 3 รูป (รูปอาหารในรีวิว)
const reviewImagePreviews = ref([])

const isSubmitting = ref(false) // ป้องกันกดปุ่มซ้ำระหว่างรอ API

watch(() => props.clickedLat, (newVal) => { form.latitude = newVal })
watch(() => props.clickedLng, (newVal) => { form.longitude = newVal })

const handleMultiFileChange = (event, filesRef, previewsRef) => {
  const newFiles = Array.from(event.target.files)
  const availableSlots = MAX_IMAGES - filesRef.value.length

  if (newFiles.length > availableSlots) {
    alert(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูป (เหลือที่ว่าง ${availableSlots} รูป)`)
  }

  const filesToAdd = newFiles.slice(0, availableSlots)
  filesToAdd.forEach((file) => {
    filesRef.value.push(file)
    previewsRef.value.push(URL.createObjectURL(file))
  })

  event.target.value = ''
}

const handleRestaurantFileChange = (event) => {
  handleMultiFileChange(event, restaurantImages, restaurantImagePreviews)
}
const handleReviewFileChange = (event) => {
  handleMultiFileChange(event, reviewImages, reviewImagePreviews)
}

const removeRestaurantImageAt = (index) => {
  removeImageAt(index, restaurantImages, restaurantImagePreviews)
}
const removeReviewImageAt = (index) => {
  removeImageAt(index, reviewImages, reviewImagePreviews)
}

const removeImageAt = (index, filesRef, previewsRef) => {
  URL.revokeObjectURL(previewsRef.value[index])
  filesRef.value.splice(index, 1)
  previewsRef.value.splice(index, 1)
}

const clearImageSet = (filesRef, previewsRef) => {
  previewsRef.value.forEach((url) => URL.revokeObjectURL(url))
  filesRef.value = []
  previewsRef.value = []
}

const uploadImages = async (files) => {
  if (files.length === 0) return []

  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const res = await $fetch(`${config.public.apiBase}/restaurants/upload-images`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })
  return res.imageUrls
}

const resetForm = () => {
  form.name = ''
  form.address = ''
  form.category = ''
  form.minPrice = null
  form.maxPrice = null
  form.openTime = ''
  form.closeTime = ''
  form.isQuickMeal = false
  form.googleMapsUrl = ''
  form.directionsText = ''
  form.navigationType = 'walking'
  form.latitude = null
  form.longitude = null
  form.reviewRating = 5
  form.reviewComment = ''

  clearImageSet(restaurantImages, restaurantImagePreviews)
  clearImageSet(reviewImages, reviewImagePreviews)
}

const closePanel = () => {
  emit('close')
}

const trimField = (fieldName) => {
  if (typeof form[fieldName] === 'string') {
    form[fieldName] = form[fieldName].trim()
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return // กันกดซ้ำ

  Object.keys(form).forEach((key) => {
    trimField(key)
  })

  if (!props.currentUser) {
    alert('กรุณาเข้าสู่ระบบก่อนเพิ่มร้านอาหาร')
    navigateTo('/login')
    return
  }
  if (!form.name || !form.category) return alert('กรุณากรอกชื่อร้านและหมวดหมู่ให้ครบถ้วน')
  if (!form.minPrice || !form.maxPrice) return alert('กรุณาระบุช่วงราคา')
  if (Number(form.minPrice) > Number(form.maxPrice)) return alert('ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด')
  if (!form.openTime || !form.closeTime) return alert('กรุณาระบุเวลาเปิด-ปิดร้าน')
  if (!form.latitude || !form.longitude) return alert('กรุณาจิ้มเลือกพิกัดร้านบนแผนที่')
  if (!form.reviewComment) return alert('กรุณากรอกข้อความรีวิว')
  if (!form.reviewRating || form.reviewRating < 1 || form.reviewRating > 5) {
    return alert('กรุณาให้คะแนนระหว่าง 1-5')
  }

  isSubmitting.value = true

  let restaurantImageUrls = []
  let reviewImageUrls = []

  try {
    restaurantImageUrls = await uploadImages(restaurantImages.value)
    reviewImageUrls = await uploadImages(reviewImages.value)
  } catch (err) {
    console.error('Upload Error:', err)
    alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่')
    isSubmitting.value = false
    return
  }

  const payload = {
    name: form.name,
    category: form.category,
    minPrice: Number(form.minPrice),
    maxPrice: Number(form.maxPrice),
    openTime: form.openTime,
    closeTime: form.closeTime,
    isQuickMeal: form.isQuickMeal,
    latitude: form.latitude,
    longitude: form.longitude,
    address: form.address,
    imageUrls: restaurantImageUrls,
    googleMapsUrl: form.googleMapsUrl,
    directionsText: form.directionsText,
    navigationType: form.navigationType,
    reviewUserId: props.currentUser.id,
    reviewRating: Number(form.reviewRating),
    reviewComment: form.reviewComment,
    reviewImageUrls
  }

  emit('submit', payload, {
    onSuccess: () => {
      isSubmitting.value = false
      resetForm()
    },
    onError: () => {
      isSubmitting.value = false
    }
  })
}
</script>

<template>
  <div v-if="isOpen"
    class="absolute inset-0 bg-white z-20 flex flex-col h-full shadow-[2px_0_10px_rgba(0,0,0,0.05)] transform transition-transform duration-300">
    <div class="px-6 py-5 border-b border-[#EEEFEA] flex justify-between items-center bg-[#F7F8F5]">
      <h2 class="text-lg font-semibold text-[#31352D]">
        เพิ่มร้านอาหาร & รีวิวแรก
      </h2>
      <button class="text-[#a3a79a] hover:text-[#c17a4f] p-1" @click="closePanel">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5 nice-scroll">
      <!-- 1. ข้อมูลร้านอาหาร -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-[#6E8F72] flex items-center gap-2 border-b border-[#EEEFEA] pb-2">
          1. ข้อมูลร้านอาหาร
        </h3>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ชื่อร้าน <span
              class="text-red-400">*</span></label>
          <input v-model="form.name" type="text"
            class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10"
            @blur="form.name = form.name.trim()">
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ที่ตั้งร้าน</label>
          <textarea v-model="form.address" rows="1"
            class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10"
            @blur="form.address = form.address.trim()" />
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">หมวดหมู่ <span
              class="text-red-400">*</span></label>
          <select v-model="form.category"
            class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
            <option value="ก๋วยเตี๋ยว">
              ก๋วยเตี๋ยว
            </option>
            <option value="คาเฟ่">
              คาเฟ่
            </option>
            <option value="อาหารตามสั่ง">
              อาหารตามสั่ง
            </option>
            <option value="ชาบู/บุฟเฟต์">
              ชาบู/บุฟเฟต์
            </option>
            <option value="อาหารอีสาน">
              อาหารอีสาน
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ช่วงราคา (บาท) <span
              class="text-red-400">*</span></label>
          <div class="grid grid-cols-2 gap-3">
            <input v-model="form.minPrice" type="number" min="0" placeholder="ต่ำสุด"
              class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
            <input v-model="form.maxPrice" type="number" min="0" placeholder="สูงสุด"
              class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-2">เวลาเปิด - ปิด <span
              class="text-red-400">*</span></label>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <input v-model="form.openTime" type="time"
              class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
            <input v-model="form.closeTime" type="time"
              class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-2">รูปภาพร้านอาหาร (สูงสุด 3 รูป)</label>
          <div class="flex gap-2 flex-wrap">
            <div v-for="(preview, i) in restaurantImagePreviews" :key="i"
              class="relative w-20 h-20 rounded-lg overflow-hidden border border-[#EEEFEA]">
              <img :src="preview" class="w-full h-full object-cover">
              <button class="absolute top-0.5 right-0.5 bg-white/90 text-red-500 rounded-full p-0.5"
                @click="removeRestaurantImageAt(i)">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <label v-if="restaurantImages.length < 3"
              class="w-20 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-[#EEEFEA] cursor-pointer bg-[#F7F8F5] hover:bg-[#e8e9e3]">
              <span class="text-xs text-[#a3a79a]">+ เพิ่ม</span>
              <input type="file" class="hidden" accept="image/*" multiple @change="handleRestaurantFileChange">
            </label>
          </div>
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="form.isQuickMeal" type="checkbox" class="w-4 h-4 rounded text-[#E0A06E] accent-[#E0A06E]">
          <span class="text-sm font-medium text-[#31352D]">จานด่วน</span>
        </label>
      </div>

      <!-- 2. การเดินทาง -->
      <div class="space-y-4 pt-2">
        <h3 class="text-sm font-semibold text-[#6E8F72] flex items-center gap-2 border-b border-[#EEEFEA] pb-2">
          2. การเดินทาง
        </h3>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">อธิบายเส้นทาง (Directions)</label>
          <textarea v-model="form.directionsText" rows="2"
            class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10"
            placeholder="เช่น เดินออกจาก MRT เลี้ยวซ้าย..." />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-[#8B9184] mb-1">วิธีเดินทาง</label>
            <select v-model="form.navigationType"
              class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10">
              <option value="walking">
                เดินเท้า (Walking)
              </option>
              <option value="driving">
                ขับรถ (Driving)
              </option>
              <option value="transit">
                รถสาธารณะ (Transit)
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-[#8B9184] mb-1">ลิงก์ Google Maps</label>
            <input v-model="form.googleMapsUrl" type="url"
              class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10"
              @blur="form.googleMapsUrl = form.googleMapsUrl.trim()">
          </div>
        </div>

        <div class="p-3 bg-[#FBF1EC] rounded-xl border border-[#F2DED4] flex items-center justify-between">
          <p class="text-[13px] text-[#c17a4f] font-medium">
            📍 จิ้มพิกัดร้านบนแผนที่
          </p>
          <span class="text-xs text-[#a0623d]">{{ form.latitude ? 'เลือกแล้ว ✓' : 'ยังไม่ได้เลือก' }}</span>
        </div>
      </div>

      <!-- 3. รีวิวร้านอาหาร -->
      <div class="space-y-4 pt-2">
        <h3 class="text-sm font-semibold text-[#E0A06E] flex items-center gap-2 border-b border-[#EEEFEA] pb-2">
          3. รีวิวร้านอาหาร
        </h3>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">คะแนน (1-5 ดาว) <span
              class="text-red-400">*</span></label>
          <input v-model="form.reviewRating" type="number" min="1" max="5" step="0.5"
            class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#E0A06E]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0A06E]/10">
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-1">ข้อความรีวิว <span
              class="text-red-400">*</span></label>
          <textarea v-model="form.reviewComment" rows="3"
            class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#E0A06E]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0A06E]/10"
            placeholder="รสชาติเป็นยังไงบ้าง..." @blur="form.reviewComment = form.reviewComment.trim()" />
        </div>

        <div>
          <label class="block text-xs font-medium text-[#8B9184] mb-2">รูปภาพอาหาร/เมนู (สูงสุด 3 รูป)</label>
          <div class="flex gap-2 flex-wrap">
            <div v-for="(preview, i) in reviewImagePreviews" :key="i"
              class="relative w-20 h-20 rounded-lg overflow-hidden border border-[#EEEFEA]">
              <img :src="preview" class="w-full h-full object-cover">
              <button class="absolute top-0.5 right-0.5 bg-white/90 text-red-500 rounded-full p-0.5"
                @click="removeReviewImageAt(i)">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <label v-if="reviewImages.length < 3"
              class="w-20 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-[#EEEFEA] cursor-pointer bg-[#F7F8F5] hover:bg-[#e8e9e3]">
              <span class="text-xs text-[#a3a79a]">+ เพิ่ม</span>
              <input type="file" class="hidden" accept="image/*" multiple @change="handleReviewFileChange">
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="p-5 border-t border-[#EEEFEA] bg-white">
      <button :disabled="isSubmitting"
        class="w-full py-3 rounded-xl bg-[#6E8F72] hover:bg-[#5a765e] text-white font-medium text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSubmit">
        {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลร้าน & รีวิว' }}
      </button>
    </div>
  </div>
</template>