import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readRange, appendRow, updateRange } from '../services/sheets.js'

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref([])

  async function fetchCustomers() {
    const res = await readRange('Customers!A:E')
    const rows = res.values || []
    customers.value = rows.slice(1).map((row) => ({
      customerID: row[0] ?? '',
      name:       row[1] ?? '',
      phone:      row[2] ?? '',
      dateAdded:  row[3] ?? '',
      notes:      row[4] ?? '',
    }))
  }

  async function addCustomer(customer) {
    await appendRow('Customers!A:E', [
      customer.customerID,
      customer.name,
      "'" + customer.phone,
      customer.dateAdded,
      customer.notes,
    ])
    customers.value.push(customer)
  }

  async function updateCustomer(customerID, updatedData) {
    const index = customers.value.findIndex((c) => c.customerID === customerID)
    if (index === -1) return
    const sheetRow = index + 2 // +1 for header, +1 for 1-based index
    const existing = customers.value[index]
    await updateRange(`Customers!A${sheetRow}:E${sheetRow}`, [
      customerID,
      updatedData.name,
      "'" + updatedData.phone,
      existing.dateAdded,
      updatedData.notes,
    ])
    customers.value[index] = { ...existing, ...updatedData }
  }

  return { customers, fetchCustomers, addCustomer, updateCustomer }
})
