import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp, resendOtp, saveToken } from '../services/api'
import illusVerifyEmail from '../assets/illus-verify-email.svg'

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

const font = "'Urbanist', sans-serif"

export function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email    = location.state?.email || ''

  const [code,          setCode]          = useState('')
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown,     setCountdown]     = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  async function handleSubmit(e) {
    e.preventDefault()
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const data = await verifyOtp({ email, otp_code: code })
      saveToken(data.access_token)
      navigate(ROLE_REDIRECT[data.role] || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.detail || 'Invalid or expired code. Please try again.')
    } finally { setLoading(false) }
  }

  async function handleResend() {
    setResendLoading(true); setError('')
    try {
      await resendOtp({ email })
      setCountdown(60)
    } catch { setError('Failed to resend code. Please try again.') }
    finally  { setResendLoading(false) }
  }

  return (
    <div style={{
      background: '#fbfbfb', minHeight: '100vh',
      position: 'relative', overflow: 'hidden', fontFamily: font,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center',
        pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 1440, flexShrink: 0 }}>
          <div style={{ position: 'absolute', left: -131, top: -255, width: 1700, height: 1495 }}>
            <img src={illusVerifyEmail} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative', zIndex: 2, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        padding: '2rem 0 2rem max(5%, calc(50% - 720px + 178px))',
      }}>
        <div style={{
          width: 551, maxWidth: '90vw',
          background: 'rgba(230,241,255,0.94)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          borderRadius: 16, padding: 32,
          display: 'flex', flexDirection: 'column', gap: 32,
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8, textAlign:'center' }}>
            <p style={{ fontFamily:font, fontSize:34, fontWeight:700, color:'#343434', margin:0, lineHeight:1.3 }}>
              Verify Email
            </p>
            <p style={{ fontFamily:font, fontSize:18, fontWeight:500, color:'#6a7380', margin:0, lineHeight:1.4 }}>
              We have sent a verification code to your inbox. Please enter it
              below to secure your account and continue.
            </p>
            {email && (
              <p style={{ fontFamily:font, fontSize:16, fontWeight:700, color:'#343434', margin:0 }}>
                {email}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {error && (
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
                borderRadius:8, padding:'0.55rem 0.8rem', fontSize:14, fontFamily:font }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <label style={{ fontFamily:font, fontSize:16, fontWeight:700, color:'#343434', lineHeight:1.3 }}>
                Code
              </label>
              <input
                type="text" inputMode="numeric" placeholder="Enter Code"
                maxLength={6} value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                style={{
                  height:56, padding:'16px 20px',
                  border:'1px solid #6a7380', borderRadius:12, background:'#fff',
                  fontFamily:font, fontSize:16, fontWeight:400, color:'#343434',
                  outline:'none', boxSizing:'border-box', width:'100%', lineHeight:1.3,
                }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
                onBlur={e  => { e.target.style.boxShadow = 'none' }}
              />
            </div>

            <button type="submit" disabled={loading}
              style={{
                width:'100%', height:53, background:'#5379f4', color:'#fff',
                border:'none', borderRadius:12,
                fontFamily:font, fontSize:16, fontWeight:600, lineHeight:1.3,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow:'0 4px 13.6px 0 #97b6fd', transition:'background 0.18s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
              <button type="button" onClick={handleResend}
                disabled={resendLoading || countdown > 0}
                style={{
                  background:'none', border:'none',
                  fontFamily:font, fontSize:16, fontWeight:600,
                  color:'#403c8b', textDecoration:'underline',
                  cursor: (resendLoading || countdown > 0) ? 'not-allowed' : 'pointer',
                  opacity: (resendLoading || countdown > 0) ? 0.5 : 1,
                  padding:0, lineHeight:1.3, transition:'color 0.18s',
                }}
                onMouseEnter={e => { if (!resendLoading && !countdown) e.currentTarget.style.color='#5379f4' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#403c8b' }}
              >
                {countdown > 0 ? `Resend code (${countdown}s)` : resendLoading ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
