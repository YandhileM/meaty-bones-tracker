<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '../stores/customers.js'

const route = useRoute()
const router = useRouter()
const store = useCustomersStore()

onMounted(async () => {
  if (store.customers.length === 0) await store.fetchCustomers()
})

const customer = computed(() =>
  store.customers.find((c) => c.customerID === route.params.id)
)
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
      </div>

      <!-- Stat cards -->
      <v-row class="mb-6">
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Lifetime Value</div>
              <div class="text-h6">R0.00</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Avg Packets / Month</div>
              <div class="text-h6">—</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">Avg Days to Payment</div>
              <div class="text-h6">—</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3" class="d-flex align-center">
          <v-chip color="warning" variant="tonal" prepend-icon="mdi-clock-alert-outline" disabled>
            Gone Quiet
          </v-chip>
        </v-col>
      </v-row>

      <!-- Order history -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1 px-4 pt-4">Order History</v-card-title>
        <v-card-text class="text-medium-emphasis">
          No orders yet.
        </v-card-text>
      </v-card>

      <!-- Payment history -->
      <v-card>
        <v-card-title class="text-subtitle-1 px-4 pt-4">Payment History</v-card-title>
        <v-card-text class="text-medium-emphasis">
          No payments yet.
        </v-card-text>
      </v-card>
    </template>

    <v-alert v-else type="warning" variant="tonal">
      Customer not found.
    </v-alert>
  </v-container>
</template>
