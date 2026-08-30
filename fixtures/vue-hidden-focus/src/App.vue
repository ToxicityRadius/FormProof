<script setup>
import { ref } from "vue";

const status = ref("");
</script>

<template>
  <main>
    <h1>Account settings</h1>
    <div id="retired-actions" aria-hidden="true">
      <p>Legacy reporting is no longer available.</p>
      <button id="legacy-export" type="button">Export legacy report</button>
    </div>
    <button id="save-changes" type="button" @click="status = 'Changes saved.'">
      Save changes
    </button>
    <p role="status" aria-live="polite">{{ status }}</p>
  </main>
</template>

<style scoped>
button {
  min-block-size: 24px;
  min-inline-size: 24px;
}
</style>
