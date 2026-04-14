import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './SharedFlow.css'
import { verifyOtp, resendOtp, saveToken } from '../services/api'

const ROLE_REDIRECT = {
  candidate: '/setup/worker/1',
  employer: '/setup/company/1',
  training_provider: '/setup/trainer/1',
}

/* ── Decorative blobs + accents ──────────────────────────────── */
function Blobs() {
  return (
    <>
      <div className="sf-blob sf-blob-tr" />
      <div className="sf-blob sf-blob-bl" />
      <div className="sf-blob sf-blob-tl" />
      {/* green hollow rings (OTP page uses green) */}
      <div className="sf-ring-g" style={{ width: 90, height: 90, top: '14%', left: '6%', opacity: 0.35 }} />
      <div className="sf-ring-g" style={{ width: 48, height: 48, top: '28%', left: '3%', opacity: 0.22 }} />
      <div className="sf-ring-g" style={{ width: 65, height: 65, bottom: '16%', left: '8%', opacity: 0.28 }} />
      {/* orange accent */}
      <div className="sf-ring" style={{ width: 42, height: 42, bottom: '22%', right: '5%', opacity: 0.3 }} />
      <div className="sf-dot-o" style={{ top: '22%', left: '14%' }} />
      <div className="sf-dot-o" style={{ top: '40%', left: '10%' }} />
      <div className="sf-dot-o" style={{ bottom: '28%', right: '12%' }} />
    </>
  )
}

/* ── Right illustration — woman with envelope/phone ─────────── */
function IllusRight() {
  return (
    <svg viewBox="0 0 160 220" width="150" height="210" fill="none">
      {/* large dashed circle background */}
      <circle cx="80" cy="115" r="72" fill="none" stroke="#c8e6c0" strokeWidth="2.5" strokeDasharray="7 5" opacity="0.65" />
      <circle cx="80" cy="115" r="55" fill="none" stroke="#d4edd4" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4" />

      {/* phone */}
      <rect x="58" y="118" width="44" height="72" rx="6" fill="#5a8a4a" />
      <rect x="62" y="124" width="36" height="54" rx="3" fill="#c8f0c0" />
      <circle cx="80" cy="182" r="4" fill="#3a5a3a" />
      {/* envelope on screen */}
      <rect x="66" y="133" width="28" height="20" rx="2" fill="#7aad6a" />
      <path d="M66 133 L80 143 L94 133" stroke="#fff" strokeWidth="1.5" fill="none" />
      {/* notification dot */}
      <circle cx="94" cy="122" r="7" fill="#e87b3a" />
      <text x="94" y="127" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">!</text>

      {/* person body */}
      <path d="M44 115 Q44 96 80 96 Q116 96 116 115 L118 130 L42 130 Z" fill="#e87b3a" />
      {/* head */}
      <circle cx="80" cy="74" r="22" fill="#f5d0a9" />
      {/* hair */}
      <ellipse cx="80" cy="56" rx="20" ry="10" fill="#3a2a18" />
      <ellipse cx="62" cy="72" rx="6" ry="12" fill="#3a2a18" />
      <ellipse cx="98" cy="72" rx="6" ry="12" fill="#3a2a18" />
      {/* bun */}
      <circle cx="80" cy="50" r="7" fill="#3a2a18" />
      {/* face */}
      <circle cx="74" cy="74" r="2.5" fill="#6a4020" />
      <circle cx="86" cy="74" r="2.5" fill="#6a4020" />
      <path d="M75 82 Q80 87 85 82" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* arms */}
      <path d="M44 115 Q32 120 35 138" stroke="#e87b3a" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M116 115 Q128 115 125 130" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* small star */}
      <circle cx="128" cy="80" r="10" fill="#e87b3a" opacity="0.7" />
      <text x="128" y="85" textAnchor="middle" fill="white" fontSize="10">★</text>

      {/* green dots scattered */}
      <circle cx="32" cy="95" r="4" fill="#7aad6a" opacity="0.6" />
      <circle cx="25" cy="108" r="3" fill="#7aad6a" opacity="0.4" />
      <circle cx="136" cy="158" r="4" fill="#7aad6a" opacity="0.5" />
    </svg>
  )
}

export function OtpPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const email     = location.state?.email || ''
  const role      = location.state?.role  || 'candidate'

  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleVerify(e) {
    e.preventDefault()
    if (!code.trim()) { setError('Please enter the code.'); return }
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
      setError(err.detail || 'Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : 'your email'

  return (
    <div className="sf-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <Blobs />

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.55rem', zIndex: 2 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#5a8a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>T</div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#2a3a2a' }}>Tradie</span>
      </div>

      {/* ── 2-column layout ──────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 180px', gap: '2.5rem', alignItems: 'center', width: '100%', maxWidth: 680 }}>

        {/* Left — OTP card */}
        <div className="sf-card" style={{ maxWidth: 440 }}>
          {/* envelope icon */}
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#5a8a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M2 7l10 7 10-7"/>
            </svg>
          </div>

          <h2 className="sf-card-title">Verify Email</h2>
          <p className="sf-card-sub">
            We sent a 6-digit code to <strong style={{ color: '#3a5a3a' }}>{maskedEmail}</strong>.<br />
            Enter it below to activate your account.
          </p>

          {error   && <div className="sf-alert sf-alert-err">{error}</div>}
          {success && <div className="sf-alert sf-alert-ok">{success}</div>}

          <form onSubmit={handleVerify} noValidate>
            <div className="sf-field">
              <label>Enter Code</label>
              <input
                className="sf-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                style={{ fontSize: '1.05rem', letterSpacing: '0.18em', textAlign: 'center' }}
              />
            </div>

            <button type="submit" className="sf-btn" disabled={loading}>
              {loading ? <><span className="sf-spinner" /> Verifying…</> : 'Verify & Continue'}
            </button>
          </form>

          <button className="sf-ghost-link" onClick={handleResend} disabled={resending || countdown > 0}>
            {countdown > 0
              ? `Resend code in ${countdown}s`
              : resending ? 'Sending…' : 'Resend code'}
          </button>

          <div className="sf-link-row" style={{ marginTop: '0.5rem' }}>
            <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#5a8a4a', fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem', padding: 0 }}>
              ← Change email address
            </button>
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
