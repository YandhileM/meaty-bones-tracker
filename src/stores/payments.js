import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readRange, appendRow } from '../services/sheets.js'

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref([])

  async function fetchPayments() {
    const res = await readRange('Payments!A:G')
    const rows = res.values || []
    payments.value = rows.slice(1).map((row) => ({
      paymentID:    row[0] ?? '',
      orderID:      row[1] ?? '',
      customerID:   row[2] ?? '',
      customerName: row[3] ?? '',
      amountPaid:   row[4] ?? '',
      datePaid:     row[5] ?? '',
      notes:        row[6] ?? '',
    }))
  }

  async function addPayment(payment) {
    await appendRow('Payments!A:G', [
      payment.paymentID,
      payment.orderID,
      payment.customerID,
      payment.customerName,
      payment.amountPaid,
      payment.datePaid,
      payment.notes,
    ])
    payments.value.push(payment)
  }

  return { payments, fetchPayments, addPayment }
})
