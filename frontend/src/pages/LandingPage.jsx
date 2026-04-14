import { Link } from 'react-router-dom'
import './SharedFlow.css'

/* ── Decorative blobs + accent elements ─────────────────────── */
function Blobs() {
  return (
    <>
      <div className="sf-blob sf-blob-tr" />
      <div className="sf-blob sf-blob-bl" />
      <div className="sf-blob sf-blob-tl" />
      {/* orange rings */}
      <div className="sf-ring" style={{ width: 80, height: 80, top: '18%', left: '7%', opacity: 0.35 }} />
      <div className="sf-ring" style={{ width: 44, height: 44, top: '30%', left: '4%', opacity: 0.25 }} />
      <div className="sf-ring" style={{ width: 60, height: 60, bottom: '20%', right: '6%', opacity: 0.3 }} />
      <div className="sf-ring" style={{ width: 30, height: 30, bottom: '12%', right: '3%', opacity: 0.2 }} />
      {/* orange dots */}
      <div className="sf-dot-o" style={{ top: '22%', left: '14%' }} />
      <div className="sf-dot-o" style={{ top: '38%', left: '9%' }} />
      <div className="sf-dot-o" style={{ bottom: '28%', right: '12%' }} />
      <div className="sf-dot-o" style={{ bottom: '16%', right: '18%' }} />
    </>
  )
}

/* ── SVG illustrations ───────────────────────────────────────── */
function IllusHire() {
  return (
    <svg viewBox="0 0 120 130" width="110" height="120" fill="none">
      {/* building */}
      <rect x="30" y="40" width="60" height="70" rx="3" fill="#c8e6c0" />
      <rect x="36" y="50" width="14" height="14" rx="2" fill="#7aad6a" opacity="0.7" />
      <rect x="56" y="50" width="14" height="14" rx="2" fill="#7aad6a" opacity="0.7" />
      <rect x="76" y="50" width="8" height="14" rx="2" fill="#7aad6a" opacity="0.5" />
      <rect x="36" y="72" width="14" height="14" rx="2" fill="#7aad6a" opacity="0.7" />
      <rect x="56" y="72" width="14" height="14" rx="2" fill="#7aad6a" opacity="0.7" />
      <rect x="76" y="72" width="8" height="14" rx="2" fill="#7aad6a" opacity="0.5" />
      <rect x="48" y="92" width="18" height="18" rx="2" fill="#5a8a4a" />
      {/* person */}
      <circle cx="22" cy="55" r="10" fill="#f5d0a9" />
      <path d="M10 80 Q10 68 22 68 Q34 68 34 80 L34 95 L10 95 Z" fill="#e87b3a" />
      {/* briefcase */}
      <rect x="14" y="82" width="16" height="11" rx="2" fill="#5a8a4a" />
      <rect x="18" y="80" width="8" height="4" rx="1" fill="#3a5a3a" />
    </svg>
  )
}

function IllusTrain() {
  return (
    <svg viewBox="0 0 120 130" width="110" height="120" fill="none">
      {/* laptop */}
      <rect x="25" y="55" width="70" height="45" rx="4" fill="#c8e6c0" />
      <rect x="30" y="60" width="60" height="35" rx="2" fill="#7aad6a" opacity="0.5" />
      <rect x="15" y="98" width="90" height="6" rx="3" fill="#a0c890" />
      {/* screen content lines */}
      <rect x="38" y="67" width="35" height="4" rx="2" fill="#5a8a4a" opacity="0.6" />
      <rect x="38" y="74" width="25" height="3" rx="1.5" fill="#5a8a4a" opacity="0.4" />
      <rect x="38" y="80" width="30" height="3" rx="1.5" fill="#5a8a4a" opacity="0.4" />
      {/* person */}
      <circle cx="60" cy="30" r="14" fill="#f5d0a9" />
      <path d="M44 56 Q44 42 60 42 Q76 42 76 56 L76 58 L44 58 Z" fill="#5a8a4a" />
      {/* graduation cap */}
      <rect x="48" y="18" width="24" height="6" rx="1" fill="#3a5a3a" />
      <polygon points="60,12 50,18 70,18" fill="#3a5a3a" />
      <line x1="70" y1="18" x2="72" y2="24" stroke="#e87b3a" strokeWidth="2" />
      <circle cx="72" cy="25" r="2" fill="#e87b3a" />
    </svg>
  )
}

function IllusWork() {
  return (
    <svg viewBox="0 0 120 130" width="110" height="120" fill="none">
      {/* clipboard / resume */}
      <rect x="40" y="20" width="50" height="65" rx="4" fill="#5a8a4a" />
      <rect x="45" y="28" width="40" height="4" rx="2" fill="#c8e6c0" opacity="0.8" />
      <rect x="45" y="36" width="30" height="3" rx="1.5" fill="#c8e6c0" opacity="0.6" />
      <rect x="45" y="43" width="35" height="3" rx="1.5" fill="#c8e6c0" opacity="0.6" />
      <rect x="45" y="50" width="28" height="3" rx="1.5" fill="#c8e6c0" opacity="0.6" />
      <rect x="45" y="60" width="40" height="16" rx="3" fill="#7aad6a" />
      <rect x="56" y="66" width="18" height="4" rx="2" fill="#fff" opacity="0.85" />
      {/* clip */}
      <rect x="55" y="14" width="20" height="10" rx="3" fill="#3a5a3a" />
      <rect x="59" y="12" width="12" height="6" rx="3" fill="#5a8a4a" />
      {/* person */}
      <circle cx="25" cy="62" r="12" fill="#f5d0a9" />
      <path d="M11 90 Q11 76 25 76 Q39 76 39 90 L39 105 L11 105 Z" fill="#e87b3a" />
      {/* hard hat */}
      <ellipse cx="25" cy="52" rx="10" ry="5" fill="#e87b3a" />
      <rect x="15" y="54" width="20" height="4" rx="0" fill="#e87b3a" />
      {/* star badge */}
      <circle cx="85" cy="100" r="12" fill="#e87b3a" />
      <text x="85" y="105" textAnchor="middle" fill="white" fontSize="12">★</text>
    </svg>
  )
}

export function LandingPage() {
  return (
    <div className="sf-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', minHeight: '100vh' }}>
      <Blobs />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.55rem', zIndex: 2 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#5a8a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>T</div>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2a3a2a' }}>Tradie</span>
      </div>
      <div style={{ position: 'absolute', top: '1.6rem', right: '2rem', zIndex: 2 }}>
        <Link to="/login" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#5a8a4a', textDecoration: 'none' }}>Sign in</Link>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 680, marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(1.55rem, 3.5vw, 2.2rem)', fontWeight: 800, color: '#1a2e1a', lineHeight: 1.35, margin: '0 0 0.85rem' }}>
          Connecting world-class talent with<br />
          opportunities and the skills to succeed.
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#5a7a5a', lineHeight: 1.65 }}>
          Whether you're a skilled worker seeking opportunity, a business looking to hire,<br />
          or a trainer building the next generation — we bring you together.
        </p>
      </div>

      {/* ── Role cards ───────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
        {/* Hire */}
        <Link to="/register?role=employer" style={{ textDecoration: 'none' }}>
          <div className="sf-card" style={{ width: 210, padding: '1.75rem 1.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.18s, transform 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(90,138,74,0.18)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <IllusHire />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a2e1a', marginBottom: '0.4rem', fontFamily: "'Georgia', serif" }}>I want to hire</div>
            <div style={{ fontSize: '0.8rem', color: '#5a7a5a', lineHeight: 1.5 }}>Find skilled trade workers for your business</div>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', fontWeight: 700, color: '#5a8a4a' }}>Get Started →</div>
          </div>
        </Link>

        {/* Train */}
        <Link to="/register?role=training_provider" style={{ textDecoration: 'none' }}>
          <div className="sf-card" style={{ width: 210, padding: '1.75rem 1.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.18s, transform 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(90,138,74,0.18)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <IllusTrain />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a2e1a', marginBottom: '0.4rem', fontFamily: "'Georgia', serif" }}>I want to train</div>
            <div style={{ fontSize: '0.8rem', color: '#5a7a5a', lineHeight: 1.5 }}>Offer programs to upskill overseas tradies</div>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', fontWeight: 700, color: '#5a8a4a' }}>Get Started →</div>
          </div>
        </Link>

        {/* Work — highlighted */}
        <Link to="/register?role=candidate" style={{ textDecoration: 'none' }}>
          <div style={{ width: 210, padding: '1.75rem 1.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: '#5a8a4a', borderRadius: 16, transition: 'box-shadow 0.18s, transform 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(90,138,74,0.35)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <IllusWork />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: '0.4rem', fontFamily: "'Georgia', serif" }}>I want to work</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Showcase your skills, find employers in Australia</div>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', fontWeight: 700, color: '#d8f0c0' }}>Get Started →</div>
          </div>
        </Link>
      </div>

      {/* ── Footer link ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, fontSize: '0.85rem', color: '#6a8a6a' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#5a8a4a', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
      </div>
    </div>
  )
}
