<script setup>
import { computed, onMounted } from 'vue'
import { useOrdersStore } from '../stores/orders.js'
import { usePaymentsStore } from '../stores/payments.js'
import { useBatchesStore } from '../stores/batches.js'
import { useCustomersStore } from '../stores/customers.js'

const ordersStore = useOrdersStore()
const paymentsStore = usePaymentsStore()
const batchesStore = useBatchesStore()
const customersStore = useCustomersStore()

onMounted(() => Promise.all([
  ordersStore.fetchOrders(),
  paymentsStore.fetchPayments(),
  batchesStore.fetchBatches(),
  customersStore.fetchCustomers(),
]))

const today = new Date()
today.setHours(0, 0, 0, 0)

const twoMonthsAgo = new Date(today)
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

function fmt(val) {
  const n = Number(val)
  return isNaN(n) ? 'R0.00' : `R${n.toFixed(2)}`
}

// Payments summed by orderID
const paidByOrder = computed(() => {
  const map = {}
  for (const p of paymentsStore.payments) {
    map[p.orderID] = (map[p.orderID] || 0) + Number(p.amountPaid || 0)
  }
  return map
})

// 1. Who owes what — outstanding balance per customer
const whoOwesWhat = computed(() => {
  const balances = {}
  for (const o of ordersStore.orders) {
    if (!balances[o.customerID]) {
      balances[o.customerID] = { customerID: o.customerID, customerName: o.customerName, balance: 0 }
    }
    const paid = paidByOrder.value[o.orderID] || 0
    balances[o.customerID].balance += Number(o.totalOwed || 0) - paid
  }
  return Object.values(balances)
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
})

// 2. Overdue orders — past due date and not fully Paid
const overdueOrders = computed(() =>
  ordersStore.orders.filter((o) => {
    if (o.status === 'Paid') return false
    if (!o.dueDate) return false
    const due = new Date(o.dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
)

// 3. Profit per batch
const profitPerBatch = computed(() => {
  const ordersByBatch = {}
  for (const o of ordersStore.orders) {
    if (!ordersByBatch[o.batchID]) ordersByBatch[o.batchID] = []
    ordersByBatch[o.batchID].push(o.orderID)
  }

  return batchesStore.batches.map((b) => {
    const orderIDs = ordersByBatch[b.batchID] || []
    const received = orderIDs.reduce((sum, id) => sum + (paidByOrder.value[id] || 0), 0)
    const invested = Number(b.totalInvested || 0)
    return { ...b, received, profit: received - invested }
  })
})

// 4. Gone quiet — last order more than 2 months ago (or never ordered)
const goneQuiet = computed(() => {
  const lastOrder = {}
  for (const o of ordersStore.orders) {
    const d = new Date(o.dateGiven)
    if (!lastOrder[o.customerID] || d > lastOrder[o.customerID]) {
      lastOrder[o.customerID] = d
    }
  }
  return customersStore.customers.filter((c) => {
    const last = lastOrder[c.customerID]
    if (!last) return false // never ordered — exclude from "gone quiet"
    return last < twoMonthsAgo
  })
})
</script>

<template>
  <v-container class="mt-4">
    <div class="text-h6 mb-5">Reports</div>

    <!-- 1. Who owes what -->
    <div class="text-subtitle-1 mb-2">Who Owes What</div>
    <v-card class="mb-6">
      <v-table density="compact">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Outstanding Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="whoOwesWhat.length === 0">
            <td colspan="2" class="text-center text-medium-emphasis py-4">All clear — no outstanding balances.</td>
          </tr>
          <tr v-for="c in whoOwesWhat" :key="c.customerID">
            <td>{{ c.customerName }}</td>
            <td>{{ fmt(c.balance) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- 2. Overdue orders -->
    <div class="text-subtitle-1 mb-2">Overdue Orders</div>
    <v-card class="mb-6">
      <v-table density="compact">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Order ID</th>
            <th>Total Owed</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="overdueOrders.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-4">No overdue orders.</td>
          </tr>
          <tr v-for="o in overdueOrders" :key="o.orderID">
            <td>{{ o.customerName }}</td>
            <td>{{ o.orderID }}</td>
            <td>{{ fmt(o.totalOwed) }}</td>
            <td>{{ o.dueDate }}</td>
            <td>
              <v-chip :color="o.status === 'Partial' ? 'warning' : 'error'" size="small" variant="tonal">
                {{ o.status }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- 3. Profit per batch -->
    <div class="text-subtitle-1 mb-2">Profit per Batch</div>
    <v-card class="mb-6">
      <v-table density="compact">
        <thead>
          <tr>
            <th>Date</th>
            <th>Packets</th>
            <th>Total Invested</th>
            <th>Total Received</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="profitPerBatch.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-4">No batches yet.</td>
          </tr>
          <tr v-for="b in profitPerBatch" :key="b.batchID">
            <td>{{ b.date }}</td>
            <td>{{ b.packetsBought }}</td>
            <td>{{ fmt(b.totalInvested) }}</td>
            <td>{{ fmt(b.received) }}</td>
            <td :class="b.profit >= 0 ? 'text-success' : 'text-error'">
              {{ fmt(b.profit) }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- 4. Gone quiet -->
    <div class="text-subtitle-1 mb-2">Gone Quiet <span class="text-caption text-medium-emphasis">(no order in 2+ months)</span></div>
    <v-card>
      <v-table density="compact">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="goneQuiet.length === 0">
            <td colspan="2" class="text-center text-medium-emphasis py-4">No customers gone quiet.</td>
          </tr>
          <tr v-for="c in goneQuiet" :key="c.customerID">
            <td>{{ c.name }}</td>
            <td>{{ c.phone }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>
