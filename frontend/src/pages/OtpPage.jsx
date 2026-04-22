import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp, resendOtp, saveToken } from '../services/api'

/*
  Illustration rebuilt pixel-by-pixel from Figma screenshot.
  Exact colors from Figma node vectors:
    skin    #ffb8b8  |  dark-navy  #2f2e41  |  outfit  #3f3d56
    orange  #f26f37  |  pink-bag   #ff6584  |  blue    #5379f4
    bubble-fill  #e6e6e6  |  grey  #cccccc  |  outline  #3d3b4f
*/
function IllusRight() {
  return (
    <svg
      viewBox="0 0 580 470"
      style={{ width: '100%', maxWidth: 680, height: 'auto' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ══════════════════════════════════════
          SPEECH BUBBLE  (left side)
         ══════════════════════════════════════ */}

      {/* Main bubble oval — light-grey fill, thin dashed outline */}
      <ellipse cx="152" cy="183" rx="120" ry="108"
        fill="#e6e6e6"
        stroke="#3d3b4f" strokeWidth="1.6" strokeDasharray="5 4"/>

      {/* Bubble appendage — small oval bottom-left */}
      <ellipse cx="84" cy="300" rx="36" ry="27"
        fill="#e6e6e6"
        stroke="#3d3b4f" strokeWidth="1.6" strokeDasharray="5 4"/>

      {/* 3 orange bars */}
      <rect x="78"  y="138" width="150" height="28" rx="14" fill="#f26f37"/>
      <rect x="78"  y="177" width="150" height="28" rx="14" fill="#f26f37"/>
      <rect x="78"  y="216" width="116" height="28" rx="14" fill="#f26f37"/>

      {/* Small grey USB / tablet below appendage */}
      <rect x="58"  y="335" width="54"  height="19" rx="7"  fill="#d0d0d0"/>
      <rect x="46"  y="350" width="78"  height="12" rx="5"  fill="#c4c4c4"/>

      {/* ══════════════════════════════════════
          BROWSER CARD  (bottom-right)
         ══════════════════════════════════════ */}
      <rect x="282" y="382" width="298" height="134" rx="13"
        fill="white" stroke="#e4e8f0" strokeWidth="1.5"/>
      {/* Orange header */}
      <rect x="282" y="382" width="298" height="34" rx="13" fill="#f26f37"/>
      <rect x="282" y="399" width="298" height="17" fill="#f26f37"/>
      {/* Traffic-light dots */}
      <circle cx="306" cy="399" r="6"   fill="white" opacity="0.7"/>
      <circle cx="325" cy="399" r="6"   fill="white" opacity="0.5"/>
      <circle cx="344" cy="399" r="6"   fill="white" opacity="0.35"/>
      {/* Blue content bar */}
      <rect x="306" y="427" width="198" height="12" rx="6"   fill="#5379f4" opacity="0.85"/>
      {/* Grey content lines */}
      <rect x="306" y="450" width="172" height="10" rx="5"   fill="#cccccc"/>
      <rect x="306" y="467" width="184" height="10" rx="5"   fill="#cccccc"/>
      <rect x="306" y="484" width="152" height="10" rx="5"   fill="#cccccc"/>

      {/* ══════════════════════════════════════
          WOMAN  — peach skin, dark outfit,
                   long high ponytail
         ══════════════════════════════════════ */}

      {/* ── Feet / shoes ── */}
      <ellipse cx="370" cy="385" rx="24" ry="9" fill="#2f2e41"/>
      <ellipse cx="416" cy="385" rx="22" ry="9" fill="#2f2e41"/>

      {/* ── Bare peach legs ── */}
      <rect x="358" y="312" width="22" height="75" rx="11" fill="#ffb8b8"/>
      <rect x="401" y="312" width="22" height="75" rx="11" fill="#ffb8b8"/>

      {/* ── Long dark skirt ── */}
      <path d="M350 210 Q337 268 352 314 L434 314 Q446 268 436 210 Z"
        fill="#2f2e41"/>

      {/* ── Body / top (dark charcoal) ── */}
      <rect x="355" y="143" width="68" height="72" rx="9" fill="#3f3d56"/>

      {/* ── Left arm → orange folder ── */}
      <path d="M355 164 Q318 172 284 192 Q277 214 295 216 Q320 210 358 186 Z"
        fill="#3f3d56"/>

      {/* ── Right arm → pink bag ── */}
      <path d="M423 158 Q448 170 452 200 Q443 215 433 210 Q431 191 423 173 Z"
        fill="#3f3d56"/>

      {/* ── Orange folder (left hand) ── */}
      <rect x="256" y="186" width="48" height="46" rx="5" fill="#f26f37"/>
      <rect x="265" y="196" width="30" height="5"  rx="2.5" fill="white" opacity="0.45"/>
      <rect x="265" y="206" width="30" height="5"  rx="2.5" fill="white" opacity="0.38"/>
      <rect x="265" y="216" width="22" height="5"  rx="2.5" fill="white" opacity="0.3"/>

      {/* ── Pink bag (right hand) ── */}
      <rect x="438" y="197" width="36" height="46" rx="10" fill="#ff6584"/>
      <path d="M443 197 Q456 181 470 197"
        stroke="#c53060" strokeWidth="3" fill="none" strokeLinecap="round"/>

      {/* ── Neck ── */}
      <rect x="374" y="126" width="21" height="22" rx="8" fill="#ffb8b8"/>

      {/* ── Head ── */}
      <circle cx="384" cy="96" r="42" fill="#ffb8b8"/>

      {/* ── Hair cap — tight dome on top, face clearly visible ── */}
      <path d="M 346 96 Q 344 66 356 46 Q 369 24 384 24 Q 401 24 414 44 Q 427 64 424 96 Q 416 74 384 72 Q 352 74 346 96 Z"
        fill="#2f2e41"/>

      {/* ── PONYTAIL — sweeps upward then right (high ponytail) ── */}
      <path d="M 416 88 C 444 54 512 28 560 44 C 582 54 582 80 562 94 C 530 110 462 100 420 84 Z"
        fill="#2f2e41"/>

    </svg>
  )
}

/* ── role → first-login route ── */
const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/employer/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
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
      const data = await verifyOtp({ email, otp: code })
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
      minHeight:       '100vh',
      background:      '#fbfbfb',
      position:        'relative',
      overflow:        'hidden',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '2rem 1.5rem',
    }}>

      {/* ── Background blobs — exact Figma colors ── */}

      {/* top-right: large blue ellipse */}
      <div style={{ position:'absolute', top:-90, right:-110, width:370, height:320,
        borderRadius:'50%', background:'#e6f1ff', opacity:0.9, zIndex:0 }} />
      {/* top-right: yellow-green ellipse */}
      <div style={{ position:'absolute', top:15, right:75, width:185, height:160,
        borderRadius:'50%', background:'#f4f68b', opacity:0.65, zIndex:0 }} />

      {/* bottom-left: large blue ellipse */}
      <div style={{ position:'absolute', bottom:-90, left:-115, width:355, height:305,
        borderRadius:'50%', background:'#e6f1ff', opacity:0.85, zIndex:0 }} />
      {/* bottom-left: yellow-green ellipse */}
      <div style={{ position:'absolute', bottom:22, left:52, width:170, height:150,
        borderRadius:'50%', background:'#f4f68b', opacity:0.5, zIndex:0 }} />

      {/* top-left: 4 small green dots */}
      <div style={{ position:'absolute', top:'8%',  left:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7, zIndex:0 }} />
      <div style={{ position:'absolute', top:'13%', left:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6, zIndex:0 }} />
      <div style={{ position:'absolute', top:'6%',  left:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55,zIndex:0 }} />
      <div style={{ position:'absolute', top:'17%', left:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5, zIndex:0 }} />

      {/* bottom-right: 4 small green dots */}
      <div style={{ position:'absolute', bottom:'10%', right:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'16%', right:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'8%',  right:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55,zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'20%', right:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5, zIndex:0 }} />

      {/* ── Main layout ── */}
      <div style={{
        position:   'relative',
        zIndex:     2,
        display:    'flex',
        alignItems: 'center',
        gap:        '1.5rem',
        maxWidth:   1160,
        width:      '100%',
      }}>

        {/* ── Form card ── */}
        <div style={{
          flex:         '0 0 auto',
          width:        345,
          background:   '#e6f1ff',
          borderRadius: 20,
          padding:      '2.6rem 2.1rem',
          boxShadow:    '0 8px 36px rgba(83,121,244,0.11)',
        }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#343434', textAlign:'center', marginBottom:'0.6rem' }}>
            Verify Email
          </h1>
          <p style={{ fontSize:'0.84rem', color:'#6a7380', textAlign:'center', lineHeight:1.6, marginBottom:'1.6rem' }}>
            We've sent a verification code to your inbox. Please enter it
            below to secure your account and continue.
            {email && <><br /><strong style={{ color:'#343434' }}>{email}</strong></>}
          </p>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
              borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'1.2rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:600, color:'#343434', marginBottom:'0.4rem' }}>
                Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter Code"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                style={{ width:'100%', padding:'0.82rem 1rem', borderRadius:10,
                  border:'1.5px solid #c8d4f0', background:'#fff', fontSize:'1rem',
                  outline:'none', boxSizing:'border-box', color:'#343434' }}
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
                  background:'none', border:'none', color:'#403c8b',
                  fontSize:'0.88rem', fontWeight:600,
                  cursor:(resendLoading || countdown > 0) ? 'not-allowed' : 'pointer',
                  opacity:(resendLoading || countdown > 0) ? 0.55 : 1,
                  textDecoration:'underline',
                }}
              >
                {countdown > 0 ? `Resend code (${countdown}s)` : resendLoading ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Illustration (right) ── */}
        <div style={{
          flex:       1,
          minWidth:   0,
          display:    'flex',
          alignItems: 'center',
          overflow:   'hidden',
        }}>
          <IllusRight />
        </div>

      </div>
    </div>
  )
}
