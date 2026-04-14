import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { login, saveToken } from '../services/api'

const ROLE_REDIRECT = {
  candidate: '/setup/worker/1',
  employer: '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin: '/dashboard',
  migration_agent: '/dashboard',
  company_admin: '/dashboard',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, val) {
    setForm((p) => ({ ...p, [field]: val }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.email) errs.email = 'Email is required.'
    if (!form.password) errs.password = 'Password is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true); setApiError('')
    try {
      const data = await login({ email: form.email, password: form.password })
      saveToken(data.access_token)
      const role = data.role || 'candidate'
      navigate(ROLE_REDIRECT[role] || '/', { replace: true })
    } catch (err) {
      if (err.status === 403) {
        setApiError('Your email is not verified. Please check your inbox.')
      } else {
        setApiError(err.detail || 'Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <Logo />
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your Tradie Migration account</p>

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

        <div className="divider">or sign in with email</div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Email Address</label>
            <input className={`form-input${errors.email ? ' error' : ''}`} type="email"
              placeholder="you@example.com" value={form.email}
              onChange={(e) => set('email', e.target.value)} />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input className={`form-input${errors.password ? ' error' : ''}`} type="password"
              placeholder="Your password" value={form.password}
              onChange={(e) => set('password', e.target.value)} />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.83rem', color: 'var(--color-primary)' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-link-row">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}
