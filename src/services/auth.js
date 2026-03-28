export function saveAuth(token, expiresAt) {
  localStorage.setItem('ft_token', token)
  localStorage.setItem('ft_expires', expiresAt)
}

export function getToken() {
  return localStorage.getItem('ft_token')
}

export function isAuthenticated() {
  const token = localStorage.getItem('ft_token')
  const expires = localStorage.getItem('ft_expires')
  return !!token && Date.now() < Number(expires)
}

export function clearAuth() {
  localStorage.removeItem('ft_token')
  localStorage.removeItem('ft_expires')
}

export async function login(username, password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Login failed')
  }

  const { token, expiresAt } = await res.json()
  saveAuth(token, expiresAt)
  return token
}
