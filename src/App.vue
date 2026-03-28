<script setup>
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { useThemeStore } from './stores/theme.js'

const vuetifyTheme = useTheme()
const themeStore = useThemeStore()

watch(
  () => themeStore.isDark,
  (dark) => {
    vuetifyTheme.global.name.value = dark ? 'dark' : 'light'
  },
  { immediate: true }
)
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="d-flex justify-center align-center" style="min-height: 100vh">
        <v-btn
          :prepend-icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          @click="themeStore.toggle()"
        >
          {{ themeStore.isDark ? 'Switch to Light' : 'Switch to Dark' }}
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>
