import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8000'

export function CandidateDashboard() {
  const { user, token, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [eois, setEois] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${API}/candidates/profile`, { headers }).then((r) => r.json()),
      fetch(`${API}/candidates/eois`, { headers }).then((r) => r.json()),
    ])
      .then(([profileData, eoisData]) => {
        setProfile(Array.isArray(profileData) ? null : profileData)
        setEois(Array.isArray(eoisData) ? eoisData : [])
      })
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false))
  }, [token])

  const handlePublish = async () => {
    const res = await fetch(`${API}/candidates/profile/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setProfile((p) => ({ ...p, published: true }))
    else {
      const err = await res.json()
      alert(err.detail || 'Could not publish profile.')
    }
  }

  const handleUnpublish = async () => {
    const res = await fetch(`${API}/candidates/profile/unpublish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setProfile((p) => ({ ...p, published: false }))
  }

  if (loading) return <div className="tc-page"><p style={{ padding: '2rem' }}>Loading…</p></div>

  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Candidate Portal</p>
          <h1>Welcome, {user?.email}</h1>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Profile card */}
        <div className="tc-grid-2" style={{ marginBottom: '2rem' }}>
          <div className="tc-card">
            <h2>My Profile</h2>
            {profile ? (
              <>
                <p><strong>Name:</strong> {profile.full_name || '—'}</p>
                <p><strong>Trade:</strong> {profile.trade_category || '—'}</p>
                <p><strong>Experience:</strong> {profile.years_experience != null ? `${profile.years_experience} yrs` : '—'}</p>
                <p><strong>Location:</strong> {profile.country_of_residence || '—'}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: profile.published ? 'green' : 'orange' }}>
                    {profile.published ? 'Published — visible to employers' : 'Unpublished — hidden'}
                  </span>
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {profile.published ? (
                    <button className="tc-btn tc-btn-secondary" onClick={handleUnpublish}>
                      Unpublish Profile
                    </button>
                  ) : (
                    <button className="tc-btn tc-btn-primary" onClick={handlePublish}>
                      Publish Profile
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p>No profile found. Complete your profile to get discovered by employers.</p>
            )}
          </div>

          {/* EOI summary */}
          <div className="tc-card">
            <h2>Expressions of Interest</h2>
            {eois.length === 0 ? (
              <p>No employer interest yet. Publish your profile to start receiving EOIs.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {eois.slice(0, 5).map((eoi) => (
                  <li key={eoi.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
                    <strong>{eoi.job_title || 'No title'}</strong>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                      {new Date(eoi.created_at).toLocaleDateString()} &mdash;{' '}
                      <span style={{ color: eoi.status === 'unread' ? 'orange' : 'green' }}>
                        {eoi.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className="tc-btn tc-btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </section>
    </div>
  )
}
