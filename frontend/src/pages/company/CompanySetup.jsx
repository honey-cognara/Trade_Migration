import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCompany, updateCompany, getToken } from '../../services/api'

import illusBusinesswoman from '../../assets/illus-businesswoman.svg'
import illusTeamSpirit    from '../../assets/illus-team-spirit.svg'
import illusHiring        from '../../assets/illus-hiring.svg'
import radioChecked       from '../../assets/radio-checked.svg'
import radioUnchecked     from '../../assets/radio-unchecked.svg'
import cornerBL           from '../../assets/corner-bl-fp.svg'
import cornerTR           from '../../assets/corner-tr-fp.svg'
import confettiGroup      from '../../assets/confetti-group-cs.svg'
import confettiGroup1     from '../../assets/confetti-group1-cs.svg'
import confettiGroup2     from '../../assets/confetti-group2-cs.svg'
import confettiGroup3     from '../../assets/confetti-group3-cs.svg'

/* ── LocalStorage helpers ── */
const LS_KEY = 'company_setup'
function loadData() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} } }
function saveData(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {} }

const font = "'Urbanist', sans-serif"

const STEPS = [
  { label: 'Business Identity',       sub: 'Your company basics'        },
  { label: 'How big is your team?',   sub: 'Team size & description'    },
  { label: 'Hiring Priorities',       sub: 'Skills you are looking for' },
]

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a7380' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`

/* ── Sidebar ── */
function StepSidebar({ current }) {
  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEPS.map((s, i) => {
        const n = i + 1
        const active = n <= current
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src={active ? radioChecked : radioUnchecked} alt=""
                style={{ width: 24, height: 24, flexShrink: 0 }} />
              <div>
                <p style={{
                  fontFamily: font, fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3,
                  color: active ? '#403c8b' : '#8280a7',
                }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: font, fontSize: 14, fontWeight: 400, margin: 0, lineHeight: 1.3,
                  color: active ? '#6a7380' : '#b0aec8',
                }}>
                  {s.sub}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 2, height: 32,
                background: n < current ? '#403c8b' : '#e0dff0',
                marginLeft: 11, marginTop: 4, marginBottom: 4,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Shared styles ── */
const iStyle = {
  height: 56, padding: '16px 20px',
  border: '1px solid #6a7380', borderRadius: 12, background: '#fff',
  fontFamily: font, fontSize: 16, fontWeight: 400, color: '#343434',
  outline: 'none', boxSizing: 'border-box', width: '100%', lineHeight: 1.3,
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: '#343434', lineHeight: 1.3 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrMsg({ msg }) {
  return msg ? <p style={{ color: '#ef4444', fontSize: 13, margin: 0, fontFamily: font }}>{msg}</p> : null
}

function NextBtn({ loading, label, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: '100%', height: 53, background: '#5379f4', color: '#fff',
      border: 'none', borderRadius: 12,
      fontFamily: font, fontSize: 16, fontWeight: 600, lineHeight: 1.3,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
      boxShadow: '0 4px 13.6px 0 #97b6fd', transition: 'background 0.18s',
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', width: '100%',
      fontFamily: font, fontSize: 16, fontWeight: 600,
      color: '#403c8b', textDecoration: 'underline',
      cursor: 'pointer', lineHeight: 1.3, padding: 0,
    }}>
      Go Back
    </button>
  )
}

/* ── STEP 1 — Business Identity ── */
function Step1({ data, onChange, onNext }) {
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.company_name?.trim()) e.company_name = 'Legal business name is required.'
    if (!data.industry?.trim())     e.industry     = 'Industry is required.'
    return e
  }

  function handleNext() {
    setTouched({ company_name: true, industry: true })
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  const err = f => touched[f] && errors[f]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: '#343434', margin: '0 0 8px', lineHeight: 1.3 }}>
          Tell us about your company.
        </p>
        <p style={{ fontFamily: font, fontSize: 16, color: '#6a7380', margin: 0, lineHeight: 1.5 }}>
          Let's set up your business profile to help you find the right talent and expert trainers.
        </p>
      </div>

      <Field label="Legal Business Name">
        <input type="text" placeholder="Enter Legal Business Name"
          value={data.company_name || ''}
          onChange={e => { onChange('company_name', e.target.value); setErrors(p => ({ ...p, company_name: '' })) }}
          onBlur={() => setTouched(p => ({ ...p, company_name: true }))}
          style={{ ...iStyle, borderColor: err('company_name') ? '#ef4444' : '#6a7380' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur2={e => { e.target.style.boxShadow = 'none' }}
        />
        <ErrMsg msg={err('company_name')} />
      </Field>

      <Field label="ABN (Australian Business Number)">
        <input type="text" placeholder="Enter 11-digit ABN"
          value={data.abn || ''}
          onChange={e => onChange('abn', e.target.value)}
          style={iStyle}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <Field label="Industry">
        <input type="text" placeholder="e.g. Construction, Electrical"
          value={data.industry || ''}
          onChange={e => { onChange('industry', e.target.value); setErrors(p => ({ ...p, industry: '' })) }}
          onBlur={() => setTouched(p => ({ ...p, industry: true }))}
          style={{ ...iStyle, borderColor: err('industry') ? '#ef4444' : '#6a7380' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
        />
        <ErrMsg msg={err('industry')} />
      </Field>

      <Field label="Company Website">
        <input type="text" placeholder="https://yourcompany.com"
          value={data.website_url || ''}
          onChange={e => onChange('website_url', e.target.value)}
          style={iStyle}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <NextBtn label="Next Step" onClick={handleNext} />
    </div>
  )
}

/* ── STEP 2 — Team Size ── */
function Step2({ data, onChange, onNext, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: '#343434', margin: '0 0 8px', lineHeight: 1.3 }}>
          How big is your team?
        </p>
        <p style={{ fontFamily: font, fontSize: 16, color: '#6a7380', margin: 0, lineHeight: 1.5 }}>
          This helps us understand your company's scale and matching needs.
        </p>
      </div>

      <Field label="Employee count">
        <select value={data.employee_count || ''}
          onChange={e => onChange('employee_count', e.target.value)}
          style={{ ...iStyle, appearance: 'none', backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.2rem center' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        >
          <option value="">Choose Employee count</option>
          <option value="1-10">1–10</option>
          <option value="11-50">11–50</option>
          <option value="51-200">51–200</option>
          <option value="201-500">201–500</option>
          <option value="500+">500+</option>
        </select>
      </Field>

      <Field label="Business description">
        <textarea placeholder="Tell us a bit about what your company does…"
          rows={5}
          value={data.description || ''}
          onChange={e => onChange('description', e.target.value)}
          style={{ ...iStyle, height: 'auto', resize: 'none', paddingTop: 16, paddingBottom: 16 }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <NextBtn label="Next Step" onClick={onNext} />
      <BackBtn onClick={onBack} />
    </div>
  )
}

/* ── STEP 3 — Hiring Priorities ── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: '#343434', margin: '0 0 8px', lineHeight: 1.3 }}>
          What skills are you looking for?
        </p>
        <p style={{ fontFamily: font, fontSize: 16, color: '#6a7380', margin: 0, lineHeight: 1.5 }}>
          Select the skills and expertise levels you are currently looking to hire.
        </p>
      </div>

      <Field label="What skills are you looking for?">
        <input type="text" placeholder="e.g. Electrical, Plumbing, HVAC"
          value={data.skills_input || ''}
          onChange={e => onChange('skills_input', e.target.value)}
          style={iStyle}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <Field label="What level of expertise do you need?">
        <select value={data.expertise_level || ''}
          onChange={e => onChange('expertise_level', e.target.value)}
          style={{ ...iStyle, appearance: 'none', backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.2rem center' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        >
          <option value="">Choose Expertise level</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="executive">Executive</option>
        </select>
      </Field>

      <Field label="What is the nature of the work?">
        <select value={data.work_nature || ''}
          onChange={e => onChange('work_nature', e.target.value)}
          style={{ ...iStyle, appearance: 'none', backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.2rem center' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        >
          <option value="">Choose nature of work</option>
          <option value="on_site">On-site</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="flexible">Flexible</option>
        </select>
      </Field>

      <NextBtn loading={loading} label="Finish Setup" onClick={onFinish} />
      <BackBtn onClick={onBack} />
    </div>
  )
}

/* ── Success Modal ── */
function SuccessModal({ onDashboard }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(53,53,53,0.63)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '2.5rem 2rem',
        maxWidth: 460, width: '100%', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <img src={confettiGroup}  alt="" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0,    width: 120, pointerEvents: 'none' }} />
        <img src={confettiGroup1} alt="" aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0,   width: 120, pointerEvents: 'none' }} />
        <img src={confettiGroup2} alt="" aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0,  width: 100, pointerEvents: 'none' }} />
        <img src={confettiGroup3} alt="" aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 100, pointerEvents: 'none' }} />

        <div style={{
          width: 88, height: 88, borderRadius: '50%', background: '#f26f37',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.2rem', position: 'relative', zIndex: 1,
        }}>
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
            <path d="M3 16L15 28L37 4" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: '#343434', margin: '0 0 8px', position: 'relative', zIndex: 1, lineHeight: 1.3 }}>
          Your company profile is ready!
        </p>
        <p style={{ fontFamily: font, fontSize: 16, color: '#6a7380', margin: '0 0 24px', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
          You're all set. Now you can start exploring top-tier talent and professional
          trainers tailored to your needs.
        </p>
        <button onClick={onDashboard} style={{
          width: '100%', height: 53, background: '#5379f4', color: '#fff',
          border: 'none', borderRadius: 12,
          fontFamily: font, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 13.6px 0 #97b6fd', position: 'relative', zIndex: 1, lineHeight: 1.3,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4264d6' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

/* ── Main Component ── */
export function CompanySetup() {
  const navigate = useNavigate()
  const [step,      setStep]      = useState(1)
  const [data,      setData]      = useState(() => loadData())
  const [loading,   setLoading]   = useState(false)
  const [apiError,  setApiError]  = useState('')
  const [showModal, setShowModal] = useState(false)

  function onChange(field, val) {
    setData(prev => { const n = { ...prev, [field]: val }; saveData(n); return n })
  }

  async function handleFinish() {
    const token = localStorage.getItem('access_token') || getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true); setApiError('')
    const payload = {
      company_name:        data.company_name || '',
      industry:            data.industry || '',
      contact_name:        data.company_name || '',
      contact_email:       '',
      website_url:         data.website_url || null,
      abn_or_identifier:   data.abn || '',
    }
    try {
      try { await createCompany(payload, token) }
      catch (e) {
        if (e.status === 400 || e.status === 409) await updateCompany(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      setShowModal(true)
    } catch (err) {
      setApiError(err?.detail || 'Failed to save company profile. Please try again.')
    } finally { setLoading(false) }
  }

  const ILLUS = [illusBusinesswoman, illusTeamSpirit, illusHiring]

  return (
    <div style={{
      background: '#fbfbfb', minHeight: '100vh',
      position: 'relative', overflow: 'hidden', fontFamily: font,
    }}>
      <img src={cornerBL} alt="" aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0,  width: 368, height: 396, pointerEvents: 'none', zIndex: 0 }} />
      <img src={cornerTR} alt="" aria-hidden="true" style={{ position: 'absolute', top: 0,  right: 0, width: 446, height: 401, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: '100%', maxWidth: 1200, margin: '2rem auto',
          padding: '0 60px', display: 'flex', alignItems: 'center', gap: '3rem',
        }}>
          <StepSidebar current={step} />

          <div style={{
            width: 551, flexShrink: 0,
            background: 'rgba(230,241,255,0.94)',
            backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
            borderRadius: 16, padding: 32,
          }}>
            {apiError && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
                borderRadius: 8, padding: '0.55rem 0.8rem', fontSize: 14, fontFamily: font, marginBottom: 16,
              }}>
                {apiError}
              </div>
            )}
            {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => { setApiError(''); setStep(2) }} />}
            {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => { setApiError(''); setStep(3) }} onBack={() => setStep(1)} />}
            {step === 3 && <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => setStep(2)} loading={loading} />}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={ILLUS[step - 1]} alt="" style={{ width: '100%', maxWidth: 460, height: 'auto' }} />
          </div>
        </div>
      </div>

      {showModal && (
        <SuccessModal onDashboard={() => { setShowModal(false); navigate('/dashboard', { replace: true }) }} />
      )}
    </div>
  )
}
