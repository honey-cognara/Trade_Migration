import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { OtpInput } from '../components/OtpInput'
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/api'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email) { setError('Email is required.'); return }
    setLoading(true); setError('')
    try {
      await forgotPassword({ email })
      setStep(2)
    } catch {
      // Always show success to prevent enumeration
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const data = await verifyResetOtp({ email, otp_code: otp })
      setResetToken(data.reset_token)
      setStep(3)
    } catch (err) {
      setError(err.detail || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    if (!newPassword) { setError('Password is required.'); return }
    if (newPassword.length < 8) { setError('Min 8 characters.'); return }
    if (!/[A-Z]/.test(newPassword)) { setError('Must include an uppercase letter.'); return }
    if (!/\d/.test(newPassword)) { setError('Must include a number.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await resetPassword({ reset_token: resetToken, new_password: newPassword })
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } })
    } catch (err) {
      setError(err.detail || 'Failed to reset password. Please start over.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <Logo />

        {step === 1 && (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send a reset code.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleEmailSubmit} noValidate>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="spinner" /> Sending…</> : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title" style={{ textAlign: 'center' }}>Check your email</h1>
            <p className="auth-subtitle" style={{ textAlign: 'center' }}>
              We sent a 6-digit reset code to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>
            </p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleOtpSubmit}>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setError('') }} />
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length < 6}>
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify Code'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Choose a strong password for your account.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleResetSubmit} noValidate>
              <div className="form-group">
                <label>New Password</label>
                <input className="form-input" type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError('') }} />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input className="form-input" type="password" placeholder="Re-enter password"
                  value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError('') }} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="spinner" /> Updating…</> : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <div className="auth-link-row">
          <Link to="/login">← Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
