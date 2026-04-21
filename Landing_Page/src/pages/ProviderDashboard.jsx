import { useAuth } from '../context/AuthContext'

export function ProviderDashboard() {
  const { user } = useAuth()

  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Training Provider Portal</p>
          <h1>Welcome back, {user?.email}</h1>
          <p>Manage your courses and connect with tradies who need skills bridging.</p>
        </div>

        <div className="tc-grid-3">
          <div className="tc-card">
            <h2>My Courses</h2>
            <p>Add and manage training courses for overseas skilled tradespeople.</p>
            <button className="tc-btn tc-btn-primary">Manage Courses</button>
          </div>
          <div className="tc-card">
            <h2>Enrolled Candidates</h2>
            <p>Track tradie enrolments and progress through your training programs.</p>
            <button className="tc-btn tc-btn-outline">View Enrolments</button>
          </div>
          <div className="tc-card">
            <h2>Organisation Profile</h2>
            <p>Update your RTO details, certifications, and service areas.</p>
            <button className="tc-btn tc-btn-outline">Edit Profile</button>
          </div>
          <div className="tc-card">
            <h2>Candidate Referrals</h2>
            <p>Review tradies who have been referred to your training programs.</p>
            <button className="tc-btn tc-btn-outline">View Referrals</button>
          </div>
          <div className="tc-card">
            <h2>AI Assistant</h2>
            <p>Get answers about licensing pathways and training requirements.</p>
            <button className="tc-btn tc-btn-outline">Ask a Question</button>
          </div>
        </div>
      </section>
    </div>
  )
}
