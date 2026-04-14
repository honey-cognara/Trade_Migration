import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { OtpPage } from './pages/OtpPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { WorkerSetup } from './pages/worker/WorkerSetup'
import { CompanySetup } from './pages/company/CompanySetup'
import { TrainerSetup } from './pages/trainer/TrainerSetup'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Multi-step profile setup */}
      <Route path="/setup/worker/:step" element={<WorkerSetup />} />
      <Route path="/setup/company/:step" element={<CompanySetup />} />
      <Route path="/setup/trainer/:step" element={<TrainerSetup />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
