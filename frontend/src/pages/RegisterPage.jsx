import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register, saveToken } from '../services/api'
import illusRegister from '../assets/illus-register.svg'

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const role = params.get('role') || 'candidate'

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', terms: false })
  const [showPw,  setShowPw]  = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())                      { setError('Full name is required.'); return }
    if (!form.email)                            { setError('Email is required.'); return }
    if (form.password.length < 8)              { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(form.password))          { setError('Password must include an uppercase letter.'); return }
    if (!/\d/.test(form.password))             { setError('Password must include a number.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (!form.terms)                            { setError('Please accept the terms and conditions.'); return }

    setLoading(true); setError('')
    try {
      // FIX: field is `name` not `full_name` (matches backend RegisterRequest schema)
      const data = await register({
        name:  form.name.trim(),
        email: form.email,
        password: form.password,
        role,
      })

      // Dev mode: SKIP_EMAIL_VERIFICATION=true on backend auto-verifies and returns a token
      if (data.skip_otp && data.access_token) {
        saveToken(data.access_token)
        navigate(ROLE_REDIRECT[data.role] || '/dashboard', { replace: true })
      } else {
        // Normal flow: go to OTP verification page
        navigate('/verify-otp', { state: { email: form.email } })
      }
    } catch (err) {
      setError(err.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const eyeIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
  const eyeOffIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f9f9f9', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>

      {/* ── Background blobs ── */}
      <div style={{ position:'absolute', top:-70,  right:-90,  width:340, height:300, borderRadius:'50%', background:'#e6f1ff', opacity:0.9, zIndex:0 }} />
      <div style={{ position:'absolute', top:10,   right:70,   width:170, height:150, borderRadius:'50%', background:'#f4f68b', opacity:0.65, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:-70, left:-90, width:330, height:290, borderRadius:'50%', background:'#e6f1ff', opacity:0.85, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:20,  left:50,  width:160, height:140, borderRadius:'50%', background:'#f4f68b', opacity:0.5,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'8%',  left:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7, zIndex:0 }} />
      <div style={{ position:'absolute', top:'13%', left:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6, zIndex:0 }} />
      <div style={{ position:'absolute', top:'6%',  left:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55,zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'10%', right:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'16%', right:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6, zIndex:0 }} />

      {/* ── Card ── */}
      <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'stretch', background:'#fff', borderRadius:20, boxShadow:'0 8px 40px rgba(83,121,244,0.13)', overflow:'hidden', width:'100%', maxWidth:860, margin:'1.5rem' }}>

        {/* Left: illustration */}
        <div style={{ flex:'0 0 340px', background:'linear-gradient(160deg,#eef2ff 0%,#f0f7ff 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2.5rem 2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2rem', alignSelf:'flex-start' }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'#5379f4', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.95rem', flexShrink:0 }}>T</div>
            <span style={{ fontWeight:700, fontSize:'1.05rem', color:'#1a1a2e' }}>Tradie Migration</span>
          </div>
          {illusRegister
            ? <img src={illusRegister} alt="" style={{ width:'100%', maxWidth:240, height:'auto' }} />
            : (
              <svg viewBox="0 0 240 280" width="220" height="260" fill="none">
                <ellipse cx="120" cy="180" rx="90" ry="70" fill="#e6f1ff" opacity="0.8"/>
                <rect x="55" y="100" width="130" height="100" rx="14" fill="#fff" stroke="#d0dff0" strokeWidth="1.5"/>
                <rect x="75" y="120" width="80" height="9" rx="4.5" fill="#5379f4" opacity="0.7"/>
                <rect x="75" y="136" width="90" height="6" rx="3" fill="#d0dff0"/>
                <rect x="75" y="149" width="70" height="6" rx="3" fill="#d0dff0"/>
                <circle cx="120" cy="68" r="28" fill="#ffb8b8"/>
                <ellipse cx="120" cy="48" rx="20" ry="11" fill="#2f2e41"/>
              </svg>
            )
          }
          <p style={{ fontSize:'0.82rem', color:'#6a7380', textAlign:'center', lineHeight:1.6, marginTop:'1.5rem' }}>
            Join thousands of skilled tradespeople connecting with Australian employers.
          </p>
        </div>

        {/* Right: form */}
        <div style={{ flex:1, padding:'2.5rem 2.25rem', overflowY:'auto' }}>

          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a1a2e', marginBottom:'0.3rem' }}>
            Create your account
          </h1>
          <p style={{ fontSize:'0.84rem', color:'#6a7380', marginBottom:'1.4rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#5379f4', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
          </p>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c', borderRadius:8, padding:'0.6rem 0.85rem', fontSize:'0.83rem', marginBottom:'1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:600, color:'#1a1a2e', marginBottom:'0.4rem' }}>Full name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:10, border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#1a1a2e' }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:600, color:'#1a1a2e', marginBottom:'0.4rem' }}>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:10, border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#1a1a2e' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:600, color:'#1a1a2e', marginBottom:'0.4rem' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  style={{ width:'100%', padding:'0.75rem 2.8rem 0.75rem 1rem', borderRadius:10, border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#1a1a2e' }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:'0.85rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:0 }}>
                  {showPw ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom:'1.1rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', fontWeight:600, color:'#1a1a2e', marginBottom:'0.4rem' }}>Confirm password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showCpw ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  style={{ width:'100%', padding:'0.75rem 2.8rem 0.75rem 1rem', borderRadius:10, border:'1.5px solid #d0dbf0', background:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', color:'#1a1a2e' }}
                />
                <button type="button" onClick={() => setShowCpw(p => !p)}
                  style={{ position:'absolute', right:'0.85rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:0 }}>
                  {showCpw ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:'0.55rem', marginBottom:'1.3rem' }}>
              <input
                type="checkbox"
                id="terms"
                checked={form.terms}
                onChange={e => set('terms', e.target.checked)}
                style={{ marginTop:2, accentColor:'#5379f4', width:15, height:15, cursor:'pointer', flexShrink:0 }}
              />
              <label htmlFor="terms" style={{ fontSize:'0.85rem', color:'#444', cursor:'pointer', lineHeight:1.4 }}>
                I accept the terms and conditions.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width:'100%', padding:'0.85rem', background: loading ? '#93a8f4' : '#5379f4', color:'#fff', border:'none', borderRadius:10, fontSize:'0.95rem', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom:'1rem', transition:'background 0.18s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3f5ee0' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#5379f4' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', margin:'0.5rem 0 1rem' }}>
              <div style={{ flex:1, height:1, background:'#e8ecf0' }} />
              <span style={{ fontSize:'0.78rem', color:'#9ba3af' }}>or continue with</span>
              <div style={{ flex:1, height:1, background:'#e8ecf0' }} />
            </div>

            {/* SSO buttons */}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="button"
                onClick={() => { window.location.href = `http://localhost:8000/auth/google?role=${role}` }}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.65rem', border:'1.5px solid #e0e0e0', borderRadius:10, background:'#fff', fontSize:'0.85rem', fontWeight:500, color:'#444', cursor:'pointer', transition:'border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button type="button"
                onClick={() => { window.location.href = `http://localhost:8000/auth/linkedin?role=${role}` }}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.65rem', border:'1.5px solid #e0e0e0', borderRadius:10, background:'#fff', fontSize:'0.85rem', fontWeight:500, color:'#444', cursor:'pointer', transition:'border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A66C2' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                LinkedIn
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}