<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useThemeStore } from './stores/theme.js'
import { clearAuth } from './services/auth.js'

const route = useRoute()
const router = useRouter()
const vuetifyTheme = useTheme()
const themeStore = useThemeStore()

const isLoginPage = computed(() => route.path === '/login')

watch(
  () => themeStore.isDark,
  (dark) => {
    vuetifyTheme.global.name.value = dark ? 'dark' : 'light'
  },
  { immediate: true }
)

function logout() {
  clearAuth()
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-navigation-drawer v-if="!isLoginPage" permanent>
      <v-list-item title="Meaty Bones" subtitle="Credit Tracker" class="py-4" />
      <v-divider />

      <v-list nav density="compact">
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/" />
        <v-list-item prepend-icon="mdi-account-group" title="Customers" to="/customers" />
        <v-list-item prepend-icon="mdi-package-variant" title="Stock" to="/stock" />
        <v-list-item prepend-icon="mdi-clipboard-list" title="Orders" to="/orders" />
      </v-list>

      <template #append>
        <v-divider />
        <v-list nav density="compact">
          <v-list-item
            prepend-icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            :title="themeStore.isDark ? 'Light Mode' : 'Dark Mode'"
            @click="themeStore.toggle()"
          />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="logout"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar v-if="!isLoginPage" elevation="1">
      <v-app-bar-title>Meaty Bones Tracker</v-app-bar-title>
      <template #append>
        <v-btn
          :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          @click="themeStore.toggle()"
        />
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
