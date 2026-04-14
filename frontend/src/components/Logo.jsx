import { Link } from 'react-router-dom'

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="auth-logo">
      <div className="auth-logo-icon">T</div>
      <span className="auth-logo-text">Tradie Migration</span>
    </Link>
  )
}
