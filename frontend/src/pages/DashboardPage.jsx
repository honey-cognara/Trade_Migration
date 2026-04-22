import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyDashboard, getMe, getToken, clearToken } from '../services/api'

const ROLE_LABELS = {
  candidate:         'Candidate',
  employer:          'Employer',
  training_provider: 'Training Provider',
  admin:             'Admin',
  migration_agent:   'Migration Agent',
  company_admin:     'Company Admin',
}

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
}

export function DashboardPage() {
  const navigate  = useNavigate()
  const [user, setUser]       = useState(null)
  const [dash, setDash]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) { navigate('/login', { replace: true }); return }

    async function load() {
      try {
        const [meData, dashData] = await Promise.all([
          getMe(token),
          getMyDashboard(token),
        ])
        setUser(meData)
        setDash(dashData)
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          clearToken()
          navigate('/login', { replace: true })
        } else {
          setError(err.detail || 'Failed to load dashboard.')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#6a7380' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
        <p>Loading your dashboard…</p>
      </div>
    </div>
  )

  const role = user?.role || 'candidate'

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      {/* ── Nav ── */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e8ecf0',
        padding: '0 2rem', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: '#5379f4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '0.95rem',
          }}>T</div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>Tradie Migration</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            background: '#eef2ff', color: '#5379f4', borderRadius: 20,
            padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600,
          }}>{ROLE_LABELS[role] || role}</span>
          <span style={{ fontSize: '0.85rem', color: '#6a7380' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid #e0e0e0', borderRadius: 8,
            padding: '5px 14px', fontSize: '0.82rem', cursor: 'pointer', color: '#6a7380',
          }}>Sign out</button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
            borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem',
          }}>{error}</div>
        )}

        {/* Welcome */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '0.35rem' }}>
          {dash?.welcome || `Welcome, ${user?.email}`}
        </h1>
        <p style={{ color: '#6a7380', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Here's an overview of your account activity.
        </p>

        {/* ── Stats from backend ── */}
        {dash && <DashStats dash={dash} role={role} />}

        {/* ── Quick actions ── */}
        {dash?.quick_actions?.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#343434', marginBottom: '0.75rem' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {dash.quick_actions.map((a, i) => (
                <div key={i} style={{
                  background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10,
                  padding: '0.6rem 1rem', fontSize: '0.82rem', color: '#5379f4', fontWeight: 500,
                }}>
                  {a.label}
                  <span style={{ color: '#bbb', marginLeft: 8, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {a.endpoint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Role-specific cards ── */}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#343434', marginBottom: '0.75rem' }}>
          Your tools
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {role === 'candidate' && <>
            <DashCard icon="👤" title="My Profile" desc="View and edit your profile"
              to={ROLE_REDIRECT.candidate} />
            <DashCard icon="📄" title="Documents" desc="Upload your trade documents" />
            <DashCard icon="📬" title="Expressions of Interest" desc="See who wants to hire you" />
            <DashCard icon="🎓" title="Training" desc="Recommended courses for you" />
          </>}
          {role === 'employer' && <>
            <DashCard icon="🏢" title="Company Profile" desc="Manage your employer profile"
              to={ROLE_REDIRECT.employer} />
            <DashCard icon="🔍" title="Browse Candidates" desc="Find skilled tradespeople" />
            <DashCard icon="📬" title="Expressions of Interest" desc="Track your EOI submissions" />
          </>}
          {role === 'training_provider' && <>
            <DashCard icon="🏫" title="Provider Profile" desc="Manage your organisation"
              to={ROLE_REDIRECT.training_provider} />
            <DashCard icon="📚" title="Courses" desc="Manage your course catalogue" />
            <DashCard icon="👥" title="Candidates" desc="Enrolled trainees" />
          </>}
          {['admin', 'migration_agent', 'company_admin'].includes(role) && <>
            <DashCard icon="👥" title="Users" desc="Manage platform users" />
            <DashCard icon="📊" title="Visa Cases" desc="Active case queue" />
            <DashCard icon="🏢" title="Employers" desc="Pending approvals" />
            <DashCard icon="⚙️" title="Settings" desc="System configuration" />
          </>}
        </div>

        {/* API info */}
        <div style={{
          marginTop: '2.5rem', padding: '0.9rem 1.1rem',
          background: '#fff', borderRadius: 10, border: '1px solid #e8ecf0',
          fontSize: '0.8rem', color: '#9ba3af',
        }}>
          Connected to backend:{' '}
          <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
            {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
          </code>
        </div>
      </div>
    </div>
  )
}

/* ── Stats grid — renders numbers from /dashboard/my response ── */
function DashStats({ dash, role }) {
  const stats = []

  if (role === 'candidate') {
    const d = dash.documents || {}
    const e = dash.expressions_of_interest || {}
    const c = dash.employer_access || {}
    stats.push(
      { label: 'Documents uploaded', value: d.uploaded ?? 0 },
      { label: 'EOIs received', value: e.received ?? 0 },
      { label: 'Unread EOIs', value: e.unread ?? 0 },
      { label: 'Employer consents', value: c.consents_given ?? 0 },
    )
  } else if (role === 'employer') {
    const a = dash.activity || {}
    const co = dash.company || {}
    stats.push(
      { label: 'EOIs sent', value: a.eois_sent ?? 0 },
      { label: 'Company verified', value: co.approved ? '✓ Yes' : '⏳ Pending' },
    )
  } else if (role === 'training_provider') {
    const p = dash.platform || {}
    stats.push(
      { label: 'Total providers', value: p.total_providers ?? 0 },
      { label: 'Total courses', value: p.total_courses ?? 0 },
      { label: 'Recommendations', value: p.total_recommendations ?? 0 },
    )
  } else if (['admin', 'migration_agent', 'company_admin'].includes(role)) {
    const o = dash.overview || {}
    stats.push(
      { label: 'Total candidates', value: o.total_candidates ?? 0 },
      { label: 'Total employers', value: o.total_employers ?? 0 },
      { label: 'Active visa cases', value: o.total_visa_applications ?? 0 },
      { label: 'Pending approvals', value: o.pending_employers ?? 0 },
    )
  }

  if (!stats.length) return null

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '1rem', marginBottom: '2rem',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12,
          padding: '1rem 1.2rem',
        }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#5379f4', marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6a7380' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Card ── */
function DashCard({ icon, title, desc, to }) {
  const inner = (
    <div style={{
      background: '#fff', border: '1px solid #e8ecf0', borderRadius: 12,
      padding: '1.1rem', cursor: to ? 'pointer' : 'default',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { if (to) { e.currentTarget.style.borderColor = '#5379f4'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(83,121,244,0.1)' } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8ecf0'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: '#9ba3af' }}>{desc}</div>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}