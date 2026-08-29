<script setup>
import { ref } from "vue";

const displayName = ref("");
const status = ref("");

function handleSubmit() {
  const name = displayName.value.trim();
  status.value = name ? `Profile saved for ${name}.` : "Enter a display name.";
}
</script>

<template>
  <main>
    <h1>Account</h1>
    <form @submit.prevent="handleSubmit">
      <label for="display-name">Display name</label>
      <input
        id="display-name"
        v-model="displayName"
        name="displayName"
        autocomplete="name"
      >
      <button type="submit">Save</button>
    </form>
    <p role="status" aria-live="polite">{{ status }}</p>
  </main>
</template>
