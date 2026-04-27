import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, saveToken } from '../services/api'
import illusSignin  from '../assets/illus-signin.svg'
import iconLinkedin from '../assets/icon-linkedin.svg'
import iconGoogle   from '../assets/icon-google.svg'

const font = "'Urbanist', sans-serif"

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

/* ── Eye icons ── */
const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export function LoginPage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const successMsg = location.state?.message || ''

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [keepMe,  setKeepMe]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [apiErr,  setApiErr]  = useState('')
  const [loading, setLoading] = useState(false)

  function set(f, v) {
    setForm(p    => ({ ...p, [f]: v }))
    setErrors(p  => ({ ...p, [f]: '' }))
    setApiErr('')
  }

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
      background:  '#fbfbfb',
      minHeight:   '100vh',
      position:    'relative',
      overflow:    'hidden',
      fontFamily:  font,
    }}>

      {/* ── Illustration (full-page background, matches Figma 1440×1024 frame) ── */}
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        justifyContent: 'center',
        pointerEvents:  'none',
        overflow:       'hidden',
        zIndex:         0,
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 1440, flexShrink: 0 }}>
          {/* Positioned exactly as Figma: left:-131px, top:-255px, w:1700px, h:1495px */}
          <div style={{
            position: 'absolute',
            left:     -131,
            top:      -255,
            width:    1700,
            height:   1495,
          }}>
            <img
              src={illusSignin}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            />
          </div>
        </div>
      </div>

      {/* ── Card — right side, vertically centered ── */}
      {/* On 1440px: card center X = 50% + 270.5px = 990.5px, centered vertically */}
      <div style={{
        position:       'relative',
        zIndex:         2,
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'flex-end',
        padding:        '2rem max(5%, calc(50% - 720px + 178px)) 2rem 0',
      }}>
        <div style={{
          width:              551,
          maxWidth:           '90vw',
          background:         'rgba(230,241,255,0.94)',
          backdropFilter:     'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          borderRadius:       16,
          padding:            32,
          display:            'flex',
          flexDirection:      'column',
          gap:                32,
          marginRight:        'max(40px, calc(50% - 720px + 178px))',
        }}>

          {/* ── Header ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center',
            textAlign:'center', lineHeight:1.3 }}>
            <p style={{ fontFamily:font, fontSize:34, fontWeight:700, color:'#343434',
              margin:0, whiteSpace:'nowrap' }}>
              Welcome Back
            </p>
            <p style={{ fontFamily:font, fontSize:18, fontWeight:500, color:'#6a7380',
              margin:0, lineHeight:1.3 }}>
              Please login to continue to your account.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Alerts */}
            {successMsg && (
              <div style={{ background:'#dcfce7', border:'1px solid #86efac', color:'#166534',
                borderRadius:8, padding:'0.55rem 0.8rem', fontSize:14, fontFamily:font }}>
                {successMsg}
              </div>
            )}
            {apiErr && (
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
                borderRadius:8, padding:'0.55rem 0.8rem', fontSize:14, fontFamily:font }}>
                {apiErr}
              </div>
            )}

            {/* Fields */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Email */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <label style={{ fontFamily:font, fontSize:16, fontWeight:700, color:'#343434', lineHeight:1.3 }}>
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  style={{
                    height:56, padding:'16px 20px',
                    border:`1px solid ${errors.email ? '#ef4444' : '#6a7380'}`,
                    borderRadius:12, background:'#fff',
                    fontFamily:font, fontSize:16, fontWeight:400, color:'#343434',
                    outline:'none', boxSizing:'border-box', width:'100%', lineHeight:1.3,
                  }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
                  onBlur={e  => { e.target.style.boxShadow = 'none' }}
                />
                {errors.email && (
                  <p style={{ color:'#ef4444', fontSize:13, margin:0, fontFamily:font }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <label style={{ fontFamily:font, fontSize:16, fontWeight:700, color:'#343434', lineHeight:1.3 }}>
                  Password
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    style={{
                      height:56, padding:'16px 48px 16px 20px',
                      border:`1px solid ${errors.password ? '#ef4444' : '#6a7380'}`,
                      borderRadius:12, background:'#fff',
                      fontFamily:font, fontSize:16, fontWeight:400, color:'#343434',
                      outline:'none', boxSizing:'border-box', width:'100%', lineHeight:1.3,
                    }}
                    onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
                    onBlur={e  => { e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', cursor:'pointer', padding:0,
                      display:'flex', alignItems:'center', color:'#6a7380' }}>
                    {showPw ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ color:'#ef4444', fontSize:13, margin:0, fontFamily:font }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Keep logged in + Forgot password */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer',
                  fontFamily:font, fontSize:16, fontWeight:400, color:'#343434',
                  userSelect:'none', lineHeight:1.3 }}>
                  <input
                    type="checkbox"
                    checked={keepMe}
                    onChange={e => setKeepMe(e.target.checked)}
                    style={{ width:24, height:24, accentColor:'#5379f4', cursor:'pointer', flexShrink:0 }}
                  />
                  Keep me logged in
                </label>
                <Link to="/forgot-password"
                  style={{ fontFamily:font, fontSize:16, fontWeight:600, color:'#403c8b',
                    textDecoration:'underline', textDecorationSkipInk:'none', lineHeight:1.3 }}>
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width:'100%', height:53,
                  background:'#5379f4', color:'#fff',
                  border:'none', borderRadius:12,
                  fontFamily:font, fontSize:16, fontWeight:600, lineHeight:1.3,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  boxShadow:'0 4px 13.6px 0 #97b6fd',
                  transition:'background 0.18s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>

            {/* OR divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'#c1c1c8' }} />
              <span style={{ fontFamily:font, fontSize:16, fontWeight:700,
                color:'#6a7380', lineHeight:1.3 }}>or</span>
              <div style={{ flex:1, height:1, background:'#c1c1c8' }} />
            </div>

            {/* SSO buttons */}
            <div style={{ display:'flex', gap:16, alignItems:'center', justifyContent:'center' }}>
              <button
                type="button"
                style={ssoBtnStyle}
                onClick={() => { window.location.href = 'http://localhost:8000/auth/linkedin?role=candidate' }}
              >
                <img src={iconLinkedin} alt="LinkedIn" style={{ width:24, height:24, flexShrink:0 }} />
                <span style={{ fontFamily:font, fontSize:16, fontWeight:600, color:'#403c8b', lineHeight:1.3 }}>
                  Sign in with Linked In
                </span>
              </button>
              <button
                type="button"
                style={ssoBtnStyle}
                onClick={() => { window.location.href = 'http://localhost:8000/auth/google?role=candidate' }}
              >
                <img src={iconGoogle} alt="Google" style={{ width:24, height:24, flexShrink:0 }} />
                <span style={{ fontFamily:font, fontSize:16, fontWeight:600, color:'#403c8b', lineHeight:1.3 }}>
                  Sign in with Google
                </span>
              </button>
            </div>

            {/* Register link */}
            <div style={{ display:'flex', gap:4, alignItems:'flex-start', justifyContent:'center',
              lineHeight:1.3, whiteSpace:'nowrap' }}>
              <span style={{ fontFamily:font, fontSize:16, fontWeight:400, color:'#6a7380' }}>
                Need an account?
              </span>
              <Link to="/register"
                style={{ fontFamily:font, fontSize:16, fontWeight:600, color:'#403c8b',
                  textDecoration:'underline', textDecorationSkipInk:'none' }}>
                Create One
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

/* ── SSO button base style ── */
const ssoBtnStyle = {
  background:    '#fff',
  border:        '1px solid #403c8b',
  borderRadius:  12,
  height:        56,
  padding:       '16px 24px',
  display:       'flex',
  alignItems:    'center',
  justifyContent:'center',
  gap:           16,
  cursor:        'pointer',
  flexShrink:    0,
  flexGrow:      1,
  transition:    'opacity 0.15s',
}
