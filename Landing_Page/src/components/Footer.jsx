import ElectricianLogo from '../assets/electrician-logo.png'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="tc-footer">
      <div className="tc-footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <img src={ElectricianLogo} alt="Electrician Logo" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', background: 'transparent' }} />
          <div>
            <div className="tc-footer-brand">Mazdoor Migration Australia</div>
            <p className="tc-footer-text">
              Connecting skilled overseas electricians with Australian employers,
              training providers and licensing pathways.
            </p>
          </div>
        </div>
        <div className="tc-footer-columns">
          <div>
            <div className="tc-footer-heading">Platform</div>
            <a href="/tradies">For Tradies</a>
            <a href="/employers">For Employers</a>
            <a href="/otsr">OTSR Pathway</a>
          </div>
          <div>
            <div className="tc-footer-heading">Company</div>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div>
          <div>
            <div className="tc-footer-heading">Compliance</div>
            <a
              href="https://www.tradesrecognitionaustralia.gov.au/"
              target="_blank"
              rel="noreferrer"
            >
              Trades Recognition Australia
            </a>
          </div>
        </div>
      </div>
      <div className="tc-footer-bottom">
        <span>© {year} Mazdoor Migration Australia. All rights reserved.</span>
      </div>
    </footer>
  )
}


