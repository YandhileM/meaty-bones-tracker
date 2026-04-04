import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readRange, appendRow, updateRange } from '../services/sheets.js'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])

  async function fetchOrders() {
    const res = await readRange('Orders!A:I')
    const rows = res.values || []
    orders.value = rows.slice(1).map((row) => ({
      orderID:      row[0] ?? '',
      batchID:      row[1] ?? '',
      customerID:   row[2] ?? '',
      customerName: row[3] ?? '',
      packetsTaken: row[4] ?? '',
      totalOwed:    row[5] ?? '',
      dateGiven:    row[6] ?? '',
      dueDate:      row[7] ?? '',
      status:       row[8] ?? '',
    }))
  }

  async function addOrder(order) {
    await appendRow('Orders!A:I', [
      order.orderID,
      order.batchID,
      order.customerID,
      order.customerName,
      order.packetsTaken,
      order.totalOwed,
      order.dateGiven,
      order.dueDate,
      order.status,
    ])
    orders.value.push(order)
  }

  async function updateOrderStatus(orderID, status) {
    const index = orders.value.findIndex((o) => o.orderID === orderID)
    if (index === -1) return
    const sheetRow = index + 2 // +1 for header, +1 for 1-based index
    await updateRange(`Orders!I${sheetRow}`, [status])
    orders.value[index] = { ...orders.value[index], status }
  }

  return { orders, fetchOrders, addOrder, updateOrderStatus }
})
