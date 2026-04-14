import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { getMe, clearToken, getToken } from '../services/api'

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    getMe(token)
      .then((u) => setUser(u))
      .catch(() => { clearToken(); navigate('/login') })
      .finally(() => setLoading(false))
  }, [navigate])

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  const ROLE_LABELS = {
    candidate: 'Worker Dashboard',
    employer: 'Employer Dashboard',
    training_provider: 'Instructor Dashboard',
    admin: 'Admin Dashboard',
    migration_agent: 'Migration Agent Dashboard',
    company_admin: 'Company Admin Dashboard',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '1.5rem' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem'
      }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {ROLE_LABELS[user?.role] || 'Dashboard'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Welcome back, <strong style={{ color: 'var(--text-secondary)' }}>{user?.email}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {user?.role === 'candidate' && (
            <>
              <DashCard icon="👤" title="My Profile" desc="View and update your worker profile" to="/setup/worker/1" />
              <DashCard icon="📋" title="Applications" desc="Track your visa and job applications" />
              <DashCard icon="💼" title="Expressions of Interest" desc="Employers who contacted you" />
            </>
          )}
          {user?.role === 'employer' && (
            <>
              <DashCard icon="🏢" title="Company Profile" desc="Manage your employer details" to="/setup/company/1" />
              <DashCard icon="🔍" title="Search Candidates" desc="Find skilled trade workers" />
              <DashCard icon="📨" title="Sent EOIs" desc="Track your expressions of interest" />
            </>
          )}
          {user?.role === 'training_provider' && (
            <>
              <DashCard icon="🎓" title="Provider Profile" desc="Manage your training organisation" to="/setup/trainer/1" />
              <DashCard icon="📚" title="Courses" desc="Manage your course catalogue" />
              <DashCard icon="👥" title="Students" desc="Candidates enrolled in your courses" />
            </>
          )}
          {['admin', 'migration_agent', 'company_admin'].includes(user?.role) && (
            <>
              <DashCard icon="👥" title="Users" desc="Manage platform users" />
              <DashCard icon="📊" title="Reports" desc="Platform analytics and statistics" />
              <DashCard icon="⚙️" title="Settings" desc="System configuration" />
            </>
          )}
        </div>

        <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            <strong style={{ color: 'var(--color-primary)' }}>API:</strong> This dashboard connects to the FastAPI backend at{' '}
            <code style={{ background: 'var(--bg-base)', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.8rem' }}>
              {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}

function DashCard({ icon, title, desc, to }) {
  const inner = (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '1.25rem', cursor: to ? 'pointer' : 'default',
      transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}
    onMouseEnter={(e) => { if (to) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}>
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  )

  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}
