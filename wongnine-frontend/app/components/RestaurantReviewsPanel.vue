<script setup>
import { ref, reactive, computed, watch } from 'vue'

const config = useRuntimeConfig()
const { currentUser, apiFetch } = useAuth()

const props = defineProps({
    isOpen: Boolean,
    restaurantId: Number,
    restaurantName: String
})

const emit = defineEmits(['close', 'updated'])

const reviews = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const editingReviewId = ref(null) // null = โหมดเขียนใหม่, มีค่า = กำลังแก้ไขรีวิวนี้

const MAX_IMAGES = 3
const reviewImages = ref([])
const reviewImagePreviews = ref([])
const existingImageUrls = ref([]) // รูปเดิมตอนแก้ไข (ยังไม่ได้ลบ)

const form = reactive({
    rating: 5,
    comment: ''
})

// รีวิวของ user คนปัจจุบัน (ถ้ามี) — ใช้เช็คว่าควรโชว์ฟอร์มเขียนใหม่ หรือปุ่มแก้ไข
const myReview = computed(() => {
    if (!currentUser.value) return null
    return reviews.value.find(r => r.user?.id === currentUser.value.id) || null
})

const isEditing = computed(() => editingReviewId.value !== null)

const resetImageState = () => {
    reviewImagePreviews.value.forEach((url) => URL.revokeObjectURL(url))
    reviewImages.value = []
    reviewImagePreviews.value = []
    existingImageUrls.value = []
}

const resetForm = () => {
    form.rating = 5
    form.comment = ''
    editingReviewId.value = null
    resetImageState()
}

const fetchReviews = async () => {
    if (!props.restaurantId) return
    isLoading.value = true
    try {
        const res = await $fetch(`${config.public.apiBase}/restaurants/${props.restaurantId}/reviews`, {
            credentials: 'include'
        })
        reviews.value = res.data || []
    } catch (err) {
        console.error('Error fetching reviews:', err)
        reviews.value = []
    } finally {
        isLoading.value = false
    }
}

// watch(() => props.isOpen, (open) => {
//     if (open) {
//         resetForm()
//         fetchReviews()
//     }
// })

watch(
    () => [props.isOpen, props.restaurantId],
    ([open]) => {
        if (open) {
            resetForm()
            fetchReviews()
        }
    },
    { immediate: true }
)

const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files)
    const currentCount = reviewImages.value.length + existingImageUrls.value.length
    const availableSlots = MAX_IMAGES - currentCount

    if (newFiles.length > availableSlots) {
        alert(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูป (เหลือที่ว่าง ${availableSlots} รูป)`)
    }

    const filesToAdd = newFiles.slice(0, availableSlots)
    filesToAdd.forEach((file) => {
        reviewImages.value.push(file)
        reviewImagePreviews.value.push(URL.createObjectURL(file))
    })

    event.target.value = ''
}

const removeNewImageAt = (index) => {
    URL.revokeObjectURL(reviewImagePreviews.value[index])
    reviewImages.value.splice(index, 1)
    reviewImagePreviews.value.splice(index, 1)
}

const removeExistingImageAt = (index) => {
    existingImageUrls.value.splice(index, 1)
}

const uploadNewImages = async () => {
    if (reviewImages.value.length === 0) return []
    const formData = new FormData()
    reviewImages.value.forEach((file) => formData.append('files', file))

    const res = await $fetch(`${config.public.apiBase}/restaurants/upload-images`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    })
    return res.imageUrls
}

const startEdit = (review) => {
    editingReviewId.value = review.id
    form.rating = Number(review.rating)
    form.comment = review.comment
    existingImageUrls.value = [...(review.imageUrls || [])]
    reviewImages.value = []
    reviewImagePreviews.value = []
}

const cancelEdit = () => {
    resetForm()
}

const handleSubmit = async () => {
    if (isSubmitting.value) return

    if (!currentUser.value) {
        alert('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว')
        navigateTo('/login')
        return
    }

    form.comment = form.comment.trim()
    if (!form.comment) return alert('กรุณากรอกข้อความรีวิว')
    if (!form.rating || form.rating < 1 || form.rating > 5) return alert('กรุณาให้คะแนนระหว่าง 1-5')

    isSubmitting.value = true

    try {
        const newUrls = await uploadNewImages()
        const finalImageUrls = [...existingImageUrls.value, ...newUrls]

        if (isEditing.value) {
            await apiFetch(`/reviews/${editingReviewId.value}`, {
                method: 'PATCH',
                body: {
                    userId: currentUser.value.id,
                    rating: Number(form.rating),
                    comment: form.comment,
                    imageUrls: finalImageUrls
                }
            })
        } else {
            await apiFetch(`/restaurants/${props.restaurantId}/reviews`, {
                method: 'POST',
                body: {
                    userId: currentUser.value.id,
                    rating: Number(form.rating),
                    comment: form.comment,
                    imageUrls: finalImageUrls
                }
            })
        }

        resetForm()
        await fetchReviews()
        emit('updated')
    } catch (err) {
        console.error('Review submit error:', err)
        alert(err.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
        isSubmitting.value = false
    }
}

const handleDelete = async (review) => {
    if (!confirm('ต้องการลบรีวิวนี้ใช่ไหม?')) return

    try {
        await apiFetch(`/reviews/${review.id}`, {
            method: 'DELETE',
            body: { userId: currentUser.value.id }
        })
        resetForm()
        await fetchReviews()
        emit('updated')
    } catch (err) {
        console.error('Delete review error:', err)
        alert(err.data?.message || 'ลบรีวิวไม่สำเร็จ')
    }
}

const closePanel = () => {
    emit('close')
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
    <div v-if="isOpen"
        class="fixed inset-0 bg-[#31352D]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-['Prompt']"
        @click.self="closePanel">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div
                class="px-6 py-5 border-b border-[#EEEFEA] flex justify-between items-center bg-[#F7F8F5] rounded-t-2xl">
                <div>
                    <h2 class="text-base font-semibold text-[#31352D]">
                        รีวิวร้านอาหาร
                    </h2>
                    <p class="text-xs text-[#a3a79a] font-light mt-0.5">
                        {{ restaurantName }}
                    </p>
                </div>
                <button class="text-[#a3a79a] hover:text-[#c17a4f] p-1" @click="closePanel">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5 nice-scroll">
                <!-- ฟอร์มเขียน/แก้ไขรีวิว -->
                <div v-if="!myReview || isEditing" class="space-y-3 pb-4 border-b border-[#EEEFEA]">
                    <h3 class="text-sm font-semibold text-[#6E8F72]">
                        {{ isEditing ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิวของคุณ' }}
                    </h3>

                    <div>
                        <label class="block text-xs font-medium text-[#8B9184] mb-1">คะแนน (1-5 ดาว)</label>
                        <input v-model="form.rating" type="number" min="1" max="5" step="0.5"
                            class="w-full h-10 px-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#E0A06E]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0A06E]/10">
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-[#8B9184] mb-1">ข้อความรีวิว</label>
                        <textarea v-model="form.comment" rows="3" placeholder="รสชาติเป็นยังไงบ้าง..."
                            class="w-full p-3 rounded-lg bg-[#F7F8F5] text-sm text-[#31352D] border border-transparent focus:border-[#E0A06E]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E0A06E]/10"
                            @blur="form.comment = form.comment.trim()" />
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-[#8B9184] mb-2">รูปภาพ (สูงสุด 3 รูป)</label>
                        <div class="flex gap-2 flex-wrap">
                            <div v-for="(url, i) in existingImageUrls" :key="`existing-${i}`"
                                class="relative w-16 h-16 rounded-lg overflow-hidden border border-[#EEEFEA]">
                                <img :src="`${config.public.apiBase}${url}`" class="w-full h-full object-cover">
                                <button class="absolute top-0.5 right-0.5 bg-white/90 text-red-500 rounded-full p-0.5"
                                    @click="removeExistingImageAt(i)">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div v-for="(preview, i) in reviewImagePreviews" :key="`new-${i}`"
                                class="relative w-16 h-16 rounded-lg overflow-hidden border border-[#EEEFEA]">
                                <img :src="preview" class="w-full h-full object-cover">
                                <button class="absolute top-0.5 right-0.5 bg-white/90 text-red-500 rounded-full p-0.5"
                                    @click="removeNewImageAt(i)">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <label v-if="(reviewImages.length + existingImageUrls.length) < 3"
                                class="w-16 h-16 flex items-center justify-center rounded-lg border-2 border-dashed border-[#EEEFEA] cursor-pointer bg-[#F7F8F5] hover:bg-[#e8e9e3]">
                                <span class="text-xs text-[#a3a79a]">+ เพิ่ม</span>
                                <input type="file" class="hidden" accept="image/*" multiple @change="handleFileChange">
                            </label>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button :disabled="isSubmitting"
                            class="flex-1 h-10 rounded-xl bg-[#6E8F72] hover:bg-[#5a765e] text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            @click="handleSubmit">
                            {{ isSubmitting ? 'กำลังบันทึก...' : (isEditing ? 'บันทึกการแก้ไข' : 'ส่งรีวิว') }}
                        </button>
                        <button v-if="isEditing"
                            class="h-10 px-4 rounded-xl bg-[#F7F8F5] hover:bg-[#e8e9e3] text-[#8B9184] font-medium text-sm transition-all"
                            @click="cancelEdit">
                            ยกเลิก
                        </button>
                    </div>
                </div>

                <!-- รีวิวของฉัน (โหมดดูอย่างเดียว พร้อมปุ่มแก้ไข/ลบ) -->
                <div v-else-if="myReview" class="p-4 rounded-xl bg-[#FBF1EC] border border-[#F2DED4] space-y-2">
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-semibold text-[#c17a4f]">รีวิวของคุณ</span>
                        <div class="flex gap-2">
                            <button class="text-xs font-medium text-[#6E8F72] hover:underline"
                                @click="startEdit(myReview)">
                                แก้ไข
                            </button>
                            <button class="text-xs font-medium text-red-500 hover:underline"
                                @click="handleDelete(myReview)">
                                ลบ
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 text-[#E0A06E]" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.285-3.958z" />
                        </svg>
                        <span class="text-xs font-medium text-[#8B9184]">{{ myReview.rating }}</span>
                    </div>
                    <p class="text-sm text-[#31352D]">
                        {{ myReview.comment }}
                    </p>
                </div>

                <!-- ลิสต์รีวิวทั้งหมด -->
                <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-[#6E8F72]">
                        รีวิวทั้งหมด ({{ reviews.length }})
                    </h3>

                    <div v-if="isLoading" class="flex justify-center py-8">
                        <div class="w-6 h-6 border-2 border-[#e8e9e3] border-t-[#6E8F72] rounded-full animate-spin" />
                    </div>

                    <p v-else-if="reviews.length === 0" class="text-sm text-[#a3a79a] font-light text-center py-6">
                        ยังไม่มีรีวิว เป็นคนแรกที่รีวิวร้านนี้เลย!
                    </p>

                    <div v-for="review in reviews" :key="review.id" class="p-4 rounded-xl bg-[#F7F8F5] space-y-2">
                        <div class="flex justify-between items-start">
                            <span class="text-sm font-medium text-[#31352D]">{{ review.user?.name || 'ผู้ใช้' }}</span>
                            <span class="text-[11px] text-[#a3a79a]">{{ formatDate(review.createdAt) }}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-[#E0A06E]" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.285-3.958z" />
                            </svg>
                            <span class="text-xs font-medium text-[#8B9184]">{{ review.rating }}</span>
                        </div>
                        <p class="text-sm text-[#31352D] leading-relaxed">
                            {{ review.comment }}
                        </p>
                        <div v-if="review.imageUrls?.length" class="flex gap-2 flex-wrap pt-1">
                            <img v-for="(url, i) in review.imageUrls" :key="i" :src="`${config.public.apiBase}${url}`"
                                class="w-16 h-16 rounded-lg object-cover border border-[#EEEFEA]">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.nice-scroll::-webkit-scrollbar {
    width: 6px;
}

.nice-scroll::-webkit-scrollbar-track {
    background: transparent;
}

.nice-scroll::-webkit-scrollbar-thumb {
    background: #e8e9e3;
    border-radius: 999px;
}
</style>