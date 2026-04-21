import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, saveToken } from '../services/api'

/*
  Figma Sign In page — node 41:4237
  Colors: skin #ffb8b8 | dark-navy #2f2e41 | outfit #3f3d56
          orange #f26f37 | blue #5379f4 | bubble-fill #e6e6e6
*/

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

/* ── Sign-In Illustration ── */
function IllusRight() {
  return (
    <svg
      viewBox="0 0 580 470"
      style={{ width: '100%', maxWidth: 680, height: 'auto' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Lock bubble (left) ── */}
      <ellipse cx="152" cy="183" rx="120" ry="108"
        fill="#e6e6e6" stroke="#3d3b4f" strokeWidth="1.6" strokeDasharray="5 4"/>
      <ellipse cx="84" cy="300" rx="36" ry="27"
        fill="#e6e6e6" stroke="#3d3b4f" strokeWidth="1.6" strokeDasharray="5 4"/>

      {/* Padlock inside bubble */}
      <rect x="112" y="159" width="80" height="58" rx="10" fill="#5379f4" opacity="0.92"/>
      <path d="M126 159 Q126 136 152 136 Q178 136 178 159"
        stroke="#5379f4" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <circle cx="152" cy="189" r="9" fill="white"/>
      <rect x="148" y="189" width="8" height="14" rx="4" fill="white"/>

      {/* Small USB / tablet below appendage */}
      <rect x="58"  y="335" width="54" height="19" rx="7" fill="#d0d0d0"/>
      <rect x="46"  y="350" width="78" height="12" rx="5" fill="#c4c4c4"/>

      {/* ── Login card (bottom-right) ── */}
      <rect x="282" y="374" width="298" height="142" rx="13"
        fill="white" stroke="#e4e8f0" strokeWidth="1.5"/>
      {/* Blue header */}
      <rect x="282" y="374" width="298" height="36" rx="13" fill="#5379f4"/>
      <rect x="282" y="392" width="298" height="18" fill="#5379f4"/>
      {/* Dots */}
      <circle cx="306" cy="392" r="6" fill="white" opacity="0.7"/>
      <circle cx="325" cy="392" r="6" fill="white" opacity="0.5"/>
      <circle cx="344" cy="392" r="6" fill="white" opacity="0.35"/>
      {/* Input rows */}
      <rect x="306" y="422" width="198" height="11" rx="5" fill="#e6e6e6"/>
      <rect x="306" y="439" width="198" height="11" rx="5" fill="#e6e6e6"/>
      {/* Orange sign-in button */}
      <rect x="306" y="458" width="100" height="11" rx="5" fill="#f26f37" opacity="0.9"/>
      {/* Small key icon */}
      <circle cx="468" cy="463" r="6" stroke="#5379f4" strokeWidth="1.8" fill="none"/>
      <rect x="467" y="469" width="2.5" height="8" rx="1.2" fill="#5379f4"/>
      <rect x="467" y="474" width="5" height="2" rx="1" fill="#5379f4"/>
      <rect x="467" y="478" width="4" height="2" rx="1" fill="#5379f4"/>

      {/* ── Woman figure ── */}

      {/* Feet / shoes */}
      <ellipse cx="370" cy="385" rx="24" ry="9" fill="#2f2e41"/>
      <ellipse cx="416" cy="385" rx="22" ry="9" fill="#2f2e41"/>

      {/* Bare peach legs */}
      <rect x="358" y="312" width="22" height="75" rx="11" fill="#ffb8b8"/>
      <rect x="401" y="312" width="22" height="75" rx="11" fill="#ffb8b8"/>

      {/* Long dark skirt */}
      <path d="M350 210 Q337 268 352 314 L434 314 Q446 268 436 210 Z"
        fill="#2f2e41"/>

      {/* Body / top */}
      <rect x="355" y="143" width="68" height="72" rx="9" fill="#3f3d56"/>

      {/* Left arm → key card */}
      <path d="M355 164 Q318 172 284 192 Q277 214 295 216 Q320 210 358 186 Z"
        fill="#3f3d56"/>

      {/* Right arm → side */}
      <path d="M423 158 Q448 170 452 200 Q443 215 433 210 Q431 191 423 173 Z"
        fill="#3f3d56"/>

      {/* Orange key card (left hand) */}
      <rect x="256" y="185" width="50" height="38" rx="6" fill="#f26f37"/>
      <rect x="262" y="193" width="14" height="14" rx="3" fill="white" opacity="0.6"/>
      <rect x="280" y="196" width="20" height="4" rx="2" fill="white" opacity="0.5"/>
      <rect x="280" y="204" width="14" height="4" rx="2" fill="white" opacity="0.4"/>
      {/* Key icon on card */}
      <circle cx="269" cy="200" r="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8"/>
      <rect x="268" y="205" width="2.5" height="6" rx="1" fill="white" opacity="0.8"/>

      {/* Blue shield badge (right hand area) */}
      <path d="M440 188 Q440 174 452 174 Q464 174 464 188 L464 202 Q464 210 452 214 Q440 210 440 202 Z"
        fill="#5379f4"/>
      <path d="M447 196 L451 200 L458 191"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* Neck */}
      <rect x="374" y="126" width="21" height="22" rx="8" fill="#ffb8b8"/>

      {/* Head */}
      <circle cx="384" cy="96" r="42" fill="#ffb8b8"/>

      {/* Hair cap dome */}
      <path d="M 346 96 Q 344 66 356 46 Q 369 24 384 24 Q 401 24 414 44 Q 427 64 424 96
               Q 416 74 384 72 Q 352 74 346 96 Z"
        fill="#2f2e41"/>

      {/* High ponytail sweeping right */}
      <path d="M 416 88 C 444 54 512 28 560 44 C 582 54 582 80 562 94
               C 530 110 462 100 420 84 Z"
        fill="#2f2e41"/>

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

export function LoginPage() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const successMsg   = location.state?.message || ''

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
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
      {/* green dots top-left */}
      <div style={{ position:'absolute', top:'8%',  left:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'13%', left:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'6%',  left:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55, zIndex:0 }} />
      <div style={{ position:'absolute', top:'17%', left:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5,  zIndex:0 }} />
      {/* green dots bottom-right */}
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

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.55rem', marginBottom:'1.4rem' }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'#5379f4',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontWeight:800, fontSize:'1rem', flexShrink:0 }}>T</div>
            <span style={{ fontWeight:700, fontSize:'1.05rem', color:'#232323' }}>Tradie Migration</span>
          </div>

          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#343434', marginBottom:'0.35rem' }}>
            Sign In
          </h1>
          <p style={{ fontSize:'0.84rem', color:'#6a7380', marginBottom:'1.4rem', lineHeight:1.5 }}>
            Access your Tradie Migration account
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

          {/* SSO buttons */}
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.1rem' }}>
            <button type="button" style={ssoBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" style={ssoBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'1.1rem 0', color:'#6a7380', fontSize:'0.82rem' }}>
            <div style={{ flex:1, height:1, background:'#c1c1c8' }} />
            or sign in with email
            <div style={{ flex:1, height:1, background:'#c1c1c8' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.email ? '#ef4444' : '#c8d4f0' }}
              />
              {errors.email && <p style={errStyle}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:'0.6rem' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.password ? '#ef4444' : '#c8d4f0', paddingRight:'2.5rem' }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:'0.8rem', top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#6a7380', padding:0, display:'flex' }}>
                  {showPw ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {errors.password && <p style={errStyle}>{errors.password}</p>}
            </div>

            {/* Forgot link */}
            <div style={{ textAlign:'right', marginBottom:'1.2rem' }}>
              <Link to="/forgot-password"
                style={{ fontSize:'0.83rem', color:'#5379f4', fontWeight:500, textDecoration:'none' }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
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

          <div style={{ textAlign:'center', fontSize:'0.85rem', color:'#6a7380' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#5379f4', fontWeight:600, textDecoration:'none' }}>
              Create one
            </Link>
          </div>
        </div>

        {/* ── Illustration ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', overflow:'hidden' }}>
          <IllusRight />
        </div>
      </div>
    </div>
  )
}

/* ── Shared micro-styles ── */
const labelStyle = {
  display:'block', fontSize:'0.85rem', fontWeight:600, color:'#343434', marginBottom:'0.4rem',
}
const inputStyle = {
  width:'100%', padding:'0.82rem 1rem', borderRadius:10,
  border:'1.5px solid #c8d4f0', background:'#fff', fontSize:'0.92rem',
  outline:'none', boxSizing:'border-box', color:'#343434',
}
const errStyle = { fontSize:'0.78rem', color:'#ef4444', marginTop:'0.3rem' }
const ssoBtn = {
  flex:1, background:'#fff', border:'1.5px solid #c8d4f0', borderRadius:10,
  padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'center',
  gap:'0.45rem', color:'#343434', fontSize:'0.85rem', fontWeight:500, cursor:'pointer',
}
