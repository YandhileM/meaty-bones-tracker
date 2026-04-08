<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '../stores/customers.js'
import { useOrdersStore } from '../stores/orders.js'
import { usePaymentsStore } from '../stores/payments.js'

const route = useRoute()
const router = useRouter()
const store = useCustomersStore()
const ordersStore = useOrdersStore()
const paymentsStore = usePaymentsStore()

onMounted(() => Promise.all([
  store.customers.length === 0 ? store.fetchCustomers() : Promise.resolve(),
  ordersStore.fetchOrders(),
  paymentsStore.fetchPayments(),
]))

const customer = computed(() =>
  store.customers.find((c) => c.customerID === route.params.id)
)

const customerOrders = computed(() =>
  ordersStore.orders.filter((o) => o.customerID === route.params.id)
)

const customerPayments = computed(() =>
  paymentsStore.payments.filter((p) => p.customerID === route.params.id)
)

function statusColor(status) {
  if (status === 'Paid') return 'success'
  if (status === 'Partial') return 'warning'
  return 'error'
}

function fmt(val) {
  const n = Number(val)
  return isNaN(n) ? '—' : `R${n.toFixed(2)}`
}

const lifetimeValue = computed(() =>
  customerPayments.value.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
)

const avgPacketsPerMonth = computed(() => {
  if (customerOrders.value.length === 0) return null
  const totalPackets = customerOrders.value.reduce((sum, o) => sum + Number(o.packetsTaken || 0), 0)
  const months = new Set(
    customerOrders.value
      .filter((o) => o.dateGiven)
      .map((o) => o.dateGiven.slice(0, 7)) // YYYY-MM
  )
  return months.size > 0 ? (totalPackets / months.size).toFixed(1) : null
})

const avgDaysToPayment = computed(() => {
  const orderMap = Object.fromEntries(customerOrders.value.map((o) => [o.orderID, o]))
  const diffs = customerPayments.value
    .filter((p) => orderMap[p.orderID]?.dueDate && p.datePaid)
    .map((p) => {
      const due = new Date(orderMap[p.orderID].dueDate)
      const paid = new Date(p.datePaid)
      return Math.round((paid - due) / (1000 * 60 * 60 * 24))
    })
  if (diffs.length === 0) return null
  return (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1)
})

const goneQuiet = computed(() => {
  if (customerOrders.value.length === 0) return false
  const last = customerOrders.value
    .filter((o) => o.dateGiven)
    .map((o) => new Date(o.dateGiven))
    .sort((a, b) => b - a)[0]
  if (!last) return false
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  return last < twoMonthsAgo
})

const editDialog = ref(false)
const saving = ref(false)
const editForm = ref({ name: '', phone: '', notes: '' })

function openEdit() {
  editForm.value = {
    name: customer.value.name,
    phone: customer.value.phone,
    notes: customer.value.notes,
  }
  editDialog.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await store.updateCustomer(customer.value.customerID, editForm.value)
    editDialog.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="mt-4">
    <v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4 px-0"
      @click="router.back()"
    >
      Customers
    </v-btn>

    <template v-if="customer">
      <div class="d-flex align-center mb-6">
        <div>
          <h2 class="text-h5">{{ customer.name }}</h2>
          <span class="text-medium-emphasis">{{ customer.phone }}</span>
        </div>
        <v-spacer />
        <v-btn variant="tonal" prepend-icon="mdi-pencil" @click="openEdit">
          Edit
        </v-btn>
      </div>

      <!-- Stat cards -->
      <v-row class="mb-6">
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Lifetime Value</div>
              <div class="text-h6">{{ fmt(lifetimeValue) }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Avg Packets / Month</div>
              <div class="text-h6">{{ avgPacketsPerMonth ?? '—' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Avg Days to Payment</div>
              <div class="text-h6">{{ avgDaysToPayment !== null ? `${avgDaysToPayment}d` : '—' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="goneQuiet" cols="6" sm="3" class="d-flex align-center">
          <v-chip color="warning" variant="tonal" prepend-icon="mdi-clock-alert-outline">
            Gone Quiet
          </v-chip>
        </v-col>
      </v-row>

      <!-- Order history -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1 px-4 pt-4">Order History</v-card-title>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Date Given</th>
              <th>Packets</th>
              <th>Total Owed</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="customerOrders.length === 0">
              <td colspan="5" class="text-center text-medium-emphasis py-4">No orders yet.</td>
            </tr>
            <tr v-for="o in customerOrders" :key="o.orderID">
              <td>{{ o.dateGiven }}</td>
              <td>{{ o.packetsTaken }}</td>
              <td>{{ fmt(o.totalOwed) }}</td>
              <td>{{ o.dueDate }}</td>
              <td>
                <v-chip :color="statusColor(o.status)" size="small" variant="tonal">
                  {{ o.status }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Payment history -->
      <v-card>
        <v-card-title class="text-subtitle-1 px-4 pt-4">Payment History</v-card-title>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Date Paid</th>
              <th>Amount Paid</th>
              <th>Order ID</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="customerPayments.length === 0">
              <td colspan="4" class="text-center text-medium-emphasis py-4">No payments yet.</td>
            </tr>
            <tr v-for="p in customerPayments" :key="p.paymentID">
              <td>{{ p.datePaid }}</td>
              <td>{{ fmt(p.amountPaid) }}</td>
              <td>{{ p.orderID }}</td>
              <td>{{ p.notes || '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </template>

    <v-alert v-else type="warning" variant="tonal">
      Customer not found.
    </v-alert>

    <!-- Edit dialog -->
    <v-dialog v-model="editDialog" max-width="440" persistent>
      <v-card>
        <v-card-title class="pt-5 px-6">Edit Customer</v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="editForm.name"
            label="Name"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="editForm.phone"
            label="Phone"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-textarea
            v-model="editForm.notes"
            label="Notes"
            variant="outlined"
            density="comfortable"
            rows="2"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="saving"
            :disabled="!editForm.name"
            @click="saveEdit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
