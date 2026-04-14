import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { register } from '../services/api'

const ROLE_LABELS = {
  candidate: 'Skilled Worker',
  employer: 'Employer / Hiring Company',
  training_provider: 'Training Provider',
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
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="auth-page">
      <div className="auth-box">
        <Logo />
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join the Tradie Migration platform</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <div className="sso-group">
          <button className="btn-sso" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
          <button className="btn-sso" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2" fill="#0A66C2"/></svg>
            LinkedIn
          </button>
        </div>

        <div className="divider">or sign up with email</div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>I am signing up as</label>
            <select className="form-input" value={form.role} onChange={(e) => set('role', e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input className={`form-input${errors.full_name ? ' error' : ''}`} type="text"
              placeholder="Your full name" value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)} />
            {errors.full_name && <p className="form-error">{errors.full_name}</p>}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input className={`form-input${errors.email ? ' error' : ''}`} type="email"
              placeholder="you@example.com" value={form.email}
              onChange={(e) => set('email', e.target.value)} />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Password</label>
              <input className={`form-input${errors.password ? ' error' : ''}`} type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password}
                onChange={(e) => set('password', e.target.value)} />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className={`form-input${errors.confirmPassword ? ' error' : ''}`} type="password"
                placeholder="Re-enter password" value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="form-check">
            <input type="checkbox" id="terms" checked={form.terms}
              onChange={(e) => set('terms', e.target.checked)} />
            <label htmlFor="terms">
              I agree to the <a href="#" style={{ color: 'var(--color-primary)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>
            </label>
          </div>
          {errors.terms && <p className="form-error">{errors.terms}</p>}

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-link-row">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
