import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/api'

import illusForgotPw     from '../assets/illus-forgot-pw.svg'
import illusAuth         from '../assets/illus-auth.png'
import illusFittingBig   from '../assets/illus-fitting-piece-big.png'
import illusResetPwBg    from '../assets/illus-reset-pw-bg.png'
import iconInfoCircle    from '../assets/icon-info-circle.svg'
import cornerBL          from '../assets/corner-bl-fp.svg'
import cornerTR          from '../assets/corner-tr-fp.svg'
import confettiGroup     from '../assets/confetti-group-fp.svg'
import confettiGroup1    from '../assets/confetti-group1-fp.svg'
import confettiGroup2    from '../assets/confetti-group2-fp.svg'
import confettiGroup3    from '../assets/confetti-group3-fp.svg'

const font = "'Urbanist', sans-serif"

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

/* ── Success Modal (Step 5) ── */
function SuccessModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(53,53,53,0.63)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '1rem',
    }}>
      <div style={{
        background: 'rgba(230,241,255,0.94)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        borderRadius: 16, padding: 32,
        width: 551, maxWidth: '90vw',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 32,
        alignItems: 'center',
      }}>
        <img src={confettiGroup}  alt="" style={{ position: 'absolute', top: 0, left: 0,    width: 120, pointerEvents: 'none' }} />
        <img src={confettiGroup1} alt="" style={{ position: 'absolute', top: 0, right: 0,   width: 120, pointerEvents: 'none' }} />
        <img src={confettiGroup2} alt="" style={{ position: 'absolute', bottom: 0, left: 0,  width: 100, pointerEvents: 'none' }} />
        <img src={confettiGroup3} alt="" style={{ position: 'absolute', bottom: 0, right: 0, width: 100, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', background: '#f26f37',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
              <path d="M3 16L15 28L37 4" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: '#343434', margin: 0, lineHeight: 1.3 }}>
            Password updated successfully!
          </p>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 500, color: '#6a7380', margin: 0, lineHeight: 1.3 }}>
            Your account is now secure. You can use your new password to sign in and access your professional ecosystem.
          </p>
        </div>

        <button onClick={onClose} style={{
          width: '100%', height: 53, background: '#5379f4', color: '#fff',
          border: 'none', borderRadius: 12,
          fontFamily: font, fontSize: 16, fontWeight: 600,
          cursor: 'pointer', position: 'relative', zIndex: 1,
          boxShadow: '0 4px 13.6px 0 #97b6fd', lineHeight: 1.3,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4264d6' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
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
    try { await forgotPassword({ email }) } catch { /* no enumeration */ }
    finally { setLoading(false); setStep(2) }
  }

  async function handleOtpSubmit() {
    if (otp.length < 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const data = await verifyResetOtp({ email, otp_code: otp })
      setResetToken(data.access_token)
      setStep(4)
    } catch (err) {
      setError(err.detail || 'Invalid or expired code.')
    } finally { setLoading(false) }
  }

  async function handleResetSubmit() {
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

  /* ════════════════════════════════════════════════════════
     STEP 1 — Enter email   (Card LEFT, Illustration RIGHT)
  ════════════════════════════════════════════════════════ */
  if (step === 1) return (
    <div style={{ background: '#fbfbfb', minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: font }}>
      {/* BG corners — exact Figma sizes: TR 446×401, BL 368×396 */}
      <img src={cornerBL} alt="" style={{ position: 'absolute', bottom: 0, left: 0,  width: 368, height: 396, pointerEvents: 'none', zIndex: 0 }} />
      <img src={cornerTR} alt="" style={{ position: 'absolute', top: 0,    right: 0, width: 446, height: 401, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '2rem auto', padding: '0 60px', display: 'flex', alignItems: 'center', gap: '3rem' }}>
          {/* Card LEFT — 551px */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              <p style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: '#343434', margin: 0, lineHeight: 1.3 }}>
                Forgot Password?
              </p>
              <p style={{ fontFamily: font, fontSize: 18, fontWeight: 500, color: '#6a7380', margin: 0, lineHeight: 1.3 }}>
                Please enter the email address you use to sign in.
              </p>
            </div>
            {error && <ErrorBox msg={error} />}
            <form onSubmit={handleEmailSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Email address">
                <input
                  type="email" placeholder="Enter Email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  style={iStyle}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
                  onBlur={e  => { e.target.style.boxShadow = 'none' }}
                />
              </Field>
              <SubmitBtn loading={loading}>{loading ? 'Sending…' : 'Send'}</SubmitBtn>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={linkStyle}>Back to Sign In</Link>
              </div>
            </form>
          </div>

          {/* Illustration RIGHT */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={illusForgotPw} alt="" style={{ width: '100%', maxWidth: 560, height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════════════
     STEP 2 — Info banner  (Auth illustration BG, Card RIGHT)
     Figma 1:2206 — bg 1700×1495 at left:-131,top:-255
     Card: w:608px, left:calc(50%+187.56px), centered vertically
  ════════════════════════════════════════════════════════ */
  if (step === 2) return (
    <div style={{ background: '#fbfbfb', minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: font }}>
      {/* Background container — Figma node 11:453 */}
      <div style={{ position: 'absolute', left: -131, top: -255, width: 1700, height: 1495, pointerEvents: 'none', zIndex: 0 }}>
        {/* TR corner: left:1254, top:0, w:446, h:401 */}
        <img src={cornerTR} alt="" style={{ position: 'absolute', left: 1254, top: 0, width: 446, height: 401 }} />
        {/* BL corner: left:0, top:1099, w:368, h:396 */}
        <img src={cornerBL} alt="" style={{ position: 'absolute', left: 0, top: 1099, width: 368, height: 396 }} />
        {/* Authentication illustration centered in container */}
        <img src={illusAuth} alt="" style={{ position: 'absolute', left: 229, top: 397, width: 944, height: 742, objectFit: 'contain' }} />
      </div>

      {/* Card RIGHT — Figma: left:calc(50%+187.56px), w:608px */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% + 187.56px)',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 608, zIndex: 2,
        background: 'rgba(230,241,255,0.94)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        borderRadius: 16, padding: 32,
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <p style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: '#343434', margin: 0, lineHeight: 1.3 }}>
            Forgot Password ?
          </p>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 500, color: '#6a7380', margin: 0, lineHeight: 1.3 }}>
            We will send you reset Instructions by email.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{
            background: '#fff', border: '1px solid #0b3a66', borderRadius: 12,
            padding: '12px', display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <img src={iconInfoCircle} alt="" style={{ width: 24, height: 24, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: font, fontSize: 16, fontWeight: 400, color: '#343434', margin: 0, lineHeight: 1.3 }}>
              If this email address is in our database, we'll send you an email with code and instructions for resetting your password.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button type="button" onClick={() => setStep(3)} style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: font, fontSize: 16, fontWeight: 600,
              color: '#403c8b', textDecoration: 'underline',
              textDecorationSkipInk: 'none', cursor: 'pointer', lineHeight: 1.3,
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#5379f4' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#403c8b' }}
            >
              Enter code
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════════════
     STEP 3 — Enter OTP  (Fitting piece RIGHT, Card LEFT)
     Figma 1:2493 — bg 1881×1463 at left:-221.7,top:-238.74
     Card: w:551px, left:178px, vertically centered
  ════════════════════════════════════════════════════════ */
  if (step === 3) return (
    <div style={{ background: '#fbfbfb', minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: font }}>
      {/* Background container — Figma node 11:463 */}
      <div style={{ position: 'absolute', left: -221.7, top: -238.74, width: 1881, height: 1463, pointerEvents: 'none', zIndex: 0 }}>
        {/* BL corner rotated 75.12° — wrapper 477×457 at left:0,top:0 */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 477, height: 457, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: 'rotate(75.12deg)', width: 368, height: 396, flexShrink: 0 }}>
            <img src={cornerBL} alt="" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
        {/* TR corner rotated 75.12° — wrapper 502×534 at left:1379,top:930 */}
        <div style={{ position: 'absolute', left: 1379, top: 930, width: 502, height: 534, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: 'rotate(75.12deg)', width: 446, height: 401, flexShrink: 0 }}>
            <img src={cornerTR} alt="" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
        {/* Fitting piece illustration — computed: left:788,top:389,w:720,h:737 */}
        <img src={illusFittingBig} alt="" style={{ position: 'absolute', left: 788, top: 389, width: 720, height: 737, objectFit: 'contain' }} />
      </div>

      {/* Card LEFT — Figma: left:178px, translateY(-50%) */}
      <div style={{
        position: 'absolute',
        left: 178,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 551, zIndex: 2,
        background: 'rgba(230,241,255,0.94)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        borderRadius: 16, padding: 32,
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <p style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: '#343434', margin: 0, lineHeight: 1.3 }}>
            Verify Email
          </p>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 500, color: '#6a7380', margin: 0, lineHeight: 1.3 }}>
            Please enter code sent on email address to reset your password.
          </p>
        </div>

        {error && <ErrorBox msg={error} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Code">
            <input
              type="text" inputMode="numeric"
              placeholder="Enter Code"
              maxLength={6} value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
              style={iStyle}
              onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
              onBlur={e  => { e.target.style.boxShadow = 'none' }}
            />
          </Field>
          <button type="button" onClick={handleOtpSubmit} disabled={loading} style={{
            width: '100%', height: 53, background: '#5379f4', color: '#fff',
            border: 'none', borderRadius: 12,
            fontFamily: font, fontSize: 16, fontWeight: 600, lineHeight: 1.3,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            boxShadow: '0 4px 13.6px 0 #97b6fd', transition: 'background 0.18s',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
          >
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button type="button"
            onClick={() => { setStep(1); setOtp(''); setError('') }}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: font, fontSize: 16, fontWeight: 600,
              color: '#403c8b', textDecoration: 'underline',
              textDecorationSkipInk: 'none', cursor: 'pointer', lineHeight: 1.3,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#5379f4' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#403c8b' }}
          >
            Resend code
          </button>
        </div>
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════════════
     STEP 4 — Reset Password  (Illustration BG LEFT, Card RIGHT)
     Figma 1:2281 — same bg 1700×1495 as Step 2
     Card: w:551px, left:calc(50%+250.7px), centered vertically
  ════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: '#fbfbfb', minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: font }}>
      {/* Background container — same as Step 2 */}
      <div style={{ position: 'absolute', left: -131, top: -255, width: 1700, height: 1495, pointerEvents: 'none', zIndex: 0 }}>
        <img src={cornerTR} alt="" style={{ position: 'absolute', left: 1254, top: 0, width: 446, height: 401 }} />
        <img src={cornerBL} alt="" style={{ position: 'absolute', left: 0, top: 1099, width: 368, height: 396 }} />
        {/* Reset PW illustration — computed: left:187,top:415,w:1077,h:744 */}
        <img src={illusResetPwBg} alt="" style={{ position: 'absolute', left: 187, top: 415, width: 1077, height: 744, objectFit: 'contain' }} />
      </div>

      {/* Card RIGHT — Figma: left:calc(50%+250.7px), w:551px */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% + 250.7px)',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 551, zIndex: 2,
        background: 'rgba(230,241,255,0.94)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        borderRadius: 16, padding: 32,
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
          <p style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: '#343434', margin: 0, lineHeight: 1.3 }}>
            Reset Password
          </p>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 500, color: '#6a7380', margin: 0, lineHeight: 1.3 }}>
            Set your new password
          </p>
        </div>

        {error && <ErrorBox msg={error} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Enter Password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError('') }}
                style={{ ...iStyle, paddingRight: 52 }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
                onBlur={e  => { e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={eyeBtnStyle}>
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
          </Field>

          <Field label="Repeat Password">
            <div style={{ position: 'relative' }}>
              <input
                type={showPw2 ? 'text' : 'password'}
                placeholder="Enter Repeat Password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                style={{ ...iStyle, paddingRight: 52 }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
                onBlur={e  => { e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPw2(p => !p)} style={eyeBtnStyle}>
                {showPw2 ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
          </Field>

          <button type="button" onClick={handleResetSubmit} disabled={loading} style={{
            width: '100%', height: 53, background: '#5379f4', color: '#fff',
            border: 'none', borderRadius: 12,
            fontFamily: font, fontSize: 16, fontWeight: 600, lineHeight: 1.3,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            boxShadow: '0 4px 13.6px 0 #97b6fd', transition: 'background 0.18s',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </div>

      {showModal && (
        <SuccessModal onClose={() => navigate('/login', {
          state: { message: 'Password reset successfully. Please sign in.' }
        })} />
      )}
    </div>
  )
}

/* ── Reusable micro-components ── */
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: '#343434', lineHeight: 1.3 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
      borderRadius: 8, padding: '0.55rem 0.8rem', fontSize: 14, fontFamily: font,
    }}>
      {msg}
    </div>
  )
}

function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', height: 53, background: '#5379f4', color: '#fff',
      border: 'none', borderRadius: 12,
      fontFamily: font, fontSize: 16, fontWeight: 600, lineHeight: 1.3,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
      boxShadow: '0 4px 13.6px 0 #97b6fd', transition: 'background 0.18s',
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
    >
      {children}
    </button>
  )
}

/* ── Shared style constants ── */
const cardStyle = {
  width: 551, maxWidth: '90vw', flexShrink: 0,
  background: 'rgba(230,241,255,0.94)',
  backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
  borderRadius: 16, padding: 32,
  display: 'flex', flexDirection: 'column', gap: 0,
}

const iStyle = {
  height: 56, padding: '16px 20px',
  border: '1px solid #6a7380', borderRadius: 12, background: '#fff',
  fontFamily: font, fontSize: 16, fontWeight: 400, color: '#343434',
  outline: 'none', boxSizing: 'border-box', width: '100%', lineHeight: 1.3,
}

const eyeBtnStyle = {
  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#6a7380', padding: 0, display: 'flex', alignItems: 'center',
}

const linkStyle = {
  fontFamily: font, fontSize: 16, fontWeight: 600,
  color: '#403c8b', textDecoration: 'underline',
  textDecorationSkipInk: 'none', lineHeight: 1.3,
}
