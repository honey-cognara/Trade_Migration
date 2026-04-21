import { Link } from 'react-router-dom'

export function HeroCarousel() {
  return (
    <section className="tc-hero tc-hero-carousel">
      <div className="tc-hero-bg" />
      <div className="tc-hero-inner">
        <div className="tc-hero-copy">
          <p className="tc-eyebrow">Migration & Licensing Pathways</p>
          <h1>
            Your pathway to Australian electrical work from offshore experience
            to local licence.
          </h1>
          <p className="tc-hero-sub">
            Mazdoor Migration helps overseas electricians and tradespeople
            understand the OTSR process, plan gap training and connect with
            employers who are ready to support their licensing journey.
          </p>
          <div className="tc-hero-cta">
            <Link to="/tradies" className="tc-btn tc-btn-primary lg">
              I&apos;m a Tradie
            </Link>
            <Link to="/employers" className="tc-btn tc-btn-secondary lg">
              I&apos;m an Employer
            </Link>
          </div>
          <div className="tc-hero-meta">
            <span>OTSR guidance</span>
            <span>Licensing pathways</span>
            <span>Employer & training partners</span>
          </div>
        </div>

        <div className="tc-hero-carousel-visual">
          <span className="tc-hero-plane" aria-hidden="true">
            ✈
          </span>
        </div>
      </div>
    </section>
  )
}

