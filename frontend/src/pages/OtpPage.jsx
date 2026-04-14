import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { OtpInput } from '../components/OtpInput'
import { verifyOtp, resendOtp, saveToken } from '../services/api'

const ROLE_REDIRECT = {
  candidate: '/setup/worker/1',
  employer: '/setup/company/1',
  training_provider: '/setup/trainer/1',
}

export function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const role = location.state?.role || 'candidate'

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleVerify(e) {
    e.preventDefault()
    if (code.length < 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const data = await verifyOtp({ email, otp_code: code })
      if (data.access_token) saveToken(data.access_token)
      navigate(ROLE_REDIRECT[role] || '/', { replace: true })
    } catch (err) {
      setError(err.detail || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true); setError(''); setSuccess('')
    try {
      await resendOtp({ email })
      setSuccess('A new code has been sent to your email.')
      setCountdown(60)
    } catch (err) {
      setError(err.detail || 'Could not resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : 'your email'

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <Logo />
        </div>

        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(56,189,248,0.12)', border: '2px solid var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem', fontSize: '1.75rem'
        }}>
          ✉️
        </div>

        <h1 className="auth-title" style={{ textAlign: 'center' }}>Verify your email</h1>
        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
          We sent a 6-digit code to <br />
          <strong style={{ color: 'var(--text-secondary)' }}>{maskedEmail}</strong>
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleVerify}>
          <OtpInput value={code} onChange={setCode} length={6} />

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || code.length < 6}>
            {loading ? <><span className="spinner" /> Verifying…</> : 'Verify Email'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Didn't receive the code?{' '}
          {countdown > 0 ? (
            <span style={{ color: 'var(--text-disabled)' }}>Resend in {countdown}s</span>
          ) : (
            <button onClick={handleResend} disabled={resending}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: 0 }}>
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="auth-link-row">
          <button onClick={() => navigate('/register')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Change email address
          </button>
        </div>
      </div>
    </div>
  )
}
