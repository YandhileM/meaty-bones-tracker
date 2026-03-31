import { getToken, clearAuth } from './auth.js'

async function request(action, range, values) {
  const res = await fetch('/api/sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ action, range, values }),
  })

  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Request failed')
  }

  return res.json()
}

export function readRange(range) {
  return request('read', range, undefined)
}

export function appendRow(range, values) {
  return request('append', range, values)
}

export function updateRange(range, values) {
  return request('update', range, values)
}
