import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="landing-page">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div className="auth-logo-icon" style={{ width: 42, height: 42, fontSize: '1.1rem' }}>T</div>
        <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Tradie Migration</span>
      </div>

      <span className="landing-badge">Connecting Global Trades Talent</span>

      <h1 className="landing-title">
        Your pathway to <span>Australian trades</span>
      </h1>
      <p className="landing-subtitle">
        Whether you're a skilled worker seeking opportunity, a business looking to hire, or a trainer building the workforce — we connect you.
      </p>

      <div className="role-cards">
        <Link to="/register?role=employer" className="role-card">
          <div className="role-icon hire">🏢</div>
          <div>
            <div className="role-label">I want to hire</div>
            <div className="role-desc">Find skilled trade workers for your Australian business</div>
          </div>
        </Link>

        <Link to="/register?role=training_provider" className="role-card">
          <div className="role-icon train">🎓</div>
          <div>
            <div className="role-label">I want to train</div>
            <div className="role-desc">Offer training programs to upskill overseas tradies</div>
          </div>
        </Link>

        <Link to="/register?role=candidate" className="role-card">
          <div className="role-icon work">🔧</div>
          <div>
            <div className="role-label">I want to work</div>
            <div className="role-desc">Showcase your skills and find employers in Australia</div>
          </div>
        </Link>
      </div>

      <div className="landing-login">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  )
}
