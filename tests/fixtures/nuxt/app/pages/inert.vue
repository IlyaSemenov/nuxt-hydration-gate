<script setup lang="ts">
// The blocking recipe from README.
useHead({ style: [{ innerHTML: "html:not([data-app-hydrated]) form { interactivity: inert; }" }] })
</script>

<template>
  <form @submit.prevent>
    <input aria-label="Name" />
  </form>
</template>
