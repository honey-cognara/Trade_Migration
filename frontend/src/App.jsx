import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { OtsrPage } from './pages/OtsrPage'
import { ForTradiesPage } from './pages/ForTradiesPage'
import { ForEmployersPage } from './pages/ForEmployersPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/otsr" element={<OtsrPage />} />
        <Route path="/tradies" element={<ForTradiesPage />} />
        <Route path="/employers" element={<ForEmployersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
