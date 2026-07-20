<script setup>
import { ref, computed, watch } from 'vue'
import { GoogleMap, Marker, InfoWindow } from 'vue3-google-map'

definePageMeta({ ssr: false })

const config = useRuntimeConfig()

const { currentUser, logout, apiFetch } = useAuth()

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap'
    }
  ]
})

const searchQuery = ref('')
const debouncedSearchQuery = ref('') // เก็บค่าหลังจากหน่วงเวลา
const filterCategory = ref('')
const filterCapacity = ref('')
const filterMinPrice = ref('')
const filterMaxPrice = ref('')
const filterQuickMeal = ref(false)

const page = ref(1)
const totalPages = ref(1)
const restaurantsList = ref([])

const isAddMode = ref(false)
const clickedLat = ref(null)
const clickedLng = ref(null)


//สำหรับ
const isReviewsPanelOpen = ref(false)
const reviewsPanelRestaurant = ref(null)

const openReviewsPanel = (restaurant) => {
  console.log('DEBUG openReviewsPanel called with:', restaurant)
  reviewsPanelRestaurant.value = restaurant
  isReviewsPanelOpen.value = true
}

const closeReviewsPanel = () => {
  isReviewsPanelOpen.value = false
}

const handleReviewsUpdated = () => {
  refresh()
}

let searchTimeout = null
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newVal
  }, 400)
})

const mapRef = ref(null)
const zoom = ref(13)
const center = ref({ lat: 13.778021, lng: 100.571930 })
const activeRestaurantId = ref(null)

const apiQuery = computed(() => {
  const q = { page: page.value, limit: 10 }

  if (debouncedSearchQuery.value) q.search = debouncedSearchQuery.value
  if (filterCategory.value) q.category = filterCategory.value
  if (filterCapacity.value) q.capacity = filterCapacity.value
  if (filterMinPrice.value) q.minPrice = filterMinPrice.value
  if (filterMaxPrice.value) q.maxPrice = filterMaxPrice.value
  if (filterQuickMeal.value) q.isQuickMeal = 'true'

  return q
})

const { data: response, pending, error, refresh } = await useFetch(`${config.public.apiBase}/restaurants`, {
  query: apiQuery,
  server: false,
  credentials: 'include',
  watch: [apiQuery]
})

watch(response, (newVal) => {
  if (newVal?.data) {
    if (page.value === 1) {
      restaurantsList.value = newVal.data
    } else {
      restaurantsList.value = [...restaurantsList.value, ...newVal.data]
    }
    totalPages.value = newVal.totalPages || 1
  }
}, { immediate: true })

watch([debouncedSearchQuery, filterCategory, filterCapacity, filterMinPrice, filterMaxPrice, filterQuickMeal], () => {
  page.value = 1
  activeRestaurantId.value = null
})

const loadMore = () => {
  if (page.value < totalPages.value) {
    page.value++
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  filterCategory.value = ''
  filterCapacity.value = ''
  filterMinPrice.value = ''
  filterMaxPrice.value = ''
  filterQuickMeal.value = false
}

const validRestaurants = computed(() => restaurantsList.value.filter(r => r.latitude && r.longitude))

const activeRestaurant = computed(() =>
  validRestaurants.value.find(r => r.id === activeRestaurantId.value) || null
)

const activeInfoPosition = computed(() => {
  if (!activeRestaurant.value) return null
  return {
    lat: Number(activeRestaurant.value.latitude),
    lng: Number(activeRestaurant.value.longitude)
  }
})

const markerIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.6 26.4 0 17 0z" fill="#6E8F72"/>
      <circle cx="17" cy="17" r="6.5" fill="#FFFFFF"/>
    </svg>
  `),
  scaledSize: { width: 34, height: 42 },
  anchor: { x: 17, y: 42 }
}
const activeMarkerIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="40" height="49" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.6 26.4 0 17 0z" fill="#E0A06E"/>
      <circle cx="17" cy="17" r="6.5" fill="#FFFFFF"/>
    </svg>
  `),
  scaledSize: { width: 40, height: 49 },
  anchor: { x: 20, y: 49 }
}

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f7f8f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9a9d92' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e9e3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dde6dc' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eef0ea' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] }
]

const focusRestaurant = (restaurant) => {
  if (activeRestaurantId.value === restaurant.id) {
    activeRestaurantId.value = null
    return
  }

  activeRestaurantId.value = restaurant.id

  if (restaurant.latitude && restaurant.longitude && mapRef.value?.map) {
    const mapInstance = mapRef.value.map
    mapInstance.panTo({
      lat: Number(restaurant.latitude),
      lng: Number(restaurant.longitude)
    })
    mapInstance.setZoom(16)
  }
}

const handleMapClick = (event) => {
  if (isAddMode.value) {
    clickedLat.value = event.latLng.lat()
    clickedLng.value = event.latLng.lng()
  } else {
    activeRestaurantId.value = null
  }
}

const openAddMode = () => {
  if (!currentUser.value) {
    navigateTo('/login')
    return
  }
  isAddMode.value = true
}

const submitNewRestaurantToApi = async (payload, callbacks) => {
  try {
    await apiFetch('/restaurants', {
      method: 'POST',
      body: payload
    })
    alert('เพิ่มร้านอาหารสำเร็จ')
    isAddMode.value = false

    clearFilters()
    page.value = 1

    await refresh()

    callbacks?.onSuccess?.()
  } catch (error) {
    console.error('Error adding restaurant:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มร้านอาหาร')

    callbacks?.onError?.()
  }
}

const tempMarkerIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="40" height="49" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.8 17 25 17 25s17-12.2 17-25C34 7.6 26.4 0 17 0z" fill="#4A90E2"/>
      <circle cx="17" cy="17" r="6.5" fill="#FFFFFF"/>
      <circle cx="17" cy="17" r="3" fill="#4A90E2"/> </svg>
  `),
  scaledSize: { width: 40, height: 49 },
  anchor: { x: 20, y: 49 }
}

watch(isAddMode, (newVal) => {
  if (!newVal) {
    clickedLat.value = null
    clickedLng.value = null
  }
})

</script>

<template>
  <div class="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#F7F8F5] font-['Prompt']">
    <div
      class="w-full md:w-[380px] h-1/2 md:h-full bg-white flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.04)] z-10 relative">
      <div class="px-7 pt-8 pb-6 border-b border-[#EEEFEA]">
        <h1 class="text-2xl font-semibold text-[#31352D] tracking-tight">
          Wong Nine
        </h1>

        <div class="flex items-center justify-between mt-1.5">
          <p class="text-sm text-[#9a9d92] font-light">
            ค้นหาร้านอาหารที่ใช่ ใกล้คุณ
          </p>

          <button v-if="currentUser"
            class="shrink-0 text-[11px] font-medium text-[#8B9184] hover:text-[#c17a4f] flex items-center gap-1 px-2 py-1 rounded-full bg-[#F7F8F5] hover:bg-[#e8e9e3] transition-colors whitespace-nowrap"
            @click="logout">
            <span class="max-w-[80px] truncate">{{ currentUser.name }}</span>
            <span>· ออก</span>
          </button>
          <NuxtLink v-else to="/login"
            class="shrink-0 text-[11px] font-medium text-[#6E8F72] hover:text-[#5a765e] px-2 py-1 rounded-full bg-[#F7F8F5] hover:bg-[#e8e9e3] transition-colors whitespace-nowrap">
            เข้าสู่ระบบ
          </NuxtLink>
        </div>

        <div class="mt-5 relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9d92]" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="ค้นหาร้านอาหาร, หมวดหมู่, ทำเล..." class="w-full h-11 pl-11 pr-4 rounded-full bg-[#F7F8F5] text-sm text-[#31352D] placeholder:text-[#a3a79a]
                   border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none
                   focus:ring-4 focus:ring-[#6E8F72]/10 transition-all duration-200">
        </div>

        <div class="flex justify-between items-end mt-5 mb-2">
          <span class="text-xs font-semibold text-[#8B9184] uppercase tracking-wider">ตัวกรอง</span>
          <div class="flex gap-3">
            <button class="text-xs font-medium text-[#c17a4f] hover:text-[#a0623d] transition-colors"
              @click="clearFilters">
              ล้างค่า
            </button>
            <button
              class="text-xs font-semibold text-white bg-[#6E8F72] hover:bg-[#5a765e] px-3 py-1 rounded-md transition-colors shadow-sm"
              @click="openAddMode">
              +
              เพิ่มร้าน
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <select v-model="filterCategory"
            class="h-9 px-3 rounded-lg bg-[#F7F8F5] text-[13px] text-[#31352D] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10 transition-all cursor-pointer">
            <option value="">
              ทุกประเภท
            </option>
            <option value="คาเฟ่">
              คาเฟ่
            </option>
            <option value="อาหารจานเดียว">
              อาหารจานเดียว
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

          <div class="relative">
            <input v-model="filterCapacity" type="number" min="1" placeholder="จำนวนคน..."
              class="w-full h-9 pl-3 pr-2 rounded-lg bg-[#F7F8F5] text-[13px] text-[#31352D] placeholder:text-[#a3a79a] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10 transition-all">
          </div>

          <input v-model="filterMinPrice" type="number" min="0" placeholder="ราคาต่ำสุด..."
            class="w-full h-9 pl-3 pr-2 rounded-lg bg-[#F7F8F5] text-[13px] text-[#31352D] placeholder:text-[#a3a79a] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10 transition-all">

          <input v-model="filterMaxPrice" type="number" min="0" placeholder="ราคาสูงสุด..."
            class="w-full h-9 pl-3 pr-2 rounded-lg bg-[#F7F8F5] text-[13px] text-[#31352D] placeholder:text-[#a3a79a] border border-transparent focus:border-[#6E8F72]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8F72]/10 transition-all">

          <label
            class="flex items-center justify-center gap-2 cursor-pointer h-9 px-3 rounded-lg bg-[#F7F8F5] border border-transparent hover:bg-[#e8e9e3]/60 transition-all select-none col-span-2">
            <input v-model="filterQuickMeal" type="checkbox"
              class="w-3.5 h-3.5 rounded border-gray-300 text-[#6E8F72] focus:ring-[#6E8F72] focus:ring-offset-0 accent-[#6E8F72]">
            <span class="text-[13px] text-[#31352D]">จานด่วน</span>
          </label>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-3 nice-scroll">
        <div v-if="pending && page === 1" class="flex flex-col items-center justify-center text-[#a3a79a] py-16 gap-3">
          <div class="w-6 h-6 border-2 border-[#e8e9e3] border-t-[#6E8F72] rounded-full animate-spin" />
          <p class="text-sm font-light">
            กำลังค้นหา...
          </p>
        </div>

        <div v-else-if="error" class="text-center py-10 px-5 bg-[#FBF1EC] rounded-2xl">
          <p class="text-sm font-medium text-[#c17a4f]">
            เชื่อมต่อ API ไม่ได้
          </p>
        </div>

        <div v-else-if="restaurantsList.length === 0" class="text-center py-12">
          <p class="text-sm text-[#a3a79a] font-light">
            ไม่พบร้านอาหารที่ตรงกับเงื่อนไข
          </p>
        </div>

        <template v-else>
          <button v-for="restaurant in restaurantsList" :key="restaurant.id" type="button"
            class="w-full text-left p-5 rounded-2xl bg-white transition-all duration-200 group" :class="activeRestaurantId === restaurant.id
              ? 'ring-1 ring-[#6E8F72]/40 shadow-[0_2px_12px_rgba(110,143,114,0.12)]'
              : 'ring-1 ring-[#EEEFEA] hover:ring-[#d9dcd2] hover:shadow-[0_2px_10px_rgba(0,0,0,0.04)]'"
            @click="focusRestaurant(restaurant)">
            <div class="flex justify-between items-start gap-3">
              <h2 class="text-[15px] font-medium text-[#31352D] leading-snug">
                {{ restaurant.name }}
              </h2>
              <div class="flex items-center gap-1 shrink-0 pt-0.5">
                <svg class="w-3.5 h-3.5 text-[#E0A06E]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.285-3.958z" />
                </svg>
                <span class="text-xs font-medium text-[#8B9184]">{{ restaurant.rating || 'New' }}</span>
              </div>
            </div>

            <p class="text-xs font-medium text-[#6E8F72] mt-1.5">
              {{ restaurant.category }}
            </p>

            <div class="flex items-center gap-3 mt-1">
              <p v-if="restaurant.openTime && restaurant.closeTime" class="text-xs text-[#a3a79a] font-light">
                🕐 {{ restaurant.openTime }} - {{ restaurant.closeTime }}
              </p>
              <p v-if="restaurant.minPrice && restaurant.maxPrice" class="text-xs text-[#a3a79a] font-light">
                ฿ {{ restaurant.minPrice }} - {{ restaurant.maxPrice }}
              </p>
            </div>

            <p class="text-xs text-[#a3a79a] mt-3 leading-relaxed line-clamp-2 font-light">
              {{ restaurant.address || 'ไม่มีข้อมูลที่อยู่' }}
            </p>

            <span
              class="inline-block mt-3 text-xs font-medium text-[#6E8F72] hover:text-[#5a765e] hover:underline cursor-pointer"
              @click.stop="openReviewsPanel(restaurant)">
              ดูรีวิว / เขียนรีวิว
            </span>
          </button>

          <div v-if="page < totalPages" class="pt-4 pb-2 flex justify-center">
            <button :disabled="pending"
              class="px-5 py-2 rounded-full bg-[#F7F8F5] text-[13px] font-medium text-[#6E8F72] hover:bg-[#e8e9e3] transition-all ring-1 ring-[#EEEFEA] disabled:opacity-50 disabled:cursor-not-allowed"
              @click="loadMore">
              {{ pending ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม ↓' }}
            </button>
          </div>
        </template>
      </div>

      <AddRestaurantPanel :is-open="isAddMode" :clicked-lat="clickedLat" :clicked-lng="clickedLng"
        :current-user="currentUser" @close="isAddMode = false" @submit="submitNewRestaurantToApi" />
    </div>

    <div class="flex-1 relative z-0 min-h-[300px]">
      <ClientOnly>
        <GoogleMap ref="mapRef" :api-key="config.public.googleMapsApiKey" style="width: 100%; height: 100%"
          :center="center" :zoom="zoom" :styles="mapStyles" :disable-default-ui="true" :zoom-control="true"
          @click="handleMapClick">
          <Marker v-for="restaurant in validRestaurants" :key="`marker-${restaurant.id}`" :options="{
            position: { lat: Number(restaurant.latitude), lng: Number(restaurant.longitude) },
            title: restaurant.name,
            icon: activeRestaurantId === restaurant.id ? activeMarkerIcon : markerIcon
          }" @click="focusRestaurant(restaurant)" />

          <Marker v-if="isAddMode && clickedLat && clickedLng" :options="{
            position: { lat: clickedLat, lng: clickedLng },
            icon: tempMarkerIcon,
            zIndex: 999
          }" />

          <InfoWindow v-if="activeRestaurant"
            :options="{ position: activeInfoPosition, pixelOffset: { width: 0, height: -46 } }"
            @closeclick="activeRestaurantId = null">
            <div class="font-['Prompt'] px-1 py-1 min-w-[170px]">
              <h3 class="text-sm font-medium text-[#31352D] mb-1.5">
                {{ activeRestaurant.name }}
              </h3>
              <p class="text-xs font-medium text-[#6E8F72] mb-1">
                {{ activeRestaurant.category }}
              </p>
              <p v-if="activeRestaurant.openTime && activeRestaurant.closeTime" class="text-xs text-[#8B9184] mb-1">
                🕐 {{ activeRestaurant.openTime }} - {{ activeRestaurant.closeTime }}
              </p>
              <p v-if="activeRestaurant.minPrice && activeRestaurant.maxPrice" class="text-xs text-[#8B9184] mb-2">
                ฿ {{ activeRestaurant.minPrice }} - {{ activeRestaurant.maxPrice }}
              </p>
              <div class="flex items-center gap-1 mb-2">
                <svg class="w-3.5 h-3.5 text-[#E0A06E]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.285-3.958z" />
                </svg>
                <span class="text-xs font-medium text-[#8B9184]">{{ activeRestaurant.rating || 'New' }}</span>
              </div>

              <a v-if="activeRestaurant.googleMapsUrl" :href="activeRestaurant.googleMapsUrl" target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs font-medium text-[#4A90E2] hover:text-[#3a7bc8] hover:underline">
                เปิดใน Google Maps
              </a>

              <span
                class="mt-3 inline-block text-xs font-medium text-[#6E8F72] hover:text-[#5a765e] hover:underline cursor-pointer"
                @click.stop="openReviewsPanel(activeRestaurant)">
                ดูรีวิว / เขียนรีวิว
              </span>
            </div>
          </InfoWindow>
        </GoogleMap>

        <template #fallback>
          <div class="flex items-center justify-center h-full w-full bg-[#F7F8F5]">
            <div class="w-8 h-8 border-2 border-[#e8e9e3] border-t-[#6E8F72] rounded-full animate-spin" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>

  <RestaurantReviewsPanel
  :key="reviewsPanelRestaurant?.id ?? 'none'"
  :is-open="isReviewsPanelOpen"
  :restaurant-id="reviewsPanelRestaurant?.id"
  :restaurant-name="reviewsPanelRestaurant?.name"
  @close="closeReviewsPanel"
  @updated="handleReviewsUpdated"
/>
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

.nice-scroll::-webkit-scrollbar-thumb:hover {
  background: #d9dcd2;
}
</style>