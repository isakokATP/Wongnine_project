<script setup>
const { initAuth } = useAuth()

await initAuth()
</script>
<template>
  <div>
  <NuxtPage />
  </div>
</template>