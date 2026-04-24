import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp, resendOtp, saveToken } from '../services/api'

/* ── role → first-login route ── */
const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

/* ── Style B Background: navy dots + blobs ── */
function BgStyleB() {
  return (
    <>
      {/* Top-right corner: yellow-green blob */}
      <div style={{ position:'absolute', top:0, right:0, width:200, height:160,
        borderRadius:'0 0 0 100%', background:'#e4f5b0', opacity:0.85, zIndex:0 }} />
      {/* Bottom-left corner: teal blob */}
      <div style={{ position:'absolute', bottom:0, left:0, width:180, height:150,
        borderRadius:'0 100% 0 0', background:'#b8e8d8', opacity:0.85, zIndex:0 }} />
      {/* Top-right: navy hollow circle */}
      <div style={{ position:'absolute', top:'8%', right:'7%', width:64, height:64,
        borderRadius:'50%', border:'3px solid #1a1a2e', background:'transparent', opacity:0.25, zIndex:0 }} />
      {/* Top-right: small navy hollow circle */}
      <div style={{ position:'absolute', top:'14%', right:'4%', width:40, height:40,
        borderRadius:'50%', border:'2.5px solid #1a1a2e', background:'transparent', opacity:0.2, zIndex:0 }} />
      {/* Top-right: tiny navy solid dot */}
      <div style={{ position:'absolute', top:'6%', right:'9%', width:12, height:12,
        borderRadius:'50%', background:'#1a1a2e', opacity:0.18, zIndex:0 }} />
      {/* Bottom-left: navy hollow circle */}
      <div style={{ position:'absolute', bottom:'8%', left:'7%', width:64, height:64,
        borderRadius:'50%', border:'3px solid #1a1a2e', background:'transparent', opacity:0.25, zIndex:0 }} />
      {/* Bottom-left: small navy hollow circle */}
      <div style={{ position:'absolute', bottom:'14%', left:'4%', width:40, height:40,
        borderRadius:'50%', border:'2.5px solid #1a1a2e', background:'transparent', opacity:0.2, zIndex:0 }} />
      {/* Bottom-left: tiny navy solid dot */}
      <div style={{ position:'absolute', bottom:'6%', left:'9%', width:12, height:12,
        borderRadius:'50%', background:'#1a1a2e', opacity:0.18, zIndex:0 }} />
    </>
  )
}

/* ── OTP Illustration (RIGHT) ── */
function IllusOtp() {
  return (
    <svg
      viewBox="0 0 520 480"
      style={{ width:'100%', maxWidth:560, height:'auto' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Browser window card at bottom ── */}
      <rect x="100" y="280" width="320" height="160" rx="14"
        fill="white" stroke="#e4e8f0" strokeWidth="1.5"/>
      {/* Orange header bar */}
      <rect x="100" y="280" width="320" height="38" rx="14" fill="#f26f37"/>
      <rect x="100" y="300" width="320" height="18" fill="#f26f37"/>
      {/* Traffic light dots */}
      <circle cx="124" cy="299" r="6" fill="white" opacity="0.7"/>
      <circle cx="143" cy="299" r="6" fill="white" opacity="0.5"/>
      <circle cx="162" cy="299" r="6" fill="white" opacity="0.35"/>
      {/* Blue bar content */}
      <rect x="120" y="330" width="180" height="12" rx="6" fill="#5379f4" opacity="0.8"/>
      {/* Grey lines */}
      <rect x="120" y="352" width="160" height="9" rx="4" fill="#e0e0e0"/>
      <rect x="120" y="367" width="200" height="9" rx="4" fill="#e0e0e0"/>
      <rect x="120" y="382" width="140" height="9" rx="4" fill="#e0e0e0"/>
      {/* Orange accent bar right */}
      <rect x="352" y="330" width="52" height="60" rx="8" fill="#f26f37" opacity="0.15"/>
      <rect x="360" y="340" width="36" height="8" rx="4" fill="#f26f37" opacity="0.6"/>
      <rect x="360" y="354" width="28" height="8" rx="4" fill="#f26f37" opacity="0.4"/>

      {/* ── Speech bubble (upper left) ── */}
      <ellipse cx="155" cy="170" rx="100" ry="85"
        fill="#f0f0f0" stroke="#d0d0d0" strokeWidth="1.5" strokeDasharray="5 4"/>
      {/* Bubble tail */}
      <ellipse cx="210" cy="248" rx="28" ry="20"
        fill="#f0f0f0" stroke="#d0d0d0" strokeWidth="1.5" strokeDasharray="5 4"/>
      {/* Orange bars inside bubble */}
      <rect x="80" y="133" width="150" height="22" rx="11" fill="#f26f37" opacity="0.9"/>
      <rect x="80" y="163" width="150" height="22" rx="11" fill="#f26f37" opacity="0.9"/>
      <rect x="80" y="193" width="116" height="22" rx="11" fill="#f26f37" opacity="0.9"/>

      {/* ── Woman standing on browser card ── */}
      {/* Feet / shoes */}
      <ellipse cx="310" cy="282" rx="20" ry="7" fill="#2f2e41"/>
      <ellipse cx="350" cy="282" rx="18" ry="7" fill="#2f2e41"/>
      {/* Legs */}
      <rect x="302" y="232" width="16" height="52" rx="8" fill="#ffb8b8"/>
      <rect x="340" y="232" width="16" height="52" rx="8" fill="#ffb8b8"/>
      {/* Skirt */}
      <path d="M295 155 Q283 194 298 234 L365 234 Q378 194 368 155 Z" fill="#3f3d56"/>
      {/* Body */}
      <rect x="300" y="104" width="60" height="55" rx="8" fill="#3f3d56"/>
      {/* Left arm holding orange folder */}
      <path d="M300 118 Q268 126 244 146 Q238 164 254 166 Q274 160 302 140 Z" fill="#3f3d56"/>
      {/* Right arm */}
      <path d="M360 114 Q380 124 384 150 Q376 162 366 157 Q364 140 358 124 Z" fill="#3f3d56"/>
      {/* Orange folder */}
      <rect x="212" y="140" width="52" height="44" rx="6" fill="#f26f37"/>
      {/* Folder tab */}
      <rect x="212" y="134" width="24" height="10" rx="4" fill="#f26f37"/>
      <rect x="220" y="150" width="36" height="5" rx="2.5" fill="white" opacity="0.5"/>
      <rect x="220" y="160" width="36" height="5" rx="2.5" fill="white" opacity="0.4"/>
      <rect x="220" y="170" width="26" height="5" rx="2.5" fill="white" opacity="0.3"/>
      {/* Neck */}
      <rect x="322" y="88" width="18" height="18" rx="7" fill="#ffb8b8"/>
      {/* Head */}
      <circle cx="331" cy="72" r="28" fill="#ffb8b8"/>
      {/* High ponytail hair */}
      <path d="M307 72 Q305 52 315 38 Q323 26 331 26 Q340 26 348 38 Q358 52 356 72 Q350 56 331 54 Q312 56 307 72 Z"
        fill="#2f2e41"/>
      {/* Ponytail up */}
      <path d="M350 62 C 368 36 408 22 438 34 C 454 42 452 62 436 70 C 412 80 368 72 352 64 Z"
        fill="#2f2e41"/>
    </svg>
  )
}

export function OtpPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const email     = location.state?.email || ''

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
    finally   { setResendLoading(false) }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#f7f7f7',
      position:       'relative',
      overflow:       'hidden',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1.5rem',
    }}>

      <BgStyleB />

      {/* ── Main layout ── */}
      <div style={{
        position:   'relative',
        zIndex:     2,
        display:    'flex',
        alignItems: 'center',
        gap:        '2rem',
        maxWidth:   1100,
        width:      '100%',
      }}>

        {/* ── LEFT: Card ── */}
        <div style={{
          flex:         '0 0 auto',
          width:        340,
          background:   '#dce8ff',
          borderRadius: 20,
          padding:      '2.5rem 2rem',
          boxShadow:    '0 8px 40px rgba(83,121,244,0.12)',
        }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a1a2e',
            textAlign:'center', marginBottom:'0.7rem', marginTop:0 }}>
            Verify Email
          </h1>
          <p style={{ fontSize:'0.85rem', color:'#6a7380', textAlign:'center',
            lineHeight:1.6, marginBottom:'1.5rem', marginTop:0 }}>
            We've sent a verification code to your inbox. Please enter it
            below to secure your account and continue.
            {email && (
              <><br /><strong style={{ color:'#1a1a2e' }}>{email}</strong></>
            )}
          </p>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
              borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'1.2rem' }}>
              <label style={labelStyle}>Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter Code"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              style={{
                width:'100%', padding:'0.85rem', background:'#5379f4', color:'#fff',
                border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700,
                cursor:(loading || code.length < 6) ? 'not-allowed' : 'pointer',
                opacity:(loading || code.length < 6) ? 0.65 : 1,
                marginBottom:'1rem', transition:'background 0.18s',
              }}
              onMouseEnter={e => { if (!loading && code.length >= 6) e.currentTarget.style.background = '#3f5ee0' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div style={{ textAlign:'center' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || countdown > 0}
                style={{
                  background:'none', border:'none', color:'#5379f4',
                  fontSize:'0.88rem', fontWeight:600,
                  cursor:(resendLoading || countdown > 0) ? 'not-allowed' : 'pointer',
                  opacity:(resendLoading || countdown > 0) ? 0.55 : 1,
                  textDecoration:'underline',
                  padding:0,
                }}
              >
                {countdown > 0
                  ? `Resend code (${countdown}s)`
                  : resendLoading ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Illustration ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IllusOtp />
        </div>

      </div>
    </div>
  )
}

/* ── Shared micro-styles ── */
const labelStyle = {
  display:'block', fontSize:'0.85rem', fontWeight:600, color:'#1a1a2e', marginBottom:'0.4rem',
}
const inputStyle = {
  width:'100%', padding:'0.75rem 1rem', borderRadius:10,
  border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'1rem',
  outline:'none', boxSizing:'border-box', color:'#1a1a2e',
}
