import { useAuth } from '../context/AuthContext'

export function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="tc-page">
      <section className="tc-section">
        <div className="tc-section-header">
          <p className="tc-eyebrow">Admin Portal</p>
          <h1>Welcome back, {user?.email}</h1>
          <p>Manage users, applications, and platform settings.</p>
        </div>

        <div className="tc-grid-3">
          <div className="tc-card">
            <h2>User Management</h2>
            <p>View, activate, deactivate, or delete user accounts across all roles.</p>
            <button className="tc-btn tc-btn-primary">Manage Users</button>
          </div>
          <div className="tc-card">
            <h2>All Candidates</h2>
            <p>Browse all registered tradie candidates and their migration status.</p>
            <button className="tc-btn tc-btn-outline">View Candidates</button>
          </div>
          <div className="tc-card">
            <h2>All Employers</h2>
            <p>Review and approve employer accounts and job listings.</p>
            <button className="tc-btn tc-btn-outline">View Employers</button>
          </div>
          <div className="tc-card">
            <h2>Visa Applications</h2>
            <p>Monitor all active visa case files and their current statuses.</p>
            <button className="tc-btn tc-btn-outline">View Visa Cases</button>
          </div>
          <div className="tc-card">
            <h2>RAG Documents</h2>
            <p>Upload and manage knowledge base documents for the AI assistant.</p>
            <button className="tc-btn tc-btn-outline">Manage Docs</button>
          </div>
          <div className="tc-card">
            <h2>Platform Analytics</h2>
            <p>View registration trends, EOI submissions, and engagement metrics.</p>
            <button className="tc-btn tc-btn-outline">View Analytics</button>
          </div>
        </div>
      </section>
    </div>
  )
}
