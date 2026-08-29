<script setup>
import { ref } from "vue";

const email = ref("");
const invalid = ref(true);
const status = ref("");

function handleSubmit(event) {
  const input = event.currentTarget.elements.namedItem("email");
  if (!(input instanceof HTMLInputElement) || !input.validity.valid) {
    invalid.value = true;
    status.value = "";
    return;
  }

  invalid.value = false;
  status.value = `Subscription saved for ${email.value}.`;
}
</script>

<template>
  <main>
    <h1>Newsletter</h1>
    <form novalidate @submit.prevent="handleSubmit">
      <label for="email">Email address</label>
      <input
        id="email"
        v-model="email"
        name="email"
        type="email"
        required
        :aria-invalid="invalid ? 'true' : undefined"
        aria-errormessage="email-error"
      >
      <p id="email-error" v-show="invalid" role="alert">Enter a valid email address.</p>
      <button type="submit">Subscribe</button>
    </form>
    <p role="status" aria-live="polite">{{ status }}</p>
  </main>
</template>
