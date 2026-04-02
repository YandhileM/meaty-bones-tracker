import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readRange, appendRow } from '../services/sheets.js'

export const useBatchesStore = defineStore('batches', () => {
  const batches = ref([])

  async function fetchBatches() {
    const res = await readRange('Batches!A:G')
    const rows = res.values || []
    batches.value = rows.slice(1).map((row) => ({
      batchID:               row[0] ?? '',
      date:                  row[1] ?? '',
      packetsBought:         row[2] ?? '',
      costPricePerPacket:    row[3] ?? '',
      sellingPricePerPacket: row[4] ?? '',
      totalInvested:         row[5] ?? '',
      notes:                 row[6] ?? '',
    }))
  }

  async function addBatch(batch) {
    await appendRow('Batches!A:G', [
      batch.batchID,
      batch.date,
      batch.packetsBought,
      batch.costPricePerPacket,
      batch.sellingPricePerPacket,
      batch.totalInvested,
      batch.notes,
    ])
    batches.value.push(batch)
  }

  return { batches, fetchBatches, addBatch }
})
