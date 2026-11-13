import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'k3guard_access_token'
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan saat menghubungi server.'
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => d?.msg || String(d)).join(', ')
    }
    if (!error.response) {
      return 'Tidak dapat terhubung ke server backend. Pastikan server berjalan.'
    }
  }
  return fallback
}
