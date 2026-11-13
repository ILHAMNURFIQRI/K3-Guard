import { api, TOKEN_STORAGE_KEY } from './api'
import type { LoginRequest, TokenResponse, User } from '@/types/api'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function login(
  username: string,
  password: string
): Promise<TokenResponse> {
  const payload: LoginRequest = { username, password }
  const { data } = await api.post<TokenResponse>('/auth/login', payload)
  setStoredToken(data.access_token)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export function logout(): void {
  clearStoredToken()
}
