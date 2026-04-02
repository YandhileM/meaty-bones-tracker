<script setup>
import { computed, ref, onMounted } from 'vue'
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
