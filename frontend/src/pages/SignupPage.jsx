import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleDashboard } from '../components/ProtectedRoute'

export function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.name) nextErrors.name = 'Full name is required.'
    if (!form.email) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const role = await register(form.name, form.email, form.password, form.role)
      navigate(roleDashboard(role), { replace: true })
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Account</p>
          <h1>Create your Mazdoor Migration profile</h1>
          <p>
            Set up a login so you can save your details, track your pathway and
            connect with Australian employers and training providers.
          </p>
        </div>

        <div className="tc-grid-2">
          <div className="tc-card">
            <h2>Sign up</h2>

            {serverError && (
              <div className="tc-alert tc-alert-error" style={{ marginBottom: '1rem', color: 'red' }}>
                {serverError}
              </div>
            )}

            <form className="tc-form" onSubmit={handleSubmit} noValidate>
              <div className="tc-form-row">
                <label>
                  Full name
                  <input
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name ? (
                    <p className="tc-form-error">{errors.name}</p>
                  ) : null}
                </label>
              </div>
              <div className="tc-form-row">
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email ? (
                    <p className="tc-form-error">{errors.email}</p>
                  ) : null}
                </label>
              </div>
              <div className="tc-form-row tc-form-row-inline">
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={handleChange}
                  />
                  {errors.password ? (
                    <p className="tc-form-error">{errors.password}</p>
                  ) : null}
                </label>
                <label>
                  Confirm password
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword ? (
                    <p className="tc-form-error">{errors.confirmPassword}</p>
                  ) : null}
                </label>
              </div>
              <div className="tc-form-row">
                <label>
                  I am signing up as
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="candidate">An overseas electrician / tradie</option>
                    <option value="employer">An Australian employer</option>
                    <option value="training_provider">A training provider</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className="tc-btn tc-btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p style={{ marginTop: '1rem' }}>
              Already have an account?{' '}
              <Link to="/login" className="tc-link">
                Log in
              </Link>
            </p>
          </div>

          <div className="tc-card tc-card-ghost">
            <h2>What you can save</h2>
            <ul>
              <li>Contact details, trade background and country of qualification.</li>
              <li>Your OTSR and licensing progress over time.</li>
              <li>Employers or providers you have connected with.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
