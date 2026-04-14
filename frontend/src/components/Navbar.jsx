import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import ElectricianLogo from '../assets/electrician-logo.png'

export function Navbar() {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen((o) => !o)
  const close = () => setOpen(false)

  return (
    <header className="tc-header">
      <div className="tc-header-inner">
        <Link to="/" className="tc-logo" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <img src={ElectricianLogo} alt="Electrician Logo" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%', background: 'transparent' }} />
          <span className="tc-logo-text">
            Mazdoor Migration <span className="tc-logo-sub">Australia</span>
          </span>
        </Link>

        <nav className={`tc-nav ${open ? 'tc-nav-open' : ''}`}>
          <NavLink to="/" end onClick={close}>
            Home
          </NavLink>
          <NavLink to="/tradies" onClick={close}>
            I&apos;m a Tradie
          </NavLink>
          <NavLink to="/employers" onClick={close}>
            I&apos;m an Employer
          </NavLink>
          <NavLink to="/otsr" onClick={close}>
            OTSR
          </NavLink>
          <NavLink to="/about" onClick={close}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={close}>
            Contact
          </NavLink>
        </nav>

        <div className="tc-header-cta">
          <Link to="/login" className="tc-btn tc-btn-outline" onClick={close}>
            Login
          </Link>
          <Link to="/signup" className="tc-btn tc-btn-primary" onClick={close}>
            Sign up free
          </Link>
        </div>

        <button
          className={`tc-burger ${open ? 'tc-burger-open' : ''}`}
          aria-label="Toggle navigation"
          onClick={toggle}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}


