import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '@/services/auth'
import {
  AuthContext,
  type AuthContextValue,
} from '@/contexts/authContextValue'
import type { User } from '@/types/api'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshUser = useCallback(async () => {
    const token = authService.getStoredToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const profile = await authService.getMe()
      setUser(profile)
    } catch {
      authService.clearStoredToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(
    async (username: string, password: string): Promise<User> => {
      await authService.login(username, password)
      const profile = await authService.getMe()
      setUser(profile)
      return profile
    },
    []
  )

  const logout = useCallback(() => {
    authService.logout()
    // komputer lab dipakai bergantian: riwayat chat tidak boleh terlihat oleh pengguna berikutnya
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith('k3guard-chat-'))
      .forEach((k) => sessionStorage.removeItem(k))
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
