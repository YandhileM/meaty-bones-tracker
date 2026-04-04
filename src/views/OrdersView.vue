<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrdersStore } from '../stores/orders.js'
import { useCustomersStore } from '../stores/customers.js'
import { useBatchesStore } from '../stores/batches.js'

const ordersStore = useOrdersStore()
const customersStore = useCustomersStore()
const batchesStore = useBatchesStore()

const dialog = ref(false)
const saving = ref(false)
const form = ref({
  customerID: '',
  batchID: '',
  packetsTaken: '',
  dateGiven: new Date().toISOString().slice(0, 10),
  dueDate: '',
})

onMounted(() => Promise.all([
  ordersStore.fetchOrders(),
  customersStore.fetchCustomers(),
  batchesStore.fetchBatches(),
]))

const customerItems = computed(() =>
  customersStore.customers.map((c) => ({ title: c.name, value: c.customerID }))
)

const batchItems = computed(() =>
  batchesStore.batches.map((b) => ({
    title: `${b.date} — ${b.packetsBought} packets @ R${Number(b.sellingPricePerPacket).toFixed(2)}`,
    value: b.batchID,
  }))
)

const selectedBatch = computed(() =>
  batchesStore.batches.find((b) => b.batchID === form.value.batchID)
)

const selectedCustomer = computed(() =>
  customersStore.customers.find((c) => c.customerID === form.value.customerID)
)

const totalOwed = computed(() => {
  if (!selectedBatch.value || !form.value.packetsTaken) return null
  return Number(form.value.packetsTaken) * Number(selectedBatch.value.sellingPricePerPacket)
})

function statusColor(status) {
  if (status === 'Paid') return 'success'
  if (status === 'Partial') return 'warning'
  return 'error'
}

function fmt(val) {
  const n = Number(val)
  return isNaN(n) ? '—' : `R${n.toFixed(2)}`
}

async function submit() {
  saving.value = true
  try {
    await ordersStore.addOrder({
      orderID: `ORD-${Date.now()}`,
      batchID: form.value.batchID,
      customerID: form.value.customerID,
      customerName: selectedCustomer.value?.name ?? '',
      packetsTaken: Number(form.value.packetsTaken),
      totalOwed: totalOwed.value,
      dateGiven: form.value.dateGiven,
      dueDate: form.value.dueDate,
      status: 'Unpaid',
    })
    dialog.value = false
    form.value = { customerID: '', batchID: '', packetsTaken: '', dateGiven: new Date().toISOString().slice(0, 10), dueDate: '' }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="mt-4">
    <div class="d-flex align-center mb-4">
      <span class="text-h6">Orders</span>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
        Log Order
      </v-btn>
    </div>

    <v-card>
      <v-table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Batch Date</th>
            <th>Packets</th>
            <th>Total Owed</th>
            <th>Date Given</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ordersStore.orders.length === 0">
            <td colspan="7" class="text-center text-medium-emphasis py-6">
              No orders yet.
            </td>
          </tr>
          <tr v-for="o in ordersStore.orders" :key="o.orderID">
            <td>{{ o.customerName }}</td>
            <td>{{ batchesStore.batches.find((b) => b.batchID === o.batchID)?.date ?? o.batchID }}</td>
            <td>{{ o.packetsTaken }}</td>
            <td>{{ fmt(o.totalOwed) }}</td>
            <td>{{ o.dateGiven }}</td>
            <td>{{ o.dueDate }}</td>
            <td>
              <v-select
                :model-value="o.status"
                :items="['Unpaid', 'Partial', 'Paid']"
                density="compact"
                variant="plain"
                hide-details
                style="min-width: 100px"
                @update:model-value="(val) => ordersStore.updateOrderStatus(o.orderID, val)"
              >
                <template #selection="{ item }">
                  <v-chip :color="statusColor(item.value)" size="small" variant="tonal">
                    {{ item.value }}
                  </v-chip>
                </template>
              </v-select>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="pt-5 px-6">Log Order</v-card-title>
        <v-card-text class="px-6">
          <v-select
            v-model="form.customerID"
            :items="customerItems"
            label="Customer"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-select
            v-model="form.batchID"
            :items="batchItems"
            label="Batch"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.packetsTaken"
            label="Packets Taken"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-if="totalOwed !== null"
            :model-value="`R${totalOwed.toFixed(2)}`"
            label="Total Owed (auto-calculated)"
            variant="outlined"
            density="comfortable"
            readonly
            class="mb-3"
          />
          <v-text-field
            v-model="form.dateGiven"
            label="Date Given"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.dueDate"
            label="Due Date"
            type="date"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="saving"
            :disabled="!form.customerID || !form.batchID || !form.packetsTaken || !form.dueDate"
            @click="submit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
