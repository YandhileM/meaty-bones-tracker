<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomersStore } from '../stores/customers.js'

const store = useCustomersStore()
const router = useRouter()

const dialog = ref(false)
const saving = ref(false)
const form = ref({ name: '', phone: '', notes: '' })

onMounted(() => store.fetchCustomers())

async function submit() {
  saving.value = true
  try {
    await store.addCustomer({
      customerID: `CUS-${Date.now()}`,
      name: form.value.name,
      phone: form.value.phone,
      dateAdded: new Date().toISOString().slice(0, 10),
      notes: form.value.notes,
    })
    dialog.value = false
    form.value = { name: '', phone: '', notes: '' }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container class="mt-4">
    <div class="d-flex align-center mb-4">
      <span class="text-h6">Customers</span>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
        Add Customer
      </v-btn>
    </div>

    <v-card>
      <v-table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Reliability</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.customers.length === 0">
            <td colspan="3" class="text-center text-medium-emphasis py-6">
              No customers yet.
            </td>
          </tr>
          <tr
            v-for="c in store.customers"
            :key="c.customerID"
            style="cursor: pointer"
            @click="router.push(`/customers/${c.customerID}`)"
          >
            <td>{{ c.name }}</td>
            <td>{{ c.phone }}</td>
            <td>
              <v-chip color="success" size="small" variant="tonal">Green</v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="440" persistent>
      <v-card>
        <v-card-title class="pt-5 px-6">Add Customer</v-card-title>
        <v-card-text class="px-6">
          <v-text-field
            v-model="form.name"
            label="Name"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.phone"
            label="Phone"
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
            :disabled="!form.name"
            @click="submit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
