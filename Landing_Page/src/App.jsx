import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, roleDashboard } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { OtsrPage } from './pages/OtsrPage'
import { ForTradiesPage } from './pages/ForTradiesPage'
import { ForEmployersPage } from './pages/ForEmployersPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'

// Role-specific dashboards
import { CandidateDashboard } from './pages/CandidateDashboard'
import { EmployerDashboard } from './pages/EmployerDashboard'
import { ProviderDashboard } from './pages/ProviderDashboard'
import { AdminDashboard } from './pages/AdminDashboard'

/**
 * Redirects already-logged-in users away from /login and /signup
 * to their own dashboard.
 */
function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={roleDashboard(user.role)} replace />
  return children
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* ── Public routes ─────────────────────────────────────── */}
        <Route path="/"          element={<HomePage />} />
        <Route path="/otsr"      element={<OtsrPage />} />
        <Route path="/tradies"   element={<ForTradiesPage />} />
        <Route path="/employers" element={<ForEmployersPage />} />
        <Route path="/about"     element={<AboutPage />} />
        <Route path="/contact"   element={<ContactPage />} />

        {/* ── Auth routes (redirect away if already logged in) ───── */}
        <Route path="/login"  element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />

        {/* ── Protected dashboards ───────────────────────────────── */}
        {/* candidate role */}
        <Route
          path="/dashboard/candidate"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        {/* employer role */}
        <Route
          path="/dashboard/employer"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />

        {/* training_provider role */}
        <Route
          path="/dashboard/provider"
          element={
            <ProtectedRoute allowedRoles={['training_provider']}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        {/* admin / company_admin / migration_agent all share the admin dashboard */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'company_admin', 'migration_agent']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* /dashboard → redirect to the correct role dashboard (or login) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* ── Fallback ──────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

/** Redirects /dashboard → the correct role-specific dashboard */
function DashboardRedirect() {
  const { user } = useAuth()
  return <Navigate to={roleDashboard(user?.role)} replace />
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
