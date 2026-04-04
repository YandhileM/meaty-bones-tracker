<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePaymentsStore } from '../stores/payments.js'
import { useOrdersStore } from '../stores/orders.js'
import { useCustomersStore } from '../stores/customers.js'

const paymentsStore = usePaymentsStore()
const ordersStore = useOrdersStore()
const customersStore = useCustomersStore()

const dialog = ref(false)
const saving = ref(false)
const form = ref({
  customerID: '',
  orderID: '',
  amountPaid: '',
  datePaid: new Date().toISOString().slice(0, 10),
  notes: '',
})

onMounted(() => Promise.all([
  paymentsStore.fetchPayments(),
  ordersStore.fetchOrders(),
  customersStore.fetchCustomers(),
]))

const customerItems = computed(() =>
  customersStore.customers.map((c) => ({ title: c.name, value: c.customerID }))
)

const filteredOrderItems = computed(() => {
  if (!form.value.customerID) return []
  return ordersStore.orders
    .filter(
      (o) =>
        o.customerID === form.value.customerID &&
        (o.status === 'Unpaid' || o.status === 'Partial')
    )
    .map((o) => ({
      title: `${o.orderID} — ${o.dateGiven} — R${Number(o.totalOwed).toFixed(2)} owed`,
      value: o.orderID,
    }))
})

const selectedOrder = computed(() =>
  ordersStore.orders.find((o) => o.orderID === form.value.orderID)
)

const selectedCustomer = computed(() =>
  customersStore.customers.find((c) => c.customerID === form.value.customerID)
)

function onCustomerChange() {
  form.value.orderID = ''
}

function fmt(val) {
  const n = Number(val)
  return isNaN(n) ? '—' : `R${n.toFixed(2)}`
}

async function submit() {
  saving.value = true
  try {
    const amountPaid = Number(form.value.amountPaid)
    const totalOwed = Number(selectedOrder.value.totalOwed)

    await paymentsStore.addPayment({
      paymentID: `PAY-${Date.now()}`,
      orderID: form.value.orderID,
      customerID: form.value.customerID,
      customerName: selectedCustomer.value?.name ?? '',
      amountPaid,
      datePaid: form.value.datePaid,
      notes: form.value.notes,
    })

    const newStatus = amountPaid >= totalOwed ? 'Paid' : 'Partial'
    await ordersStore.updateOrderStatus(form.value.orderID, newStatus)

    dialog.value = false
    form.value = { customerID: '', orderID: '', amountPaid: '', datePaid: new Date().toISOString().slice(0, 10), notes: '' }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="mt-4">
    <div class="d-flex align-center mb-4">
      <span class="text-h6">Payments</span>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
        Log Payment
      </v-btn>
    </div>

    <v-card>
      <v-table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Order ID</th>
            <th>Amount Paid</th>
            <th>Date Paid</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paymentsStore.payments.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-6">
              No payments yet.
            </td>
          </tr>
          <tr v-for="p in paymentsStore.payments" :key="p.paymentID">
            <td>{{ p.customerName }}</td>
            <td>{{ p.orderID }}</td>
            <td>{{ fmt(p.amountPaid) }}</td>
            <td>{{ p.datePaid }}</td>
            <td>{{ p.notes || '—' }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="pt-5 px-6">Log Payment</v-card-title>
        <v-card-text class="px-6">
          <v-select
            v-model="form.customerID"
            :items="customerItems"
            label="Customer"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            @update:model-value="onCustomerChange"
          />
          <v-select
            v-model="form.orderID"
            :items="filteredOrderItems"
            label="Order"
            variant="outlined"
            density="comfortable"
            :disabled="!form.customerID"
            :hint="form.customerID && filteredOrderItems.length === 0 ? 'No unpaid orders for this customer.' : ''"
            persistent-hint
            class="mb-3"
          />
          <v-text-field
            v-if="selectedOrder"
            :model-value="`R${Number(selectedOrder.totalOwed).toFixed(2)}`"
            label="Total Owed"
            variant="outlined"
            density="comfortable"
            readonly
            class="mb-3"
          />
          <v-text-field
            v-model="form.amountPaid"
            label="Amount Paid (R)"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.datePaid"
            label="Date Paid"
            type="date"
            variant="outlined"
            density="comfortable"
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
            :disabled="!form.customerID || !form.orderID || !form.amountPaid || !form.datePaid"
            @click="submit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
