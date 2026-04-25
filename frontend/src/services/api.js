const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ── Core helpers ──────────────────────────────────────────────── */
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
  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: formData })
  } catch {
    throw { status: 0, detail: 'Cannot reach the server.' }
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, detail: data.detail || 'Request failed' }
  return data
}

async function blobRequest(path, token) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${BASE}${path}`, { headers })
  } catch {
    throw { status: 0, detail: 'Cannot reach the server.' }
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw { status: res.status, detail: data.detail || 'Download failed' }
  }
  return res.blob()
}

function buildQuery(params) {
  const q = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return q ? `?${q}` : ''
}

// ── Auth ─────────────────────────────────────────────────────────
export const register       = (payload)          => request('POST', '/auth/register', payload)
export const login          = (payload)          => request('POST', '/auth/login', payload)
export const verifyOtp      = ({ email, otp_code }) =>
  request('POST', `/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp_code)}`)
export const resendOtp      = ({ email })        =>
  request('POST', `/auth/resend-otp?email=${encodeURIComponent(email)}`)
export const forgotPassword  = (payload)         => request('POST', '/auth/forgot-password', payload)
export const verifyResetOtp  = (payload)         => request('POST', '/auth/verify-reset-otp', payload)
export const resetPassword   = (payload)         => request('POST', '/auth/reset-password', payload)
export const getMe           = (token)           => request('GET', '/auth/me', null, token)
export const logout          = (token)           => request('POST', '/auth/logout', null, token)

// ── Dashboard ─────────────────────────────────────────────────────
export const getDashboardStats    = (token)      => request('GET', '/dashboard/stats', null, token)
export const getMyDashboard       = (token)      => request('GET', '/dashboard/my', null, token)
export const getRecentActivity    = (token)      => request('GET', '/dashboard/recent-activity', null, token)
export const getPendingEmployers  = (token)      => request('GET', '/dashboard/pending-employers', null, token)

// ── Candidates ───────────────────────────────────────────────────
export const createCandidateProfile  = (payload, token) => request('POST', '/candidates/profile', payload, token)
export const getCandidateProfile     = (token)          => request('GET', '/candidates/profile', null, token)
export const updateCandidateProfile  = (payload, token) => request('PUT', '/candidates/profile', payload, token)
export const deleteCandidateProfile  = (token)          => request('DELETE', '/candidates/profile', null, token)
export const publishProfile          = (token)          => request('POST', '/candidates/profile/publish', null, token)
export const unpublishProfile        = (token)          => request('POST', '/candidates/profile/unpublish', null, token)
export const getCandidateEois        = (token)          => request('GET', '/candidates/eois', null, token)
export const grantEmployerConsent    = (employerId, token) => request('POST', `/candidates/consent/employer/${employerId}`, null, token)
export const getEmployerConsents     = (token)          => request('GET', '/candidates/consent/employers', null, token)
export const revokeEmployerConsent   = (employerId, token) => request('DELETE', `/candidates/consent/employer/${employerId}`, null, token)
export const approveVisaShare        = (eoiId, token)   => request('POST', `/candidates/visa-share/${eoiId}/approve`, null, token)
export const revokeVisaShare         = (eoiId, token)   => request('POST', `/candidates/visa-share/${eoiId}/revoke`, null, token)
export const getVisaShares           = (token)          => request('GET', '/candidates/visa-shares', null, token)

// ── Employers ─────────────────────────────────────────────────────
export const createCompany           = (payload, token) => request('POST', '/employers/company', payload, token)
export const getMyCompany            = (token)          => request('GET', '/employers/company', null, token)
export const updateCompany           = (payload, token) => request('PUT', '/employers/company', payload, token)
export const deleteCompany           = (token)          => request('DELETE', '/employers/company', null, token)
export const getCompanies            = (params)         => request('GET', `/employers/companies${buildQuery(params)}`)
export const getCompany              = (companyId)      => request('GET', `/employers/companies/${companyId}`)
export const searchCandidates        = (params, token)  => request('GET', `/employers/candidates${buildQuery(params)}`, null, token)
export const getCandidatePublicProfile = (candidateId, token) => request('GET', `/employers/candidates/${candidateId}`, null, token)
export const submitEoiAsEmployer     = (payload, token) => request('POST', '/employers/eoi', payload, token)

// ── EOI ───────────────────────────────────────────────────────────
export const createEoi     = (payload, token)          => request('POST', '/eoi/', payload, token)
export const getReceivedEois = (token)                 => request('GET', '/eoi/received', null, token)
export const markEoiRead   = (eoiId, token)            => request('PATCH', `/eoi/${eoiId}/read`, null, token)
export const getEoi        = (eoiId, token)            => request('GET', `/eoi/${eoiId}`, null, token)
export const updateEoi     = (eoiId, payload, token)   => request('PUT', `/eoi/${eoiId}`, payload, token)
export const deleteEoi     = (eoiId, token)            => request('DELETE', `/eoi/${eoiId}`, null, token)

// ── Documents ─────────────────────────────────────────────────────
export const uploadDocument   = (formData, token)      => formRequest('POST', '/documents/', formData, token)
export const getDocuments     = (candidateId, token)   => request('GET', `/documents/${candidateId}`, null, token)
export const downloadDocument = (documentId, token)    => blobRequest(`/documents/download/${documentId}`, token)
export const deleteDocument   = (documentId, token)    => request('DELETE', `/documents/${documentId}`, null, token)

// ── Electrical Scoring ────────────────────────────────────────────
export const triggerScoring = (candidateId, token)     => request('POST', `/scoring/${candidateId}`, null, token)
export const getScore       = (candidateId, token)     => request('GET', `/scoring/${candidateId}`, null, token)
export const deleteScore    = (candidateId, token)     => request('DELETE', `/scoring/${candidateId}`, null, token)

// ── Admin ─────────────────────────────────────────────────────────
export const getPendingEmployersList  = (token)                    => request('GET', '/admin/employers/pending', null, token)
export const verifyEmployer           = (employerId, payload, token) => request('POST', `/admin/employers/${employerId}/verify`, payload, token)
export const getAllEmployers           = (params, token)            => request('GET', `/admin/employers${buildQuery(params)}`, null, token)
export const getAllCompanies           = (params, token)            => request('GET', `/admin/companies${buildQuery(params)}`, null, token)
export const getAdminEmployer         = (employerId, token)        => request('GET', `/admin/employers/${employerId}`, null, token)
export const deleteAdminEmployer      = (employerId, token)        => request('DELETE', `/admin/employers/${employerId}`, null, token)
export const forceUnpublishCandidate  = (candidateId, token)       => request('POST', `/admin/candidates/${candidateId}/unpublish`, null, token)
export const getAllCandidates          = (params, token)            => request('GET', `/admin/candidates${buildQuery(params)}`, null, token)
export const getAdminCandidate        = (candidateId, token)       => request('GET', `/admin/candidates/${candidateId}`, null, token)
export const exportCandidatePdf       = (candidateId, token)       => blobRequest(`/admin/candidates/${candidateId}/export-pdf`, token)
export const deleteAdminCandidate     = (candidateId, token)       => request('DELETE', `/admin/candidates/${candidateId}`, null, token)
export const getAllUsers               = (params, token)            => request('GET', `/admin/users${buildQuery(params)}`, null, token)
export const updateUserStatus         = (userId, payload, token)   => request('PUT', `/admin/users/${userId}/status`, payload, token)

// ── Migration Agents ──────────────────────────────────────────────
export const agentPing      = (token)                              => request('GET', '/agents/ping', null, token)
export const assignCase     = (payload, token)                     => request('POST', '/agents/cases/assign', payload, token)
export const getAgentCases  = (token)                              => request('GET', '/agents/cases', null, token)
export const getAgentCase   = (visaApplicationId, token)           => request('GET', `/agents/cases/${visaApplicationId}`, null, token)
export const updateAgentCase = (visaApplicationId, payload, token) => request('PUT', `/agents/cases/${visaApplicationId}`, payload, token)

// ── Visa Applications ─────────────────────────────────────────────
export const createVisaApplication  = (payload, token)             => request('POST', '/visa/', payload, token)
export const getVisaApplications    = (params, token)              => request('GET', `/visa/${buildQuery(params)}`, null, token)
export const getVisaApplication     = (applicationId, token)       => request('GET', `/visa/${applicationId}`, null, token)
export const updateVisaStatus       = (applicationId, payload, token) => request('PUT', `/visa/${applicationId}/status`, payload, token)
export const updateVisaApplication  = (applicationId, payload, token) => request('PUT', `/visa/${applicationId}`, payload, token)
export const deleteVisaApplication  = (applicationId, token)       => request('DELETE', `/visa/${applicationId}`, null, token)

// ── RAG / AI Q&A ──────────────────────────────────────────────────
export const askRag         = (payload, token)                     => request('POST', '/rag/ask', payload, token)
export const ingestDocument = (candidateId, documentId, token)     => request('POST', `/rag/ingest/${candidateId}/${documentId}`, null, token)
export const getRagChunks   = (candidateId, token)                 => request('GET', `/rag/candidates/${candidateId}/chunks`, null, token)

// ── Training Providers ────────────────────────────────────────────
export const createTrainingProvider  = (payload, token)            => request('POST', '/training/provider', payload, token)
export const getTrainingProviders    = ()                          => request('GET', '/training/provider')
export const getTrainingProvider     = (providerId)                => request('GET', `/training/provider/${providerId}`)
export const updateTrainingProvider  = (providerId, payload, token) => request('PUT', `/training/provider/${providerId}`, payload, token)
export const deleteTrainingProvider  = (providerId, token)         => request('DELETE', `/training/provider/${providerId}`, null, token)
export const createCourse            = (providerId, payload, token) => request('POST', `/training/provider/${providerId}/courses`, payload, token)
export const getCourses              = (params)                    => request('GET', `/training/courses${buildQuery(params)}`)
export const getCourse               = (courseId)                  => request('GET', `/training/courses/${courseId}`)
export const updateCourse            = (courseId, payload, token)  => request('PUT', `/training/courses/${courseId}`, payload, token)
export const deleteCourse            = (courseId, token)           => request('DELETE', `/training/courses/${courseId}`, null, token)
export const recommendCourse         = (candidateId, courseId, token) => request('POST', `/training/recommend/${candidateId}/${courseId}`, null, token)
export const getCandidateRecommendations = (candidateId, token)    => request('GET', `/training/recommend/${candidateId}`, null, token)
export const deleteRecommendation    = (recommendationId, token)   => request('DELETE', `/training/recommend/${recommendationId}`, null, token)

// ── Token helpers ─────────────────────────────────────────────────
export const saveToken  = (token) => localStorage.setItem('access_token', token)
export const getToken   = ()      => localStorage.getItem('access_token')
export const clearToken = ()      => localStorage.removeItem('access_token')
