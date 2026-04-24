import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, saveToken } from '../services/api'

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

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

/* ── Sign-In Illustration (LEFT) ── */
function IllusSignIn() {
  return (
    <svg
      viewBox="0 0 520 480"
      style={{ width:'100%', maxWidth:560, height:'auto' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Orange door/window frame ── */}
      <rect x="190" y="100" width="130" height="180" rx="8" fill="#f26f37" opacity="0.15"/>
      <rect x="190" y="100" width="130" height="180" rx="8"
        stroke="#f26f37" strokeWidth="4" fill="none"/>
      {/* Door panels */}
      <rect x="200" y="115" width="50" height="70" rx="4" fill="#f26f37" opacity="0.2"/>
      <rect x="258" y="115" width="52" height="70" rx="4" fill="#f26f37" opacity="0.2"/>
      <rect x="200" y="194" width="110" height="76" rx="4" fill="#f26f37" opacity="0.15"/>
      {/* Door handle */}
      <circle cx="248" cy="230" r="5" fill="#f26f37"/>

      {/* ── Ground line ── */}
      <rect x="80" y="278" width="360" height="4" rx="2" fill="#e0e8f8"/>

      {/* ── Woman sitting cross-legged at base of door ── */}
      {/* Legs (cross-legged) */}
      <path d="M230 278 Q220 268 210 262 Q200 256 215 252 Q230 250 240 264 Z" fill="#ffb8b8"/>
      <path d="M270 278 Q280 268 290 262 Q300 256 285 252 Q270 250 260 264 Z" fill="#ffb8b8"/>
      {/* Body - blue outfit */}
      <rect x="233" y="220" width="54" height="52" rx="10" fill="#5379f4"/>
      {/* Left arm */}
      <path d="M233 232 Q218 240 212 255 Q216 262 224 258 Q233 248 238 236 Z" fill="#5379f4"/>
      {/* Right arm */}
      <path d="M287 232 Q302 240 308 255 Q304 262 296 258 Q287 248 282 236 Z" fill="#5379f4"/>
      {/* Hands */}
      <ellipse cx="210" cy="258" rx="8" ry="7" fill="#ffb8b8"/>
      <ellipse cx="306" cy="258" rx="8" ry="7" fill="#ffb8b8"/>
      {/* Neck */}
      <rect x="251" y="205" width="18" height="18" rx="7" fill="#ffb8b8"/>
      {/* Head */}
      <circle cx="260" cy="188" r="30" fill="#ffb8b8"/>
      {/* Dark hair */}
      <path d="M234 188 Q232 164 244 148 Q254 134 260 134 Q268 134 276 148 Q288 164 286 188 Q280 170 260 168 Q240 170 234 188 Z"
        fill="#2f2e41"/>
      {/* Hair sides */}
      <path d="M234 188 Q228 198 230 212 Q238 208 240 198 Z" fill="#2f2e41"/>
      <path d="M286 188 Q292 198 290 212 Q282 208 280 198 Z" fill="#2f2e41"/>

      {/* ── Abstract blue blob character at door ── */}
      {/* Main blob body */}
      <ellipse cx="370" cy="190" rx="58" ry="72" fill="#7b9ef0" opacity="0.85"/>
      {/* Blob head/top */}
      <ellipse cx="370" cy="130" rx="38" ry="35" fill="#7b9ef0"/>
      {/* Blob arms */}
      <ellipse cx="320" cy="200" rx="18" ry="12" fill="#7b9ef0" opacity="0.8"
        transform="rotate(-30 320 200)"/>
      <ellipse cx="420" cy="195" rx="18" ry="12" fill="#7b9ef0" opacity="0.8"
        transform="rotate(30 420 195)"/>
      {/* Blob eyes */}
      <ellipse cx="360" cy="124" rx="5" ry="6" fill="#fff"/>
      <ellipse cx="380" cy="124" rx="5" ry="6" fill="#fff"/>
      <circle cx="361" cy="125" r="3" fill="#2f2e41"/>
      <circle cx="381" cy="125" r="3" fill="#2f2e41"/>
      {/* Blob smile */}
      <path d="M358 138 Q370 146 382 138" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Blob legs */}
      <ellipse cx="350" cy="262" rx="16" ry="28" fill="#7b9ef0" opacity="0.9"/>
      <ellipse cx="390" cy="262" rx="16" ry="28" fill="#7b9ef0" opacity="0.9"/>
      {/* Blob feet */}
      <ellipse cx="346" cy="278" rx="20" ry="8" fill="#5b7ee0"/>
      <ellipse cx="394" cy="278" rx="20" ry="8" fill="#5b7ee0"/>

      {/* ── Decorative leaf shapes ── */}
      <path d="M130 160 Q118 140 138 130 Q150 140 130 160 Z" fill="#a8e6d0" opacity="0.8"/>
      <path d="M118 170 Q106 150 126 140 Q138 150 118 170 Z" fill="#c8f07a" opacity="0.7"/>
      <path d="M440 320 Q460 305 468 320 Q460 340 440 320 Z" fill="#a8e6d0" opacity="0.8"/>
      <path d="M455 330 Q475 315 483 330 Q475 350 455 330 Z" fill="#c8f07a" opacity="0.6"/>

      {/* ── Small floating blue shapes ── */}
      <circle cx="150" cy="320" r="12" fill="#7b9ef0" opacity="0.5"/>
      <rect x="120" y="240" width="20" height="20" rx="5" fill="#5379f4" opacity="0.3"
        transform="rotate(20 120 240)"/>
      <circle cx="460" cy="140" r="8" fill="#5379f4" opacity="0.4"/>
      <rect x="470" y="240" width="16" height="16" rx="4" fill="#7b9ef0" opacity="0.4"
        transform="rotate(-15 470 240)"/>
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

/* ── Google Icon ── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

/* ── LinkedIn Icon ── */
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

export function LoginPage() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const successMsg   = location.state?.message || ''

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [keepMe,  setKeepMe]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [apiErr,  setApiErr]  = useState('')
  const [loading, setLoading] = useState(false)

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })); setApiErr('') }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.email)    errs.email    = 'Email is required.'
    if (!form.password) errs.password = 'Password is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setApiErr('')
    try {
      const data = await login({ email: form.email, password: form.password })
      saveToken(data.access_token)
      navigate(ROLE_REDIRECT[data.role] || '/', { replace: true })
    } catch (err) {
      if (err.status === 403) setApiErr('Your email is not verified. Please check your inbox.')
      else setApiErr(err.detail || 'Invalid email or password.')
    } finally { setLoading(false) }
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

      <BgStyleA />

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

        {/* ── LEFT: Illustration ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IllusSignIn />
        </div>

        {/* ── RIGHT: Card ── */}
        <div style={{
          flex:         '0 0 auto',
          width:        400,
          background:   '#dce8ff',
          borderRadius: 20,
          padding:      '2.5rem 2.2rem',
          boxShadow:    '0 8px 40px rgba(83,121,244,0.13)',
        }}>

          <h1 style={{ fontSize:'1.7rem', fontWeight:800, color:'#1a1a2e', marginBottom:'0.3rem', marginTop:0 }}>
            Welcome Back
          </h1>
          <p style={{ fontSize:'0.85rem', color:'#6a7380', marginBottom:'1.4rem', marginTop:0, lineHeight:1.5 }}>
            Please login to continue to your account.
          </p>

          {successMsg && (
            <div style={{ background:'#dcfce7', border:'1px solid #86efac', color:'#166534',
              borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
              {successMsg}
            </div>
          )}
          {apiErr && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
              borderRadius:8, padding:'0.55rem 0.8rem', fontSize:'0.82rem', marginBottom:'0.9rem' }}>
              {apiErr}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                placeholder="Enter Email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.email ? '#ef4444' : '#d0dbf0' }}
              />
              {errors.email && <p style={errStyle}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:'0.8rem' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.password ? '#ef4444' : '#d0dbf0', paddingRight:'2.5rem' }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:'0.8rem', top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#6a7380', padding:0, display:'flex' }}>
                  {showPw ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {errors.password && <p style={errStyle}>{errors.password}</p>}
            </div>

            {/* Keep logged in + Forgot password row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.3rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.45rem', cursor:'pointer',
                fontSize:'0.84rem', color:'#1a1a2e', userSelect:'none' }}>
                <input
                  type="checkbox"
                  checked={keepMe}
                  onChange={e => setKeepMe(e.target.checked)}
                  style={{ width:15, height:15, accentColor:'#5379f4', cursor:'pointer' }}
                />
                Keep me logged in
              </label>
              <Link to="/forgot-password"
                style={{ fontSize:'0.84rem', color:'#5379f4', fontWeight:600, textDecoration:'none' }}>
                Forgot Password?
              </Link>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%', padding:'0.85rem', background:'#5379f4', color:'#fff',
                border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
                marginBottom:'1rem', transition:'background 0.18s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3f5ee0' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* "or" divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'0 0 1rem', color:'#6a7380', fontSize:'0.82rem' }}>
            <div style={{ flex:1, height:1, background:'#c0cde8' }} />
            or
            <div style={{ flex:1, height:1, background:'#c0cde8' }} />
          </div>

          {/* SSO buttons */}
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.2rem' }}>
            <button type="button" style={ssoBtnStyle}>
              <LinkedInIcon />
              Sign in with Linked In
            </button>
            <button type="button" style={ssoBtnStyle}>
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>

          {/* Register link */}
          <div style={{ textAlign:'center', fontSize:'0.85rem', color:'#6a7380' }}>
            Need an account?{' '}
            <Link to="/register" style={{ color:'#5379f4', fontWeight:600, textDecoration:'none' }}>
              Create One
            </Link>
          </div>
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
  border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'0.92rem',
  outline:'none', boxSizing:'border-box', color:'#1a1a2e',
}
const errStyle = { fontSize:'0.78rem', color:'#ef4444', marginTop:'0.3rem' }
const ssoBtnStyle = {
  flex:1, background:'#fff', border:'1.5px solid #d0dbf0', borderRadius:10,
  padding:'0.6rem 0.5rem', display:'flex', alignItems:'center', justifyContent:'center',
  gap:'0.4rem', color:'#1a1a2e', fontSize:'0.78rem', fontWeight:500, cursor:'pointer',
  whiteSpace:'nowrap',
}
