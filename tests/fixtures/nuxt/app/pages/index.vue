<script setup lang="ts">
const name = ref("")
const result = ref("")
</script>

<template>
  <form @submit.prevent="result = `Hello, ${name}`">
    <input v-model="name" name="name" aria-label="Name" />
    <button>Send</button>
  </form>
  <p id="result">{{ result }}</p>
  <NuxtLink to="/other">Other</NuxtLink>
</template>
