import { useState } from 'react'

export function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tradie',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!form.name) {
      nextErrors.name = 'Full name is required.'
    }

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

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      // Replace with real sign-up request when backend is ready
      // eslint-disable-next-line no-console
      console.log('Signup form submitted', form)
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
                    <option value="tradie">An overseas electrician / tradie</option>
                    <option value="employer">An Australian employer</option>
                    <option value="provider">A training provider</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="tc-btn tc-btn-primary">
                Create account
              </button>
            </form>
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

