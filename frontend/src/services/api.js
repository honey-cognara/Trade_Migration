const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, detail: data.detail || 'Request failed' }
  return data
}

async function formRequest(method, path, formData, token) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, detail: data.detail || 'Request failed' }
  return data
}

// ── Auth ────────────────────────────────────────────────────────
export const register = (payload) => request('POST', '/auth/register', payload)
export const login = (payload) => request('POST', '/auth/login', payload)
export const verifyOtp = (payload) => request('POST', '/auth/verify-otp', payload)
export const resendOtp = (payload) => request('POST', '/auth/resend-otp', payload)
export const forgotPassword = (payload) => request('POST', '/auth/forgot-password', payload)
export const verifyResetOtp = (payload) => request('POST', '/auth/verify-reset-otp', payload)
export const resetPassword = (payload) => request('POST', '/auth/reset-password', payload)
export const getMe = (token) => request('GET', '/auth/me', null, token)
export const logout = (token) => request('POST', '/auth/logout', null, token)

// ── Candidates ──────────────────────────────────────────────────
export const createCandidateProfile = (payload, token) =>
  request('POST', '/candidates/profile', payload, token)
export const updateCandidateProfile = (payload, token) =>
  request('PUT', '/candidates/profile', payload, token)
export const publishProfile = (token) =>
  request('POST', '/candidates/profile/publish', null, token)

// ── Employers ───────────────────────────────────────────────────
export const createCompany = (payload, token) =>
  request('POST', '/employers/company', payload, token)
export const updateCompany = (payload, token) =>
  request('PUT', '/employers/company', payload, token)

// ── Training Providers ──────────────────────────────────────────
export const createTrainingProvider = (payload, token) =>
  request('POST', '/training-providers/', payload, token)
export const updateTrainingProvider = (id, payload, token) =>
  request('PUT', `/training-providers/${id}`, payload, token)

// ── Token helpers ───────────────────────────────────────────────
export const saveToken = (token) => localStorage.setItem('access_token', token)
export const getToken = () => localStorage.getItem('access_token')
export const clearToken = () => localStorage.removeItem('access_token')
