import { Link } from 'react-router-dom'
import { HeroCarousel } from '../components/HeroCarousel'

export function HomePage() {
  return (
    <div className="tc-page tc-home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <HeroCarousel />

      <section className="tc-section tc-split" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="tc-section-header" style={{ textAlign: 'center', maxWidth: 700 }}>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 700, marginBottom: '0.7rem' }}>
            Connecting Visa Applicants & Employers
          </h2>
          <p>
            Mazdoor Migration links tradespeople and employers for migration and job opportunities.
          </p>
        </div>
        <div className="tc-card-grid" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2.5rem' }}>
          <div
            className="tc-card tc-card-ghost"
            style={{
              minWidth: 440,
              maxWidth: 560,
              margin: '0 auto',
              textAlign: 'left',
              padding: '2rem 2rem',
              fontSize: '1.13rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
          >
            <h3 style={{ textAlign: 'center', fontSize: '1.7rem', marginBottom: '1.1rem' }}>For Tradies</h3>
            <p style={{ textAlign: 'center', fontSize: '1.13rem', marginBottom: '1.2rem' }}>
              Turn your international electrical experience into an Australian licence. We outline your steps from skills assessment through to gap training and employment.
            </p>
            <ul style={{ fontSize: '1.08rem', marginBottom: '1.2rem' }}>
              <li>Guidance on OTSR and TRA process</li>
              <li>Connections to RTOs and training providers</li>
              <li>Introductions to sponsoring employers</li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Link to="/tradies" className="tc-link" style={{ fontSize: '1.08rem', padding: '0.5rem 1.2rem' }}>
                Explore the tradie pathway →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

