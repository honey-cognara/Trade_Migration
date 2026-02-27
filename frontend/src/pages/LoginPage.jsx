import { useState } from 'react'

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}

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

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      // Replace with real authentication request when backend is ready
      // eslint-disable-next-line no-console
      console.log('Login form submitted', form)
    }
  }

  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Account</p>
          <h1>Log in to Mazdoor Migration</h1>
          <p>Access your profile, pathway progress and employer connections.</p>
        </div>

        <div className="tc-grid-2">
          <div className="tc-card">
            <h2>Login</h2>
            <form className="tc-form" onSubmit={handleSubmit} noValidate>
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
              <div className="tc-form-row">
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
              </div>
              <button type="submit" className="tc-btn tc-btn-primary">
                Log in
              </button>
            </form>
          </div>
          <div className="tc-card tc-card-ghost">
            <h2>Why create an account?</h2>
            <ul>
              <li>Save your migration and licensing details in one place.</li>
              <li>Share a consistent profile with employers and training partners.</li>
              <li>Track where you are in the OTSR, training and licensing pathway.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

