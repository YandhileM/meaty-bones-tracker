<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBatchesStore } from '../stores/batches.js'

const store = useBatchesStore()

const dialog = ref(false)
const saving = ref(false)
const form = ref({
  date: '',
  packetsBought: '',
  costPricePerPacket: '',
  sellingPricePerPacket: '',
  notes: '',
})

const totalInvestedPreview = computed(() => {
  const qty = Number(form.value.packetsBought)
  const cost = Number(form.value.costPricePerPacket)
  return qty > 0 && cost > 0 ? qty * cost : null
})

onMounted(() => store.fetchBatches())

async function submit() {
  saving.value = true
  try {
    const packetsBought = Number(form.value.packetsBought)
    const costPricePerPacket = Number(form.value.costPricePerPacket)
    const sellingPricePerPacket = Number(form.value.sellingPricePerPacket)
    const totalInvested = packetsBought * costPricePerPacket

    await store.addBatch({
      batchID: `BAT-${Date.now()}`,
      date: form.value.date,
      packetsBought,
      costPricePerPacket,
      sellingPricePerPacket,
      totalInvested,
      notes: form.value.notes,
    })
    dialog.value = false
    form.value = { date: '', packetsBought: '', costPricePerPacket: '', sellingPricePerPacket: '', notes: '' }
  } finally {
    saving.value = false
  }
}

function fmt(val) {
  const n = Number(val)
  return isNaN(n) ? '—' : `R${n.toFixed(2)}`
}
</script>

<template>
  <v-container class="mt-4">
    <div class="d-flex align-center mb-4">
      <span class="text-h6">Stock</span>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
        Add Batch
      </v-btn>
    </div>

    <v-card>
      <v-table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Packets Bought</th>
            <th>Cost / Packet</th>
            <th>Selling / Packet</th>
            <th>Total Invested</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.batches.length === 0">
            <td colspan="6" class="text-center text-medium-emphasis py-6">
              No batches yet.
            </td>
          </tr>
          <tr v-for="b in store.batches" :key="b.batchID">
            <td>{{ b.date }}</td>
            <td>{{ b.packetsBought }}</td>
            <td>{{ fmt(b.costPricePerPacket) }}</td>
            <td>{{ fmt(b.sellingPricePerPacket) }}</td>
            <td>{{ fmt(b.totalInvested) }}</td>
            <td>{{ b.notes || '—' }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="460" persistent>
      <v-card>
        <v-card-title class="pt-5 px-6">Add Batch</v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="form.date"
            label="Date"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.packetsBought"
            label="Packets Bought"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.costPricePerPacket"
            label="Cost Price per Packet (R)"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.sellingPricePerPacket"
            label="Selling Price per Packet (R)"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-if="totalInvestedPreview !== null"
            :model-value="`R${totalInvestedPreview.toFixed(2)}`"
            label="Total Invested (auto-calculated)"
            variant="outlined"
            density="comfortable"
            readonly
            class="mb-3"
          />
          <v-textarea
            v-model="form.notes"
            label="Notes"
            variant="outlined"
            density="comfortable"
            rows="2"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="saving"
            :disabled="!form.date || !form.packetsBought || !form.costPricePerPacket || !form.sellingPricePerPacket"
            @click="submit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
