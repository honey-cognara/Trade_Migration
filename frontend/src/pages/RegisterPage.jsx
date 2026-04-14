import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './SharedFlow.css'
import { register } from '../services/api'

const ROLE_LABELS = {
  candidate: 'Skilled Worker',
  employer: 'Employer / Hiring Company',
  training_provider: 'Training Provider',
}

/* ── Decorative blobs + accents ────────────────────────────── */
function Blobs() {
  return (
    <>
      <div className="sf-blob sf-blob-tr" />
      <div className="sf-blob sf-blob-bl" />
      <div className="sf-blob sf-blob-tl" />
      <div className="sf-ring" style={{ width: 70, height: 70, top: '15%', left: '5%', opacity: 0.3 }} />
      <div className="sf-ring" style={{ width: 38, height: 38, top: '28%', left: '2%', opacity: 0.2 }} />
      <div className="sf-ring" style={{ width: 55, height: 55, bottom: '18%', right: '5%', opacity: 0.28 }} />
      <div className="sf-dot-o" style={{ top: '20%', left: '12%' }} />
      <div className="sf-dot-o" style={{ top: '35%', left: '8%' }} />
      <div className="sf-dot-o" style={{ bottom: '25%', right: '10%' }} />
    </>
  )
}

/* ── Left illustration — woman with laptop ──────────────────── */
function IllusLeft() {
  return (
    <svg viewBox="0 0 160 200" width="150" height="190" fill="none">
      {/* chair */}
      <rect x="52" y="140" width="56" height="8" rx="3" fill="#a0c890" />
      <rect x="70" y="148" width="6" height="30" rx="2" fill="#a0c890" />
      <rect x="86" y="148" width="6" height="30" rx="2" fill="#a0c890" />
      <rect x="58" y="176" width="44" height="6" rx="2" fill="#a0c890" />
      {/* desk */}
      <rect x="10" y="132" width="140" height="10" rx="4" fill="#c8e6c0" />
      <rect x="20" y="142" width="6" height="40" rx="2" fill="#b0d8a0" />
      <rect x="134" y="142" width="6" height="40" rx="2" fill="#b0d8a0" />
      {/* laptop */}
      <rect x="55" y="98" width="50" height="36" rx="3" fill="#5a8a4a" />
      <rect x="60" y="103" width="40" height="27" rx="2" fill="#7aad6a" opacity="0.6" />
      <rect x="48" y="132" width="64" height="4" rx="2" fill="#3a5a3a" />
      {/* screen lines */}
      <rect x="66" y="110" width="22" height="3" rx="1.5" fill="#c8e6c0" opacity="0.8" />
      <rect x="66" y="116" width="16" height="2.5" rx="1.5" fill="#c8e6c0" opacity="0.6" />
      <rect x="66" y="121" width="19" height="2.5" rx="1.5" fill="#c8e6c0" opacity="0.6" />
      {/* person body */}
      <path d="M54 100 Q54 80 80 80 Q106 80 106 100 L108 115 L52 115 Z" fill="#e87b3a" />
      {/* head */}
      <circle cx="80" cy="62" r="20" fill="#f5d0a9" />
      {/* hair */}
      <ellipse cx="80" cy="46" rx="18" ry="8" fill="#4a3020" />
      <ellipse cx="65" cy="62" rx="5" ry="10" fill="#4a3020" />
      <ellipse cx="95" cy="62" rx="5" ry="10" fill="#4a3020" />
      {/* face */}
      <circle cx="74" cy="62" r="2" fill="#6a4020" />
      <circle cx="86" cy="62" r="2" fill="#6a4020" />
      <path d="M75 70 Q80 74 85 70" stroke="#c07040" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* arms */}
      <path d="M54 100 Q42 110 48 125" stroke="#e87b3a" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M106 100 Q118 110 112 125" stroke="#e87b3a" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* orange accent circle top-right */}
      <circle cx="135" cy="25" r="18" fill="none" stroke="#e87b3a" strokeWidth="2.5" opacity="0.4" />
      <circle cx="135" cy="25" r="8" fill="none" stroke="#e87b3a" strokeWidth="2" opacity="0.25" />
    </svg>
  )
}

/* ── Right illustration — man at standing desk ──────────────── */
function IllusRight() {
  return (
    <svg viewBox="0 0 160 200" width="150" height="190" fill="none">
      {/* big dashed circle background */}
      <circle cx="80" cy="105" r="68" fill="none" stroke="#c8e6c0" strokeWidth="2" strokeDasharray="6 5" opacity="0.7" />
      {/* person */}
      <circle cx="80" cy="55" r="20" fill="#f5d0a9" />
      {/* hair */}
      <ellipse cx="80" cy="40" rx="17" ry="7" fill="#3a2a18" />
      {/* face */}
      <circle cx="74" cy="56" r="2" fill="#6a4020" />
      <circle cx="86" cy="56" r="2" fill="#6a4020" />
      <path d="M75 63 Q80 67 85 63" stroke="#c07040" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* body */}
      <path d="M56 90 Q56 74 80 74 Q104 74 104 90 L106 108 L54 108 Z" fill="#5a8a4a" />
      {/* clipboard */}
      <rect x="92" y="78" width="32" height="42" rx="3" fill="#c8e6c0" />
      <rect x="96" y="84" width="24" height="3" rx="1.5" fill="#5a8a4a" opacity="0.7" />
      <rect x="96" y="90" width="18" height="2.5" rx="1.5" fill="#5a8a4a" opacity="0.5" />
      <rect x="96" y="96" width="20" height="2.5" rx="1.5" fill="#5a8a4a" opacity="0.5" />
      <rect x="96" y="102" width="14" height="2.5" rx="1.5" fill="#5a8a4a" opacity="0.5" />
      <rect x="100" y="74" width="16" height="8" rx="2" fill="#7aad6a" />
      {/* arm holding clipboard */}
      <path d="M104 90 Q115 88 120 82" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* legs */}
      <rect x="64" y="108" width="14" height="40" rx="4" fill="#3a5a3a" />
      <rect x="82" y="108" width="14" height="40" rx="4" fill="#3a5a3a" />
      {/* shoes */}
      <ellipse cx="71" cy="150" rx="10" ry="5" fill="#2a3a2a" />
      <ellipse cx="89" cy="150" rx="10" ry="5" fill="#2a3a2a" />
      {/* orange star badge */}
      <circle cx="30" cy="148" r="14" fill="#e87b3a" />
      <text x="30" y="153" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">★</text>
      {/* green check */}
      <circle cx="130" cy="155" r="12" fill="#7aad6a" />
      <path d="M124 155 L129 160 L136 150" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const defaultRole = params.get('role') || 'candidate'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    terms: false,
  })
  const [showPw, setShowPw]   = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  function set(field, val) {
    setForm((p) => ({ ...p, [field]: val }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required.'
    if (!form.email) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'Min 8 characters.'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must include an uppercase letter.'
    else if (!/\d/.test(form.password)) e.password = 'Must include a number.'
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.'
    if (!form.terms) e.terms = 'You must agree to the terms.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiError('')
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role })
      navigate('/verify-otp', { state: { email: form.email, role: form.role } })
    } catch (err) {
      setApiError(err.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sf-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <Blobs />

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.55rem', zIndex: 2 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#5a8a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>T</div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#2a3a2a' }}>Tradie</span>
      </div>

      {/* ── 3-column layout ──────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '160px 1fr 160px', gap: '2rem', alignItems: 'center', width: '100%', maxWidth: 820 }}>

        {/* Left illustration */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <IllusLeft />
        </div>

        {/* Center card */}
        <div className="sf-card">
          <h2 className="sf-card-title">Join as a Professional</h2>
          <p className="sf-card-sub">Create your account to get started on the Tradie Migration platform.</p>

          {apiError && <div className="sf-alert sf-alert-err">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Role */}
            <div className="sf-field">
              <label>I am signing up as</label>
              <select className="sf-input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {/* Full Name */}
            <div className="sf-field">
              <label>Full Name</label>
              <input className={`sf-input${errors.full_name ? ' sf-input-err' : ''}`} type="text"
                placeholder="Your full name" value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)} />
              {errors.full_name && <span className="sf-err">{errors.full_name}</span>}
            </div>

            {/* Email */}
            <div className="sf-field">
              <label>Email Address</label>
              <input className={`sf-input${errors.email ? ' sf-input-err' : ''}`} type="email"
                placeholder="you@example.com" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
              {errors.email && <span className="sf-err">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="sf-field">
              <label>Password</label>
              <div className="sf-pw-wrap">
                <input className={`sf-input${errors.password ? ' sf-input-err' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password} onChange={(e) => set('password', e.target.value)} />
                <button type="button" className="sf-pw-eye" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <span className="sf-err">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="sf-field">
              <label>Confirm Password</label>
              <div className="sf-pw-wrap">
                <input className={`sf-input${errors.confirmPassword ? ' sf-input-err' : ''}`}
                  type={showCpw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
                <button type="button" className="sf-pw-eye" onClick={() => setShowCpw((v) => !v)}>
                  {showCpw ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmPassword && <span className="sf-err">{errors.confirmPassword}</span>}
            </div>

            {/* Terms */}
            <label className="sf-check">
              <input type="checkbox" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} />
              I agree to the{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#5a8a4a' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#5a8a4a' }}>Privacy Policy</a>
            </label>
            {errors.terms && <span className="sf-err" style={{ marginTop: '-0.5rem', marginBottom: '0.75rem', display: 'block' }}>{errors.terms}</span>}

            <button type="submit" className="sf-btn" disabled={loading}>
              {loading ? <><span className="sf-spinner" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="sf-or">or</div>

          {/* SSO */}
          <div className="sf-sso">
            <button type="button" className="sf-sso-btn">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" className="sf-sso-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2" fill="#0A66C2"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="sf-link-row">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>

        {/* Right illustration */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <IllusRight />
        </div>
      </div>
    </div>
  )
}
