<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../services/auth.js'

const router = useRouter()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="d-flex justify-center align-center" style="min-height: 100vh">
        <v-card width="360" elevation="4">
          <v-card-title class="pt-6 px-6 text-h6">Sign In</v-card-title>
          <v-card-text class="px-6">
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              density="compact"
            >
              {{ error }}
            </v-alert>

            <v-text-field
              v-model="username"
              label="Username"
              autocomplete="username"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              autocomplete="current-password"
              variant="outlined"
              density="comfortable"
              @click:append-inner="showPassword = !showPassword"
              @keyup.enter="handleSubmit"
            />
          </v-card-text>

          <v-card-actions class="px-6 pb-6">
            <v-btn
              block
              color="primary"
              variant="flat"
              size="large"
              :loading="loading"
              @click="handleSubmit"
            >
              Sign In
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
