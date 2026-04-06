<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settings.js'

const settingsStore = useSettingsStore()

const markup = ref(20)
const saving = ref(false)
const saved = ref(false)

onMounted(async () => {
  await settingsStore.fetchSettings()
  const stored = settingsStore.settings['default_markup']
  if (stored !== undefined) markup.value = Number(stored)
})

const previewCost = 100
const previewSelling = computed(() => previewCost * (1 + markup.value / 100))

async function save() {
  saving.value = true
  try {
    await settingsStore.saveSetting('default_markup', markup.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="mt-4" style="max-width: 480px">
    <div class="text-h6 mb-5">Settings</div>

    <v-card>
      <v-card-title class="px-5 pt-5 text-subtitle-1">Default Markup Percentage</v-card-title>
      <v-card-text class="px-5">
        <v-text-field
          v-model.number="markup"
          label="Markup %"
          type="number"
          min="0"
          max="1000"
          variant="outlined"
          density="comfortable"
          suffix="%"
          class="mb-3"
        />

        <v-alert type="info" variant="tonal" density="compact">
          At <strong>{{ markup }}%</strong> markup: a cost of
          <strong>R{{ previewCost.toFixed(2) }}</strong> sells for
          <strong>R{{ previewSelling.toFixed(2) }}</strong>
        </v-alert>
      </v-card-text>
      <v-card-actions class="px-5 pb-5">
        <v-spacer />
        <v-slide-x-transition>
          <span v-if="saved" class="text-success text-caption mr-3">Saved!</span>
        </v-slide-x-transition>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
