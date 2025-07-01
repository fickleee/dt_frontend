// JWT token 相关操作
const TOKEN_KEY = 'access_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

export function getUserType() {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded ? decoded.user_type : null
}

export function getUsername() {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded ? decoded.username : null
}

export function isAuthenticated() {
  return !!getToken()
} 