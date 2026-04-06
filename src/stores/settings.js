import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readRange, appendRow, updateRange } from '../services/sheets.js'

export const useSettingsStore = defineStore('settings', () => {
  // rows as [{ key, value, sheetRow }] for update lookups
  const _rows = ref([])
  const settings = ref({})

  async function fetchSettings() {
    const res = await readRange('Settings!A:B')
    const rows = res.values || []
    _rows.value = rows.slice(1).map((row, i) => ({
      key:      row[0] ?? '',
      value:    row[1] ?? '',
      sheetRow: i + 2, // +1 header, +1 1-based
    }))
    settings.value = Object.fromEntries(_rows.value.map((r) => [r.key, r.value]))
  }

  async function saveSetting(key, value) {
    const existing = _rows.value.find((r) => r.key === key)
    if (existing) {
      await updateRange(`Settings!A${existing.sheetRow}:B${existing.sheetRow}`, [key, String(value)])
      existing.value = String(value)
    } else {
      await appendRow('Settings!A:B', [key, String(value)])
      _rows.value.push({ key, value: String(value), sheetRow: _rows.value.length + 2 })
    }
    settings.value[key] = String(value)
  }

  return { settings, fetchSettings, saveSetting }
})
