import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { UserRole } from '@/types/api'

interface ProtectedRouteProps {
  allowedRole?: UserRole
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRole,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <LoadingSpinner size="lg" label="Memverifikasi sesi Anda..." />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    const redirectPath =
      user.role === 'officer' ? '/dashboard/officer' : '/dashboard/student'
    return <Navigate to={redirectPath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
