const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw { status: 0, detail: 'Cannot reach the server. Please ensure the backend is running on port 8000.' }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const raw = data.detail
    const detail = Array.isArray(raw)
      ? raw.map(d => d.msg || String(d)).join('. ')
      : raw || 'Request failed'
    throw { status: res.status, detail }
  }
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
export const login    = (payload) => request('POST', '/auth/login', payload)

// FIX: backend expects ?email=&otp= as query params, not JSON body
export const verifyOtp = ({ email, otp_code }) =>
  request('POST', `/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp_code)}`)

// FIX: backend expects ?email= as query param
export const resendOtp = ({ email }) =>
  request('POST', `/auth/resend-otp?email=${encodeURIComponent(email)}`)

export const forgotPassword  = (payload) => request('POST', '/auth/forgot-password', payload)
export const verifyResetOtp  = (payload) => request('POST', '/auth/verify-reset-otp', payload)
export const resetPassword   = (payload) => request('POST', '/auth/reset-password', payload)
export const getMe           = (token)   => request('GET', '/auth/me', null, token)
export const logout          = (token)   => request('POST', '/auth/logout', null, token)

// ── Dashboard ───────────────────────────────────────────────────
export const getMyDashboard     = (token) => request('GET', '/dashboard/my', null, token)
export const getRecentActivity  = (token) => request('GET', '/dashboard/recent-activity', null, token)
export const getPendingEmployers= (token) => request('GET', '/dashboard/pending-employers', null, token)

// ── Candidates ──────────────────────────────────────────────────
export const createCandidateProfile = (payload, token) =>
  request('POST', '/candidates/profile', payload, token)
export const updateCandidateProfile = (payload, token) =>
  request('PUT', '/candidates/profile', payload, token)
export const publishProfile = (token) =>
  request('POST', '/candidates/profile/publish', null, token)
export const getCandidateProfile = (token) =>
  request('GET', '/candidates/profile', null, token)

// ── Employers ───────────────────────────────────────────────────
export const createCompany = (payload, token) =>
  request('POST', '/employers/company', payload, token)
export const updateCompany = (payload, token) =>
  request('PUT', '/employers/company', payload, token)
export const getMyCompany = (token) =>
  request('GET', '/employers/company', null, token)

// ── Training Providers ──────────────────────────────────────────
// FIX: backend is mounted at /training/provider (not /training-providers/)
export const createTrainingProvider = (payload, token) =>
  request('POST', '/training/provider', payload, token)
export const updateTrainingProvider = (id, payload, token) =>
  request('PUT', `/training/provider/${id}`, payload, token)
export const getTrainingProviders = () =>
  request('GET', '/training/provider')
export const getCourses = (trade_category) =>
  request('GET', `/training/courses${trade_category ? `?trade_category=${trade_category}` : ''}`)

// ── Token helpers ───────────────────────────────────────────────
export const saveToken  = (token) => localStorage.setItem('access_token', token)
export const getToken   = ()      => localStorage.getItem('access_token')
export const clearToken = ()      => localStorage.removeItem('access_token')