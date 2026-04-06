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

const now = new Date()
const currentMonth = now.getMonth()
const currentYear = now.getFullYear()

function isCurrentMonth(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getMonth() === currentMonth && d.getFullYear() === currentYear
}

const totalOutstanding = computed(() => {
  const totalOwed = ordersStore.orders.reduce((sum, o) => sum + Number(o.totalOwed || 0), 0)
  const totalPaid = paymentsStore.payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
  return Math.max(0, totalOwed - totalPaid)
})

const totalProfit = computed(() => {
  const totalReceived = paymentsStore.payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
  const totalInvested = batchesStore.batches.reduce((sum, b) => sum + Number(b.totalInvested || 0), 0)
  return totalReceived - totalInvested
})

const currentMonthReceived = computed(() =>
  paymentsStore.payments
    .filter((p) => isCurrentMonth(p.datePaid))
    .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
)

const currentMonthStillOwed = computed(() => {
  const monthOrders = ordersStore.orders.filter((o) => isCurrentMonth(o.dateGiven))
  const monthOrderIDs = new Set(monthOrders.map((o) => o.orderID))
  const totalOwed = monthOrders.reduce((sum, o) => sum + Number(o.totalOwed || 0), 0)
  const totalPaid = paymentsStore.payments
    .filter((p) => monthOrderIDs.has(p.orderID))
    .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
  return Math.max(0, totalOwed - totalPaid)
})

// Hardcoded Green for all customers until orders/payments logic is wired up
const reliabilityCount = computed(() => ({
  green: customersStore.customers.length,
  yellow: 0,
  red: 0,
}))

function fmt(val) {
  return `R${Number(val).toFixed(2)}`
}
</script>

<template>
  <v-container class="mt-4">
    <div class="text-h6 mb-4">Dashboard</div>

    <!-- Stat cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="error">
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-1">Total Outstanding</div>
            <div class="text-h5 font-weight-bold">{{ fmt(totalOutstanding) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="success">
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-1">Total Profit to Date</div>
            <div class="text-h5 font-weight-bold">{{ fmt(totalProfit) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-1">This Month — Received</div>
            <div class="text-h5 font-weight-bold">{{ fmt(currentMonthReceived) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card variant="tonal" color="warning">
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-1">This Month — Still Owed</div>
            <div class="text-h5 font-weight-bold">{{ fmt(currentMonthStillOwed) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reliability overview -->
    <div class="text-subtitle-1 mb-3">Customer Reliability</div>
    <v-row>
      <v-col cols="4">
        <v-card variant="tonal" color="success">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ reliabilityCount.green }}</div>
            <div class="text-caption mt-1">Green</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card variant="tonal" color="warning">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ reliabilityCount.yellow }}</div>
            <div class="text-caption mt-1">Yellow</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card variant="tonal" color="error">
          <v-card-text class="text-center">
            <div class="text-h4 font-weight-bold">{{ reliabilityCount.red }}</div>
            <div class="text-caption mt-1">Red</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
