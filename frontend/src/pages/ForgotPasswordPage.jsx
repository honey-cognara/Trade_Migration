import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/api'

/*
  Figma Forgot Password flow — nodes 41:6082, 41:5847, 41:6134, 41:5922, 41:5985
  Step 1 = Enter email (41:6082 / 41:5847)
  Step 2 = Enter OTP   (41:6134)
  Step 3 = New password (41:5922 / 41:5985)
*/

/* ── Step 1 Illustration — envelope / email ── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 580 470" style={{ width:'100%', maxWidth:680, height:'auto' }}
      fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Large envelope */}
      <rect x="140" y="130" width="280" height="210" rx="14" fill="#e6f1ff" stroke="#5379f4" strokeWidth="2.5"/>
      {/* Envelope flap V */}
      <path d="M140 130 L280 230 L420 130" stroke="#5379f4" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      {/* Bottom flap lines */}
      <path d="M140 340 L230 250" stroke="#c8d4f0" strokeWidth="1.8"/>
      <path d="M420 340 L330 250" stroke="#c8d4f0" strokeWidth="1.8"/>

      {/* Orange @ badge */}
      <circle cx="280" cy="280" r="44" fill="#f26f37"/>
      <text x="280" y="296" textAnchor="middle" fill="white" fontSize="38" fontWeight="800" fontFamily="Arial">@</text>

      {/* Floating dots decoration */}
      <circle cx="108" cy="180" r="8" fill="#5379f4" opacity="0.4"/>
      <circle cx="88"  cy="200" r="5" fill="#f26f37" opacity="0.5"/>
      <circle cx="118" cy="210" r="4" fill="#b4eb50" opacity="0.7"/>
      <circle cx="452" cy="168" r="8" fill="#5379f4" opacity="0.4"/>
      <circle cx="470" cy="192" r="5" fill="#f26f37" opacity="0.5"/>
      <circle cx="442" cy="206" r="4" fill="#b4eb50" opacity="0.7"/>

      {/* Small paper plane top right */}
      <path d="M460 100 L490 120 L460 132 L468 118 Z" fill="#5379f4" opacity="0.7"/>
      <path d="M460 100 L468 118" stroke="#5379f4" strokeWidth="1.5" opacity="0.5"/>

      {/* Check badge bottom */}
      <circle cx="390" cy="390" r="30" fill="#22c55e"/>
      <path d="M376 390 L385 399 L404 378" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* Small line decorations */}
      <rect x="100" y="360" width="52" height="8" rx="4" fill="#e6f1ff"/>
      <rect x="100" y="374" width="36" height="8" rx="4" fill="#f4f68b"/>
    </svg>
  )
}

/* ── Step 2 Illustration — phone with OTP ── */
function IllusStep2() {
  return (
    <svg viewBox="0 0 580 470" style={{ width:'100%', maxWidth:680, height:'auto' }}
      fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Phone body */}
      <rect x="210" y="90" width="160" height="290" rx="22" fill="#2f2e41"/>
      <rect x="218" y="110" width="144" height="250" rx="8" fill="#fff"/>
      {/* Home indicator */}
      <rect x="258" y="366" width="64" height="5" rx="2.5" fill="#e6e6e6"/>
      {/* Notch */}
      <rect x="266" y="96" width="48" height="10" rx="5" fill="#1a1a2e"/>

      {/* Screen content — OTP entry */}
      <rect x="228" y="128" width="124" height="12" rx="6" fill="#5379f4" opacity="0.8"/>
      <rect x="240" y="148" width="100" height="8"  rx="4" fill="#e0e6f4"/>
      <rect x="248" y="162" width="84"  height="8"  rx="4" fill="#e0e6f4"/>

      {/* OTP boxes */}
      <rect x="228" y="184" width="28" height="32" rx="5" fill="#e6f1ff" stroke="#5379f4" strokeWidth="1.5"/>
      <rect x="262" y="184" width="28" height="32" rx="5" fill="#e6f1ff" stroke="#5379f4" strokeWidth="1.5"/>
      <rect x="296" y="184" width="28" height="32" rx="5" fill="#e6f1ff" stroke="#5379f4" strokeWidth="1.5"/>
      <rect x="228" y="224" width="28" height="32" rx="5" fill="#f26f37" opacity="0.8"/>
      <rect x="262" y="224" width="28" height="32" rx="5" fill="#f26f37" opacity="0.8"/>
      <rect x="296" y="224" width="28" height="32" rx="5" fill="#f26f37" opacity="0.8"/>

      {/* Verify button on screen */}
      <rect x="228" y="268" width="96" height="20" rx="5" fill="#5379f4"/>

      {/* Floating email icon */}
      <rect x="96"  y="148" width="80" height="58" rx="8" fill="#e6f1ff" stroke="#5379f4" strokeWidth="1.5"/>
      <path d="M96 156 L136 185 L176 156" stroke="#5379f4" strokeWidth="1.8" fill="none"/>
      <path d="M96 206 L124 178" stroke="#c8d4f0" strokeWidth="1.2"/>
      <path d="M176 206 L148 178" stroke="#c8d4f0" strokeWidth="1.2"/>

      {/* Orange lock badge */}
      <circle cx="430" cy="200" r="36" fill="#f26f37"/>
      <rect x="418" y="205" width="24" height="18" rx="4" fill="white"/>
      <path d="M421 205 Q421 193 430 193 Q439 193 439 205"
        stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="430" cy="214" r="3.5" fill="#f26f37"/>
      <rect x="428" y="214" width="4" height="6" rx="2" fill="#f26f37"/>

      {/* Sparkles */}
      <circle cx="120" cy="350" r="6"  fill="#b4eb50" opacity="0.8"/>
      <circle cx="142" cy="370" r="4"  fill="#f26f37" opacity="0.6"/>
      <circle cx="104" cy="376" r="3"  fill="#5379f4" opacity="0.5"/>
      <circle cx="450" cy="320" r="7"  fill="#5379f4" opacity="0.4"/>
      <circle cx="470" cy="344" r="4"  fill="#b4eb50" opacity="0.6"/>
    </svg>
  )
}

/* ── Step 3 Illustration — shield / new password ── */
function IllusStep3() {
  return (
    <svg viewBox="0 0 580 470" style={{ width:'100%', maxWidth:680, height:'auto' }}
      fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Large shield */}
      <path d="M290 80 L420 120 L420 250 Q420 350 290 400 Q160 350 160 250 L160 120 Z"
        fill="#e6f1ff" stroke="#5379f4" strokeWidth="2.5"/>

      {/* Inner shield fill */}
      <path d="M290 108 L400 142 L400 252 Q400 340 290 384 Q180 340 180 252 L180 142 Z"
        fill="#5379f4" opacity="0.12"/>

      {/* Padlock in shield */}
      <rect x="256" y="214" width="68" height="56" rx="10" fill="#5379f4"/>
      <path d="M268 214 Q268 190 290 190 Q312 190 312 214"
        stroke="#5379f4" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <circle cx="290" cy="242" r="9" fill="white"/>
      <rect x="286" y="242" width="8" height="13" rx="4" fill="white"/>

      {/* Check mark overlay */}
      <circle cx="370" cy="300" r="32" fill="#22c55e"/>
      <path d="M356 300 L366 310 L385 288" stroke="white" strokeWidth="4"
        strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* Stars / sparkles */}
      <circle cx="150" cy="160" r="7" fill="#f26f37" opacity="0.7"/>
      <circle cx="168" cy="180" r="4" fill="#b4eb50" opacity="0.8"/>
      <circle cx="136" cy="186" r="3" fill="#5379f4" opacity="0.5"/>
      <circle cx="430" cy="140" r="7" fill="#f4f68b" opacity="0.9"/>
      <circle cx="448" cy="162" r="4" fill="#f26f37" opacity="0.6"/>

      {/* Password dots row */}
      <rect x="170" y="390" width="240" height="36" rx="10" fill="#e6f1ff" stroke="#c8d4f0" strokeWidth="1.5"/>
      {[196, 218, 240, 262, 284, 306, 328, 350].map((x, i) => (
        <circle key={i} cx={x} cy="408" r="5" fill="#5379f4" opacity="0.7"/>
      ))}

      {/* Orange ribbon banner */}
      <rect x="100" y="310" width="96" height="32" rx="6" fill="#f26f37" opacity="0.85"/>
      <rect x="100" y="316" width="96" height="8"  rx="2" fill="rgba(255,255,255,0.3)"/>
      <path d="M196 310 L210 326 L196 342" fill="#c85018"/>
    </svg>
  )
}

/* ── Eye icons ── */
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

/* ── Success Modal ── */
function SuccessModal({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'2.5rem 2rem', maxWidth:420, width:'100%',
        textAlign:'center', position:'relative', animation:'fd-pop 0.25s ease-out' }}>

        {/* Confetti dots */}
        {['#f26f37','#5379f4','#22c55e','#f4f68b','#f26f37','#5379f4','#22c55e','#f26f37','#b4eb50','#5379f4'].map((c, i) => (
          <span key={i} style={{
            position:'absolute', width:6, height:6, borderRadius:i%2===0?'50%':'2px',
            background:c, left:`${8+i*9}%`, top:'5%',
            animation:'fd-fall 1.2s ease-in forwards',
            animationDelay:`${i*0.08}s`,
          }} />
        ))}

        <div style={{ width:80, height:80, borderRadius:'50%', background:'#f26f37',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 1rem', position:'relative' }}>
          <span style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-30%)', fontSize:'1.5rem' }}>🎉</span>
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path d="M3 14L14 25L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ fontSize:'1.3rem', fontWeight:800, color:'#343434', marginBottom:'0.6rem' }}>
          Password Reset Successful!
        </h2>
        <p style={{ fontSize:'0.875rem', color:'#6a7380', marginBottom:'1.5rem', lineHeight:1.5 }}>
          Your password has been updated. You can now sign in with your new credentials.
        </p>
        <button onClick={onClose} style={{ width:'100%', padding:'0.85rem', background:'#5379f4',
          color:'#fff', border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700, cursor:'pointer' }}>
          Sign In Now
        </button>
      </div>
    </div>
  )
}

const ILLUS = [<IllusStep1 />, <IllusStep2 />, <IllusStep3 />]

export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step,            setStep]            = useState(1)
  const [email,           setEmail]           = useState('')
  const [otp,             setOtp]             = useState('')
  const [resetToken,      setResetToken]      = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showPw2,         setShowPw2]         = useState(false)
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [showModal,       setShowModal]       = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email) { setError('Email is required.'); return }
    setLoading(true); setError('')
    try {
      await forgotPassword({ email })
    } catch { /* always advance — no enumeration */ }
    finally { setLoading(false); setStep(2) }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    if (otp.length < 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const data = await verifyResetOtp({ email, otp_code: otp })
      setResetToken(data.access_token)
      setStep(3)
    } catch (err) {
      setError(err.detail || 'Invalid or expired code.')
    } finally { setLoading(false) }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    if (!newPassword)                        { setError('Password is required.'); return }
    if (newPassword.length < 8)              { setError('Minimum 8 characters.'); return }
    if (!/[A-Z]/.test(newPassword))          { setError('Must include an uppercase letter.'); return }
    if (!/\d/.test(newPassword))             { setError('Must include a number.'); return }
    if (newPassword !== confirmPassword)     { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await resetPassword({ reset_token: resetToken, new_password: newPassword })
      setShowModal(true)
    } catch (err) {
      setError(err.detail || 'Failed to reset password. Please start over.')
    } finally { setLoading(false) }
  }

  const stepTitles    = ['Forgot Password?',       'Check Your Email',      'Set New Password']
  const stepSubtitles = [
    'Enter your email to receive a reset code.',
    `We sent a 6-digit code to ${email || 'your inbox'}.`,
    'Choose a strong password for your account.',
  ]

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#fbfbfb',
      position:       'relative',
      overflow:       'hidden',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1.5rem',
    }}>

      {/* ── Background blobs ── */}
      <div style={{ position:'absolute', top:-90, right:-110, width:370, height:320,
        borderRadius:'50%', background:'#e6f1ff', opacity:0.9, zIndex:0 }} />
      <div style={{ position:'absolute', top:15, right:75, width:185, height:160,
        borderRadius:'50%', background:'#f4f68b', opacity:0.65, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:-90, left:-115, width:355, height:305,
        borderRadius:'50%', background:'#e6f1ff', opacity:0.85, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:22, left:52, width:170, height:150,
        borderRadius:'50%', background:'#f4f68b', opacity:0.5, zIndex:0 }} />
      <div style={{ position:'absolute', top:'8%',  left:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'13%', left:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'6%',  left:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55, zIndex:0 }} />
      <div style={{ position:'absolute', top:'17%', left:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5,  zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'10%', right:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7,  zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'16%', right:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6,  zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'8%',  right:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'20%', right:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5,  zIndex:0 }} />

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
          width:        358,
          background:   '#e6f1ff',
          borderRadius: 20,
          padding:      '2.6rem 2.1rem',
          boxShadow:    '0 8px 36px rgba(83,121,244,0.11)',
        }}>

          {/* Step dots indicator */}
          <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1.6rem' }}>
            {[1,2,3].map(n => (
              <div key={n} style={{
                height:5, flex: n === step ? 2 : 1, borderRadius:3,
                background: n <= step ? '#5379f4' : '#c8d4f0',
                transition:'all 0.3s',
              }} />
            ))}
          </div>

          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#343434', marginBottom:'0.4rem' }}>
            {stepTitles[step-1]}
          </h1>
          <p style={{ fontSize:'0.84rem', color:'#6a7380', lineHeight:1.6, marginBottom:'1.4rem' }}>
            {stepSubtitles[step-1]}
          </p>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
              borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
              {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} noValidate>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? <><span className="spinner" /> Sending…</> : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} noValidate>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={labelStyle}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                  style={{ ...inputStyle, letterSpacing:'0.35em', fontSize:'1.1rem', textAlign:'center' }}
                />
              </div>
              <button type="submit" disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify Code'}
              </button>
              <button type="button" onClick={() => { setStep(1); setOtp(''); setError('') }}
                style={{ background:'none', border:'none', color:'#5379f4', fontSize:'0.88rem',
                  fontWeight:600, cursor:'pointer', textDecoration:'underline', marginTop:'0.7rem',
                  display:'block', textAlign:'center', width:'100%' }}>
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetSubmit} noValidate>
              <div style={{ marginBottom:'1rem' }}>
                <label style={labelStyle}>New Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError('') }}
                    style={{ ...inputStyle, paddingRight:'2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position:'absolute', right:'0.8rem', top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'#6a7380', padding:0, display:'flex' }}>
                    {showPw ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPw2 ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                    style={{ ...inputStyle, paddingRight:'2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowPw2(p => !p)}
                    style={{ position:'absolute', right:'0.8rem', top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', color:'#6a7380', padding:0, display:'flex' }}>
                    {showPw2 ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? <><span className="spinner" /> Updating…</> : 'Reset Password'}
              </button>
            </form>
          )}

          <div style={{ textAlign:'center', marginTop:'1.2rem' }}>
            <Link to="/login" style={{ fontSize:'0.85rem', color:'#5379f4', fontWeight:600, textDecoration:'none' }}>
              ← Back to Sign In
            </Link>
          </div>
        </div>

        {/* ── Illustration (changes per step) ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', overflow:'hidden' }}>
          {ILLUS[step-1]}
        </div>
      </div>

      {showModal && (
        <SuccessModal onClose={() => navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } })} />
      )}
    </div>
  )
}

/* ── Shared styles ── */
const labelStyle = {
  display:'block', fontSize:'0.85rem', fontWeight:600, color:'#343434', marginBottom:'0.4rem',
}
const inputStyle = {
  width:'100%', padding:'0.82rem 1rem', borderRadius:10,
  border:'1.5px solid #c8d4f0', background:'#fff', fontSize:'0.92rem',
  outline:'none', boxSizing:'border-box', color:'#343434',
}
const btnStyle = (disabled) => ({
  width:'100%', padding:'0.85rem', background:'#5379f4', color:'#fff',
  border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.65 : 1, transition:'background 0.18s',
  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
})
