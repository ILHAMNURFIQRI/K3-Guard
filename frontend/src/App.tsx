import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/officer/DashboardPage'
import { EventsPage } from '@/pages/officer/EventsPage'
import { EventDetailPage } from '@/pages/officer/EventDetailPage'
import { SOPManagementPage } from '@/pages/officer/SOPManagementPage'
import { UnansweredPage } from '@/pages/officer/UnansweredPage'
import { SettingsPage } from '@/pages/officer/SettingsPage'
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage'
import { SOPViewPage } from '@/pages/student/SOPViewPage'
import { EquipmentInfoPage } from '@/pages/student/EquipmentInfoPage'
import { ContactOfficerPage } from '@/pages/student/ContactOfficerPage'
import { ChatbotPage } from '@/pages/shared/ChatbotPage'

const LandingPage = lazy(() =>
  import('@/pages/public/LandingPage').then((m) => ({
    default: m.LandingPage,
  }))
)

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen bg-off-white flex items-center justify-center">
                  <LoadingSpinner size="lg" label="Memuat halaman..." />
                </div>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Officer Protected Routes */}
                <Route
                  path="/dashboard/officer"
                  element={<ProtectedRoute allowedRole="officer" />}
                >
                  <Route element={<DashboardLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route
                      path="monitoring"
                      element={<Navigate to="/dashboard/officer" replace />}
                    />
                    <Route path="events" element={<EventsPage />} />
                    <Route path="events/:id" element={<EventDetailPage />} />
                    <Route
                      path="stats"
                      element={<Navigate to="/dashboard/officer?tab=stats" replace />}
                    />
                    <Route path="chatbot" element={<ChatbotPage />} />
                    <Route path="sop" element={<SOPManagementPage />} />
                    <Route path="unanswered" element={<UnansweredPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Student Protected Routes */}
                <Route
                  path="/dashboard/student"
                  element={<ProtectedRoute allowedRole="student" />}
                >
                  <Route element={<DashboardLayout />}>
                    <Route index element={<StudentDashboardPage />} />
                    <Route path="chatbot" element={<ChatbotPage />} />
                    <Route path="sop" element={<SOPViewPage />} />
                    <Route path="equipment" element={<EquipmentInfoPage />} />
                    <Route path="contact" element={<ContactOfficerPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}

export default App
