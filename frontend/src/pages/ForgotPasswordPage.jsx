import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/api'

/* ── Style A Background: orange rings + blobs ── */
function BgStyleA() {
  return (
    <>
      {/* Top-right: yellow-green blob */}
      <div style={{ position:'absolute', top:-80, right:-100, width:340, height:280,
        borderRadius:'50% 60% 55% 50%', background:'#c8f07a', opacity:0.7, zIndex:0 }} />
      {/* Top-right: blue blob */}
      <div style={{ position:'absolute', top:30, right:80, width:260, height:220,
        borderRadius:'55% 50% 60% 45%', background:'#a8d8f0', opacity:0.65, zIndex:0 }} />
      {/* Bottom-left: teal blob */}
      <div style={{ position:'absolute', bottom:-70, left:-90, width:300, height:260,
        borderRadius:'50% 55% 50% 60%', background:'#a8e6d0', opacity:0.7, zIndex:0 }} />
      {/* Top-left: 3 orange outlined rings */}
      <div style={{ position:'absolute', top:'8%', left:'5%', width:80, height:80,
        borderRadius:'50%', border:'3px solid #f26f37', background:'transparent', zIndex:0 }} />
      <div style={{ position:'absolute', top:'14%', left:'3.5%', width:56, height:56,
        borderRadius:'50%', border:'2.5px solid #f26f37', background:'transparent', zIndex:0 }} />
      <div style={{ position:'absolute', top:'20%', left:'7%', width:32, height:32,
        borderRadius:'50%', border:'2px solid #f26f37', background:'transparent', zIndex:0 }} />
      {/* Bottom-right: 2 small orange outlined rings */}
      <div style={{ position:'absolute', right:'4%', bottom:'10%', width:64, height:64,
        borderRadius:'50%', border:'2.5px solid #f26f37', background:'transparent', zIndex:0 }} />
      <div style={{ position:'absolute', right:'6%', bottom:'16%', width:40, height:40,
        borderRadius:'50%', border:'2px solid #f26f37', background:'transparent', zIndex:0 }} />
    </>
  )
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
      {/* Top-right: navy hollow circles */}
      <div style={{ position:'absolute', top:'8%', right:'7%', width:64, height:64,
        borderRadius:'50%', border:'3px solid #1a1a2e', background:'transparent', opacity:0.25, zIndex:0 }} />
      <div style={{ position:'absolute', top:'14%', right:'4%', width:40, height:40,
        borderRadius:'50%', border:'2.5px solid #1a1a2e', background:'transparent', opacity:0.2, zIndex:0 }} />
      <div style={{ position:'absolute', top:'6%', right:'9%', width:12, height:12,
        borderRadius:'50%', background:'#1a1a2e', opacity:0.18, zIndex:0 }} />
      {/* Bottom-left: navy hollow circles */}
      <div style={{ position:'absolute', bottom:'8%', left:'7%', width:64, height:64,
        borderRadius:'50%', border:'3px solid #1a1a2e', background:'transparent', opacity:0.25, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'14%', left:'4%', width:40, height:40,
        borderRadius:'50%', border:'2.5px solid #1a1a2e', background:'transparent', opacity:0.2, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'6%', left:'9%', width:12, height:12,
        borderRadius:'50%', background:'#1a1a2e', opacity:0.18, zIndex:0 }} />
    </>
  )
}

/* ── Step 1 Illustration: woman with tablet + question mark ── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 520 480" style={{ width:'100%', maxWidth:560, height:'auto' }}
      fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── Ground ── */}
      <rect x="80" y="346" width="360" height="4" rx="2" fill="#e0e8f8"/>

      {/* ── Woman sitting, holding tablet ── */}
      {/* Legs (sitting, bent) */}
      <path d="M226 346 Q218 320 230 306 Q240 296 252 310 Q258 328 250 346 Z" fill="#ffb8b8"/>
      <path d="M290 346 Q298 320 286 306 Q276 296 264 310 Q258 328 266 346 Z" fill="#ffb8b8"/>
      {/* Shoes */}
      <ellipse cx="232" cy="346" rx="22" ry="8" fill="#2f2e41"/>
      <ellipse cx="284" cy="346" rx="22" ry="8" fill="#2f2e41"/>
      {/* Body - orange top */}
      <rect x="232" y="225" width="60" height="82" rx="10" fill="#f26f37"/>
      {/* Left arm reaching out holding tablet */}
      <path d="M232 240 Q200 252 175 272 Q170 288 184 290 Q204 284 234 264 Z" fill="#ffb8b8"/>
      {/* Right arm down */}
      <path d="M292 238 Q316 248 318 276 Q310 288 302 282 Q300 262 292 248 Z" fill="#ffb8b8"/>
      {/* Tablet in left hand */}
      <rect x="140" y="264" width="58" height="44" rx="6" fill="#dce8ff" stroke="#5379f4" strokeWidth="2"/>
      <rect x="148" y="272" width="42" height="28" rx="3" fill="#fff"/>
      <rect x="152" y="276" width="34" height="5" rx="2" fill="#e0e6f4"/>
      <rect x="152" y="285" width="26" height="5" rx="2" fill="#e0e6f4"/>
      <rect x="152" y="294" width="30" height="5" rx="2" fill="#e0e6f4"/>
      {/* Neck */}
      <rect x="253" y="207" width="18" height="20" rx="7" fill="#ffb8b8"/>
      {/* Head */}
      <circle cx="262" cy="190" r="30" fill="#ffb8b8"/>
      {/* Dark curly hair */}
      <path d="M236 192 Q234 166 248 150 Q258 136 262 136 Q268 136 276 150 Q290 166 288 192 Q282 172 262 170 Q242 172 236 192 Z"
        fill="#2f2e41"/>
      {/* Curly side hair left */}
      <path d="M236 192 Q226 204 228 220 Q236 220 240 210 Q238 200 236 192 Z" fill="#2f2e41"/>
      {/* Curly side hair right */}
      <path d="M288 192 Q298 204 296 220 Q288 220 284 210 Q286 200 288 192 Z" fill="#2f2e41"/>
      {/* Hair curls texture */}
      <path d="M240 146 Q232 154 236 162" stroke="#2f2e41" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M282 146 Q290 154 286 162" stroke="#2f2e41" strokeWidth="5" fill="none" strokeLinecap="round"/>

      {/* ── Blue question mark above head ── */}
      <circle cx="310" cy="130" r="38" fill="#5379f4" opacity="0.15"/>
      <circle cx="310" cy="130" r="32" fill="#5379f4" opacity="0.2"/>
      <text x="310" y="146" textAnchor="middle" fill="#5379f4" fontSize="44" fontWeight="900"
        fontFamily="Arial, sans-serif">?</text>

      {/* ── Decorative elements ── */}
      <circle cx="130" cy="200" r="10" fill="#f26f37" opacity="0.4"/>
      <circle cx="108" cy="220" r="6" fill="#c8f07a" opacity="0.7"/>
      <circle cx="400" cy="280" r="8" fill="#5379f4" opacity="0.3"/>
      <circle cx="420" cy="260" r="5" fill="#f26f37" opacity="0.4"/>
      <rect x="380" y="340" width="60" height="10" rx="5" fill="#dce8ff"/>
      <rect x="380" y="356" width="44" height="10" rx="5" fill="#e4f5b0" opacity="0.8"/>
    </svg>
  )
}

/* ── Step 2 Illustration: woman holding hexagon with browser elements ── */
function IllusStep2() {
  return (
    <svg viewBox="0 0 520 480" style={{ width:'100%', maxWidth:560, height:'auto' }}
      fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── Browser frame behind woman ── */}
      <rect x="100" y="120" width="240" height="200" rx="12" fill="white" stroke="#e4e8f0" strokeWidth="1.5"/>
      {/* Browser header - orange */}
      <rect x="100" y="120" width="240" height="32" rx="12" fill="#f26f37"/>
      <rect x="100" y="138" width="240" height="14" fill="#f26f37"/>
      {/* Browser dots */}
      <circle cx="120" cy="136" r="5" fill="white" opacity="0.7"/>
      <circle cx="136" cy="136" r="5" fill="white" opacity="0.5"/>
      <circle cx="152" cy="136" r="5" fill="white" opacity="0.35"/>
      {/* Browser content lines */}
      <rect x="118" y="165" width="140" height="10" rx="5" fill="#e0e6f4"/>
      {/* Checkmark circles */}
      <circle cx="128" cy="195" r="10" fill="#22c55e"/>
      <path d="M123 195 L127 199 L134 190" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="144" y="190" width="100" height="10" rx="5" fill="#e0e6f4"/>
      <circle cx="128" cy="220" r="10" fill="#22c55e"/>
      <path d="M123 220 L127 224 L134 215" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="144" y="215" width="80" height="10" rx="5" fill="#e0e6f4"/>
      <circle cx="128" cy="245" r="10" fill="#5379f4" opacity="0.5"/>
      <rect x="144" y="240" width="112" height="10" rx="5" fill="#e0e6f4"/>
      {/* Orange frame corner */}
      <rect x="300" y="120" width="8" height="80" rx="4" fill="#f26f37" opacity="0.5"/>
      <rect x="300" y="120" width="80" height="8" rx="4" fill="#f26f37" opacity="0.5"/>

      {/* ── Ground ── */}
      <rect x="80" y="388" width="360" height="4" rx="2" fill="#e0e8f8"/>

      {/* ── Woman standing, dark outfit, dark skin ── */}
      {/* Feet */}
      <ellipse cx="298" cy="388" rx="20" ry="7" fill="#2f2e41"/>
      <ellipse cx="338" cy="388" rx="18" ry="7" fill="#2f2e41"/>
      {/* Legs */}
      <rect x="290" y="338" width="16" height="52" rx="8" fill="#a0785a"/>
      <rect x="328" y="338" width="16" height="52" rx="8" fill="#a0785a"/>
      {/* Skirt/bottom */}
      <path d="M283 258 Q271 298 288 340 L352 340 Q366 298 356 258 Z" fill="#2f2e41"/>
      {/* Body */}
      <rect x="288" y="200" width="60" height="62" rx="8" fill="#3f3d56"/>
      {/* Left arm holding hexagon */}
      <path d="M288 214 Q256 224 230 244 Q224 262 240 264 Q260 258 290 238 Z" fill="#3f3d56"/>
      {/* Right arm */}
      <path d="M348 208 Q370 218 374 244 Q366 256 356 250 Q354 232 346 218 Z" fill="#3f3d56"/>
      {/* White hexagon held in left hand */}
      <polygon points="200,268 218,256 236,268 236,292 218,304 200,292"
        fill="white" stroke="#d0dbf0" strokeWidth="2"/>
      {/* Hexagon content */}
      <circle cx="218" cy="280" r="10" fill="#5379f4" opacity="0.3"/>
      <path d="M213 280 L217 284 L224 275" stroke="#5379f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Neck */}
      <rect x="310" y="184" width="18" height="18" rx="7" fill="#a0785a"/>
      {/* Head */}
      <circle cx="319" cy="168" r="28" fill="#a0785a"/>
      {/* Dark natural hair */}
      <path d="M295 170 Q293 148 305 134 Q313 122 319 122 Q327 122 335 134 Q347 148 344 170 Q338 152 319 150 Q300 152 295 170 Z"
        fill="#2f2e41"/>

      {/* ── Sparkles ── */}
      <circle cx="420" cy="160" r="8" fill="#5379f4" opacity="0.35"/>
      <circle cx="440" cy="180" r="5" fill="#f26f37" opacity="0.45"/>
      <circle cx="408" cy="190" r="4" fill="#c8f07a" opacity="0.7"/>
      <circle cx="140" cy="340" r="6" fill="#b8e8d8" opacity="0.8"/>
      <circle cx="120" cy="320" r="4" fill="#5379f4" opacity="0.3"/>
    </svg>
  )
}

/* ── Step 3 Illustration: woman with photo frame + app UI mockup ── */
function IllusStep3() {
  return (
    <svg viewBox="0 0 520 480" style={{ width:'100%', maxWidth:560, height:'auto' }}
      fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── App UI mockup behind woman ── */}
      <rect x="80" y="100" width="200" height="260" rx="14"
        fill="white" stroke="#e4e8f0" strokeWidth="1.5"/>
      {/* App header blue */}
      <rect x="80" y="100" width="200" height="40" rx="14" fill="#5379f4"/>
      <rect x="80" y="126" width="200" height="14" fill="#5379f4"/>
      {/* App title bar content */}
      <rect x="100" y="112" width="80" height="10" rx="5" fill="white" opacity="0.6"/>
      {/* App content */}
      <rect x="100" y="156" width="160" height="12" rx="6" fill="#e0e6f4"/>
      <rect x="100" y="176" width="120" height="12" rx="6" fill="#e0e6f4"/>
      {/* App card items */}
      <rect x="100" y="200" width="160" height="36" rx="8" fill="#f7f7f7" stroke="#e4e8f0" strokeWidth="1"/>
      <circle cx="116" cy="218" r="8" fill="#5379f4" opacity="0.5"/>
      <rect x="130" y="212" width="80" height="8" rx="4" fill="#e0e6f4"/>
      <rect x="130" y="222" width="56" height="6" rx="3" fill="#e0e6f4"/>
      <rect x="100" y="244" width="160" height="36" rx="8" fill="#f7f7f7" stroke="#e4e8f0" strokeWidth="1"/>
      <circle cx="116" cy="262" r="8" fill="#f26f37" opacity="0.5"/>
      <rect x="130" y="256" width="72" height="8" rx="4" fill="#e0e6f4"/>
      <rect x="130" y="266" width="96" height="6" rx="3" fill="#e0e6f4"/>
      {/* Blue button */}
      <rect x="100" y="298" width="160" height="32" rx="8" fill="#5379f4"/>
      <rect x="140" y="310" width="80" height="8" rx="4" fill="white" opacity="0.6"/>

      {/* ── Ground ── */}
      <rect x="80" y="388" width="360" height="4" rx="2" fill="#e0e8f8"/>

      {/* ── Woman standing, blue top, dark hair, holding photo frame ── */}
      {/* Feet */}
      <ellipse cx="328" cy="388" rx="20" ry="7" fill="#2f2e41"/>
      <ellipse cx="368" cy="388" rx="18" ry="7" fill="#2f2e41"/>
      {/* Legs */}
      <rect x="320" y="336" width="16" height="54" rx="8" fill="#ffb8b8"/>
      <rect x="358" y="336" width="16" height="54" rx="8" fill="#ffb8b8"/>
      {/* Skirt */}
      <path d="M312 256 Q300 296 318 338 L378 338 Q392 296 382 256 Z" fill="#2f2e41"/>
      {/* Body - blue top */}
      <rect x="316" y="196" width="62" height="64" rx="8" fill="#5379f4"/>
      {/* Left arm holding photo frame */}
      <path d="M316 210 Q282 222 256 244 Q250 262 266 264 Q288 256 318 236 Z" fill="#5379f4"/>
      {/* Right arm */}
      <path d="M378 204 Q400 216 402 242 Q394 254 384 248 Q382 228 374 214 Z" fill="#5379f4"/>
      {/* Photo / image frame held in left hand */}
      <rect x="220" y="234" width="60" height="52" rx="6" fill="white" stroke="#d0dbf0" strokeWidth="2"/>
      {/* Frame inner image */}
      <rect x="226" y="240" width="48" height="40" rx="4" fill="#dce8ff"/>
      {/* Landscape in frame */}
      <path d="M226 270 Q242 252 258 268 Q268 256 274 270 L274 280 L226 280 Z" fill="#a8d8f0" opacity="0.7"/>
      <circle cx="254" cy="248" r="6" fill="#c8f07a" opacity="0.8"/>
      {/* Neck */}
      <rect x="338" y="179" width="18" height="20" rx="7" fill="#ffb8b8"/>
      {/* Head */}
      <circle cx="347" cy="162" r="30" fill="#ffb8b8"/>
      {/* Dark hair */}
      <path d="M321 164 Q319 140 331 124 Q340 110 347 110 Q356 110 364 124 Q376 140 374 164 Q368 146 347 144 Q326 146 321 164 Z"
        fill="#2f2e41"/>
      {/* Hair sides */}
      <path d="M321 164 Q313 176 315 194 Q324 192 326 180 Z" fill="#2f2e41"/>
      <path d="M374 164 Q382 176 380 194 Q370 192 368 180 Z" fill="#2f2e41"/>

      {/* ── Decorative elements ── */}
      <circle cx="440" cy="140" r="9" fill="#f26f37" opacity="0.4"/>
      <circle cx="456" cy="162" r="5" fill="#c8f07a" opacity="0.7"/>
      <circle cx="430" cy="166" r="4" fill="#5379f4" opacity="0.4"/>
      <circle cx="120" cy="380" r="8" fill="#a8e6d0" opacity="0.7"/>
      <circle cx="140" cy="362" r="5" fill="#f26f37" opacity="0.35"/>
      <rect x="380" y="100" width="80" height="10" rx="5" fill="#dce8ff" opacity="0.8"/>
      <rect x="390" y="116" width="60" height="10" rx="5" fill="#e4f5b0" opacity="0.7"/>
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'2.5rem 2rem', maxWidth:420, width:'100%',
        textAlign:'center', position:'relative' }}>

        {/* Orange circle with checkmark */}
        <div style={{ width:80, height:80, borderRadius:'50%', background:'#f26f37',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 1.2rem' }}>
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path d="M3 14L14 25L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ fontSize:'1.4rem', fontWeight:800, color:'#1a1a2e', marginBottom:'0.6rem', marginTop:0 }}>
          Password Reset!
        </h2>
        <p style={{ fontSize:'0.875rem', color:'#6a7380', marginBottom:'1.6rem', lineHeight:1.6, marginTop:0 }}>
          Your password has been reset successfully.
        </p>
        <button onClick={onClose} style={{ width:'100%', padding:'0.85rem', background:'#5379f4',
          color:'#fff', border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700,
          cursor:'pointer' }}>
          Back to Login
        </button>
      </div>
    </div>
  )
}

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
    if (!newPassword)                    { setError('Password is required.'); return }
    if (newPassword.length < 8)          { setError('Minimum 8 characters.'); return }
    if (!/[A-Z]/.test(newPassword))      { setError('Must include an uppercase letter.'); return }
    if (!/\d/.test(newPassword))         { setError('Must include a number.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await resetPassword({ reset_token: resetToken, new_password: newPassword })
      setShowModal(true)
    } catch (err) {
      setError(err.detail || 'Failed to reset password. Please start over.')
    } finally { setLoading(false) }
  }

  /* ── Step 1: Style B + Card LEFT + Illus RIGHT ── */
  if (step === 1) {
    return (
      <div style={{
        minHeight:'100vh', background:'#f7f7f7', position:'relative',
        overflow:'hidden', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'2rem 1.5rem',
      }}>
        <BgStyleB />
        <div style={{
          position:'relative', zIndex:2, display:'flex', alignItems:'center',
          gap:'2rem', maxWidth:1100, width:'100%',
        }}>
          {/* LEFT: Card */}
          <div style={{
            flex:'0 0 auto', width:340, background:'#dce8ff',
            borderRadius:20, padding:'2.5rem 2rem',
            boxShadow:'0 8px 40px rgba(83,121,244,0.12)',
          }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a1a2e', marginTop:0, marginBottom:'0.5rem' }}>
              Forgot Password?
            </h1>
            <p style={{ fontSize:'0.85rem', color:'#6a7380', lineHeight:1.6, marginTop:0, marginBottom:'1.4rem' }}>
              Please enter email address you use to sign in.
            </p>

            {error && (
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
                borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} noValidate>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? <><span className="spinner" /> Sending…</> : 'Send'}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:'1rem' }}>
              <Link to="/login" style={{ fontSize:'0.85rem', color:'#5379f4', fontWeight:600, textDecoration:'none' }}>
                Log in
              </Link>
            </div>
          </div>

          {/* RIGHT: Illustration */}
          <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IllusStep1 />
          </div>
        </div>
      </div>
    )
  }

  /* ── Step 2: Style B + Card LEFT + Illus RIGHT ── */
  if (step === 2) {
    return (
      <div style={{
        minHeight:'100vh', background:'#f7f7f7', position:'relative',
        overflow:'hidden', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'2rem 1.5rem',
      }}>
        <BgStyleB />
        <div style={{
          position:'relative', zIndex:2, display:'flex', alignItems:'center',
          gap:'2rem', maxWidth:1100, width:'100%',
        }}>
          {/* LEFT: Card */}
          <div style={{
            flex:'0 0 auto', width:340, background:'#dce8ff',
            borderRadius:20, padding:'2.5rem 2rem',
            boxShadow:'0 8px 40px rgba(83,121,244,0.12)',
          }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a1a2e', marginTop:0, marginBottom:'0.5rem' }}>
              Verify Email
            </h1>
            <p style={{ fontSize:'0.85rem', color:'#6a7380', lineHeight:1.6, marginTop:0, marginBottom:'1.4rem' }}>
              Please enter code sent on email address to reset your password.
            </p>

            {error && (
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
                borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} noValidate>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={labelStyle}>Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter Code"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading || otp.length < 6}
                style={btnStyle(loading || otp.length < 6)}>
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & Continue'}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:'1rem' }}>
              <button type="button"
                onClick={() => { setStep(1); setOtp(''); setError('') }}
                style={{ background:'none', border:'none', color:'#5379f4', fontSize:'0.85rem',
                  fontWeight:600, cursor:'pointer', textDecoration:'underline', padding:0 }}>
                Resend code
              </button>
            </div>
          </div>

          {/* RIGHT: Illustration */}
          <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IllusStep2 />
          </div>
        </div>
      </div>
    )
  }

  /* ── Step 3: Style A + Illus LEFT + Card RIGHT ── */
  return (
    <div style={{
      minHeight:'100vh', background:'#f7f7f7', position:'relative',
      overflow:'hidden', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'2rem 1.5rem',
    }}>
      <BgStyleA />
      <div style={{
        position:'relative', zIndex:2, display:'flex', alignItems:'center',
        gap:'2rem', maxWidth:1100, width:'100%',
      }}>
        {/* LEFT: Illustration */}
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IllusStep3 />
        </div>

        {/* RIGHT: Card */}
        <div style={{
          flex:'0 0 auto', width:400, background:'#dce8ff',
          borderRadius:20, padding:'2.5rem 2.2rem',
          boxShadow:'0 8px 40px rgba(83,121,244,0.13)',
        }}>
          <h1 style={{ fontSize:'1.7rem', fontWeight:800, color:'#1a1a2e', marginTop:0, marginBottom:'0.3rem' }}>
            Reset Password
          </h1>
          <p style={{ fontSize:'0.85rem', color:'#6a7380', marginTop:0, marginBottom:'1.4rem', lineHeight:1.5 }}>
            Set your new password
          </p>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
              borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleResetSubmit} noValidate>
            <div style={{ marginBottom:'1rem' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter Password"
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
            <div style={{ marginBottom:'1.3rem' }}>
              <label style={labelStyle}>Repeat Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw2 ? 'text' : 'password'}
                  placeholder="Enter Repeat Password"
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
        </div>
      </div>

      {showModal && (
        <SuccessModal onClose={() => navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } })} />
      )}
    </div>
  )
}

/* ── Shared micro-styles ── */
const labelStyle = {
  display:'block', fontSize:'0.85rem', fontWeight:600, color:'#1a1a2e', marginBottom:'0.4rem',
}
const inputStyle = {
  width:'100%', padding:'0.75rem 1rem', borderRadius:10,
  border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'0.92rem',
  outline:'none', boxSizing:'border-box', color:'#1a1a2e',
}
const btnStyle = (disabled) => ({
  width:'100%', padding:'0.85rem', background:'#5379f4', color:'#fff',
  border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.65 : 1, transition:'background 0.18s',
  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
})
