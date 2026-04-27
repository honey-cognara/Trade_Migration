/**
 * OAuthCallbackPage
 *
 * The backend redirects here after a successful Google / LinkedIn login:
 *   /oauth-callback?token=<JWT>&role=<role>&user_id=<id>
 *
 * This page:
 *   1. Reads token + role from the URL
 *   2. Persists the token via saveToken()
 *   3. Redirects to the role-specific dashboard / setup wizard
 *   4. Shows an error card if the provider returned an error
 */

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { saveToken } from '../services/api'

const font = "'Urbanist', sans-serif"

const ROLE_REDIRECT = {
  candidate:         '/setup/worker/1',
  employer:          '/setup/company/1',
  training_provider: '/setup/trainer/1',
  admin:             '/dashboard',
  migration_agent:   '/dashboard',
  company_admin:     '/dashboard',
}

const ERROR_MESSAGES = {
  invalid_state:           'Session expired. Please try signing in again.',
  google_token_failed:     'Google login failed. Please try again.',
  google_profile_failed:   'Could not fetch your Google profile. Please try again.',
  linkedin_token_failed:   'LinkedIn login failed. Please try again.',
  linkedin_profile_failed: 'Could not fetch your LinkedIn profile. Please try again.',
  no_email:                'Your social account did not provide an email address.',
}

export function OAuthCallbackPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const error   = params.get('error')
    const token   = params.get('token')
    const role    = params.get('role')

    if (error) {
      setErrMsg(ERROR_MESSAGES[error] || `Sign-in failed: ${error}`)
      return
    }

    if (!token || !role) {
      setErrMsg('Sign-in failed: missing token or role.')
      return
    }

    saveToken(token)
    navigate(ROLE_REDIRECT[role] || '/dashboard', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Loading spinner (shown while redirecting) ── */
  if (!errMsg) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#fbfbfb',
        fontFamily:     font,
        gap:            16,
      }}>
        <div style={{
          width:        48, height: 48,
          border:       '4px solid #e2e8f0',
          borderTop:    '4px solid #5379f4',
          borderRadius: '50%',
          animation:    'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#6a7380', fontSize: 16, margin: 0 }}>
          Completing sign-in…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  /* ── Error card ── */
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     '#fbfbfb',
      fontFamily:     font,
      padding:        '2rem',
    }}>
      <div style={{
        maxWidth:     420,
        width:        '100%',
        background:   '#fff',
        borderRadius: 16,
        padding:      '2rem',
        boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
        textAlign:    'center',
        display:      'flex',
        flexDirection:'column',
        gap:          20,
      }}>
        {/* Icon */}
        <div style={{ fontSize: 48 }}>⚠️</div>

        <div>
          <h2 style={{ margin: '0 0 8px', color: '#343434', fontSize: 22, fontWeight: 700 }}>
            Sign-in Failed
          </h2>
          <p style={{ margin: 0, color: '#6a7380', fontSize: 15, lineHeight: 1.5 }}>
            {errMsg}
          </p>
        </div>

        <Link
          to="/login"
          style={{
            display:       'inline-block',
            background:    '#5379f4',
            color:         '#fff',
            borderRadius:  12,
            padding:       '14px 24px',
            fontWeight:    600,
            fontSize:      16,
            textDecoration:'none',
            transition:    'background 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4264d6' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
