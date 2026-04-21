import { useAuth } from '../context/AuthContext'

export function EmployerDashboard() {
  const { user } = useAuth()

  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Employer Portal</p>
          <h1>Welcome back, {user?.email}</h1>
          <p>Search and connect with qualified overseas tradies for your business.</p>
        </div>

        <div className="tc-grid-3">
          <div className="tc-card">
            <h2>Search Candidates</h2>
            <p>Browse overseas electricians and tradies looking for Australian work.</p>
            <button className="tc-btn tc-btn-primary">Search Now</button>
          </div>
          <div className="tc-card">
            <h2>Expressions of Interest</h2>
            <p>Review and respond to EOIs submitted by skilled candidates.</p>
            <button className="tc-btn tc-btn-outline">View EOIs</button>
          </div>
          <div className="tc-card">
            <h2>My Job Listings</h2>
            <p>Post and manage your open positions for overseas tradies.</p>
            <button className="tc-btn tc-btn-outline">Manage Listings</button>
          </div>
          <div className="tc-card">
            <h2>Visa Sponsorship</h2>
            <p>Track visa sponsorship applications for candidates you are supporting.</p>
            <button className="tc-btn tc-btn-outline">View Applications</button>
          </div>
          <div className="tc-card">
            <h2>Company Profile</h2>
            <p>Update your company details, location, and trade specialisations.</p>
            <button className="tc-btn tc-btn-outline">Edit Profile</button>
          </div>
          <div className="tc-card">
            <h2>AI Assistant</h2>
            <p>Ask questions about sponsorship obligations, licensing, and hiring requirements.</p>
            <button className="tc-btn tc-btn-outline">Ask a Question</button>
          </div>
        </div>
      </section>
    </div>
  )
}
