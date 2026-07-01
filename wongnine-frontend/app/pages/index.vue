<script setup>
import { ref, computed } from 'vue'
import { GoogleMap, Marker, InfoWindow } from 'vue3-google-map'

const searchQuery = ref('')
const mapRef = ref(null)
const zoom = ref(13)
const center = ref({ lat: 13.778021, lng: 100.571930 })

const activeRestaurantId = ref(null)

const { data: response, pending, error } = await useFetch('http://localhost:3001/restaurants', {
  query: { page: 1, limit: 10, search: searchQuery },
  server: false,
  watch: [searchQuery]
})

const restaurants = computed(() => response.value?.data || [])

const validRestaurants = computed(() => {
  return restaurants.value.filter(r => r.latitude && r.longitude)
})

const focusRestaurant = (restaurant) => {
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
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-gray-50 font-sans">

    <div class="w-full md:w-1/3 bg-white shadow-xl z-10 flex flex-col border-r border-gray-200">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-3xl font-extrabold text-green-500 tracking-tight">Wong Nine</h1>
        <div class="mt-4">
          <UInput 
            v-model="searchQuery" 
            icon="i-heroicons-magnifying-glass-20-solid" 
            size="lg" 
            color="orange"
            placeholder="ค้นหาร้านอาหาร, หมวดหมู่, ทำเล..." 
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <div v-if="pending" class="text-center text-gray-400 py-10">
          <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin w-8 h-8 mx-auto" />
          <p class="mt-2 text-sm">กำลังโหลดข้อมูล...</p>
        </div>

        <div v-else-if="error" class="text-center text-red-500 py-10 bg-red-50 rounded-lg border border-red-200">
          <p class="font-bold">เชื่อมต่อ API ไม่ได้</p>
        </div>

        <UCard 
          v-else 
          v-for="restaurant in restaurants" 
          :key="restaurant.id" 
          @click="focusRestaurant(restaurant)"
          class="cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all duration-200"
          :ui="{ body: { padding: 'p-4 sm:p-4' }, ring: 'ring-1 ring-gray-200' }"
        >
          <div class="flex justify-between items-start">
            <h2 class="text-lg font-bold text-gray-900">{{ restaurant.name }}</h2>
            <UBadge color="yellow" variant="subtle" size="md">
              <UIcon name="i-heroicons-star-20-solid" class="mr-1 text-yellow-500" />
              <span class="font-bold text-yellow-700">{{ restaurant.rating || 'New' }}</span>
            </UBadge>
          </div>
          <p class="text-orange-500 text-sm font-semibold mt-1">{{ restaurant.category }}</p>
          <p class="text-gray-500 text-sm mt-3 flex items-start gap-1">
            <UIcon name="i-heroicons-map-pin-20-solid" class="mt-0.5 flex-shrink-0 text-gray-400" />
            <span class="line-clamp-2">{{ restaurant.address || 'ไม่มีข้อมูลที่อยู่' }}</span>
          </p>
        </UCard>
      </div>
    </div>

    <div class="hidden md:block w-2/3 bg-slate-100 relative z-0">
      <ClientOnly>
        <GoogleMap
          ref="mapRef"
          api-key="AIzaSyDOzYo8WoJLrQzbOFCQlgQ8lwjPrYpLx1Y" 
          style="width: 100%; height: 100%"
          :center="center"
          :zoom="zoom"
        >
          <Marker 
            v-for="restaurant in validRestaurants" 
            :key="`marker-${restaurant.id}`"
            :options="{ 
              position: { 
                lat: Number(restaurant.latitude), 
                lng: Number(restaurant.longitude) 
              },
              title: restaurant.name
            }"
            @click="activeRestaurantId = restaurant.id"
          >
            <InfoWindow v-if="activeRestaurantId === restaurant.id">
              <div class="text-gray-900 p-1 min-w-[150px]">
                <h3 class="font-bold text-base mb-1">{{ restaurant.name }}</h3>
                <UBadge color="orange" variant="subtle" size="sm">
                  {{ restaurant.category }}
                </UBadge>
                <div class="flex items-center gap-1 mt-2">
                  <UIcon name="i-heroicons-star-20-solid" class="text-yellow-500 w-4 h-4" />
                  <span class="text-sm font-bold">{{ restaurant.rating || 'New' }}</span>
                </div>
              </div>
            </InfoWindow>
          </Marker>
        </GoogleMap>
        
        <template #fallback>
          <div class="flex items-center justify-center h-full w-full bg-slate-100">
            <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin w-10 h-10 text-gray-400" />
          </div>
        </template>
      </ClientOnly>
    </div>

  </div> </template>