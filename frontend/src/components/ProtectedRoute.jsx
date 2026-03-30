import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route so only authenticated users with the correct role can access it.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['candidate']}>
 *     <CandidateDashboard />
 *   </ProtectedRoute>
 *
 * If allowedRoles is omitted, any authenticated user is allowed in.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // While checking token validity, show a loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p>Loading…</p>
      </div>
    )
  }

  // Not logged in → send to /login, remembering the page they tried to visit
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role → send to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleDashboard(user.role)} replace />
  }

  return children
}

/**
 * Maps a backend role string to the correct dashboard path.
 * All backend roles are covered — unknown roles fall back to home.
 */
export function roleDashboard(role) {
  const map = {
    candidate:         '/dashboard/candidate',
    employer:          '/dashboard/employer',
    training_provider: '/dashboard/provider',
    admin:             '/dashboard/admin',
    company_admin:     '/dashboard/admin',
    migration_agent:   '/dashboard/admin',
  }
  return map[role] ?? '/'
}
