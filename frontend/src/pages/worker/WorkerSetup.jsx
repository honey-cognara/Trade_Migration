import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createCandidateProfile, updateCandidateProfile, getToken } from '../../services/api'
import './WorkerSetup.css'

/* ─── Decorative blobs & circles ─────────────────────────────── */
function Blobs() {
  return (
    <>
      {/* Corner blobs */}
      <div className="ws-blob ws-blob-tl" />
      <div className="ws-blob ws-blob-br" />
      {/* Orange accent circles */}
      <div className="ws-circle" style={{ top: 60, left: 80, width: 28, height: 28, borderWidth: 3 }} />
      <div className="ws-circle" style={{ top: 110, left: 148, width: 12, height: 12, borderWidth: 2 }} />
      <div className="ws-dot"   style={{ top: 155, left: 88 }} />
      <div className="ws-circle" style={{ bottom: 80, right: 120, width: 32, height: 32, borderWidth: 3 }} />
      <div className="ws-circle" style={{ bottom: 50, right: 200, width: 14, height: 14, borderWidth: 2 }} />
      <div className="ws-dot"   style={{ bottom: 140, right: 84 }} />
    </>
  )
}

/* ─── Left step sidebar ───────────────────────────────────────── */
function StepSidebar({ current }) {
  const steps = [
    { n: 1, label: 'Step 1', sub: 'Personal Identity' },
    { n: 2, label: 'Step 2', sub: 'Experience & Skills' },
    { n: 3, label: 'Step 3', sub: 'Career Preferences' },
  ]
  return (
    <div className="ws-sidebar">
      {steps.map((s, i) => {
        const done    = s.n < current
        const active  = s.n === current
        return (
          <div key={s.n} className="ws-sidebar-item">
            {/* connector line above (skip first) */}
            {i > 0 && (
              <div className={`ws-connector ${steps[i - 1].n < current ? 'ws-connector-done' : ''}`} />
            )}
            <div className="ws-sidebar-row">
              <div className={`ws-step-dot ${done ? 'done' : active ? 'active' : ''}`}>
                {done ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <div className={`ws-step-inner ${active ? 'active' : ''}`} />
                )}
              </div>
              <div>
                <div className={`ws-step-label ${active || done ? 'active' : ''}`}>{s.label}</div>
                <div className="ws-step-sub">{s.sub}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Illustrations ───────────────────────────────────────────── */
const ILLUS = {
  1: (
    <svg viewBox="0 0 260 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="ws-illus-svg">
      {/* Green circle bg */}
      <circle cx="160" cy="180" r="110" fill="#d4edda" />
      {/* Leaves */}
      <ellipse cx="100" cy="240" rx="30" ry="50" fill="#8fbc8f" transform="rotate(-20 100 240)" />
      <ellipse cx="210" cy="230" rx="25" ry="45" fill="#8fbc8f" transform="rotate(15 210 230)" />
      {/* Body */}
      <rect x="120" y="185" width="60" height="80" rx="8" fill="#2d2d2d" />
      {/* Head */}
      <circle cx="150" cy="165" r="32" fill="#c68642" />
      {/* Hair */}
      <ellipse cx="150" cy="140" rx="32" ry="18" fill="#1a1a1a" />
      <ellipse cx="178" cy="158" rx="10" ry="22" fill="#1a1a1a" transform="rotate(10 178 158)" />
      {/* Collar / jacket detail */}
      <rect x="135" y="185" width="12" height="20" rx="3" fill="#e87b3a" />
      {/* Arms */}
      <rect x="100" y="190" width="22" height="50" rx="10" fill="#2d2d2d" />
      <rect x="178" y="190" width="22" height="50" rx="10" fill="#2d2d2d" />
      {/* Hands */}
      <circle cx="111" cy="242" r="10" fill="#c68642" />
      <circle cx="189" cy="242" r="10" fill="#c68642" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 260 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="ws-illus-svg">
      <circle cx="155" cy="185" r="105" fill="#c8e6c9" />
      {/* Books stack illustration */}
      <rect x="80" y="200" width="130" height="18" rx="4" fill="#5c8a5c" />
      <rect x="85" y="182" width="120" height="18" rx="4" fill="#7ab87a" />
      <rect x="90" y="164" width="110" height="18" rx="4" fill="#9acd9a" />
      {/* Person */}
      <circle cx="185" cy="140" r="28" fill="#f0c490" />
      <rect x="165" y="168" width="42" height="65" rx="8" fill="#4a7c59" />
      <rect x="148" y="172" width="18" height="48" rx="8" fill="#4a7c59" />
      <rect x="205" y="172" width="18" height="48" rx="8" fill="#4a7c59" />
      <circle cx="157" cy="220" r="9" fill="#f0c490" />
      <circle cx="214" cy="220" r="9" fill="#f0c490" />
      {/* Hair */}
      <ellipse cx="185" cy="118" rx="28" ry="14" fill="#2d2d2d" />
      {/* Scarf */}
      <rect x="168" y="168" width="36" height="10" rx="4" fill="#b8d8b8" />
    </svg>
  ),
  3: (
    <svg viewBox="0 0 260 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="ws-illus-svg">
      {/* Checklist bg lines */}
      <rect x="60" y="100" width="140" height="12" rx="6" fill="#ddd" />
      <rect x="60" y="125" width="140" height="12" rx="6" fill="#ddd" />
      <rect x="60" y="150" width="100" height="12" rx="6" fill="#c94040" />
      <circle cx="192" cy="106" r="14" fill="#e87b3a" />
      <path d="M186 106 L190 110 L198 102" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="192" cy="131" r="14" fill="#e87b3a" />
      <path d="M186 131 L190 135 L198 127" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="192" cy="156" r="14" fill="#e87b3a" />
      <path d="M186 156 L190 160 L198 152" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Person */}
      <circle cx="150" cy="215" r="28" fill="#f5c5a3" />
      <rect x="130" y="243" width="42" height="55" rx="8" fill="#e0e0e0" />
      <rect x="112" y="248" width="20" height="42" rx="8" fill="#e0e0e0" />
      <rect x="170" y="248" width="20" height="42" rx="8" fill="#e0e0e0" />
      <circle cx="122" cy="290" r="8" fill="#f5c5a3" />
      {/* Pointing arm */}
      <rect x="168" y="248" width="38" height="16" rx="8" fill="#e0e0e0" transform="rotate(-30 168 248)" />
      <circle cx="200" cy="237" r="9" fill="#f5c5a3" />
      {/* Hair */}
      <ellipse cx="150" cy="194" rx="28" ry="14" fill="#6d4c41" />
    </svg>
  ),
}

/* ─── STEP 1 ─────────────────────────────────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.full_name?.trim())         e.full_name = 'Please enter your full name.'
    if (!data.professional_title?.trim()) e.professional_title = 'Please enter your professional title.'
    if (!data.years_experience && data.years_experience !== 0) e.years_experience = 'Please select years of experience.'
    return e
  }

  function blur(field) { setTouched(p => ({ ...p, [field]: true })) }

  function handleNext() {
    const all = { full_name: true, professional_title: true, years_experience: true }
    setTouched(all)
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  const err = (f) => touched[f] && errors[f]

  return (
    <div className="ws-card">
      <h2 className="ws-card-title">Tell us about yourself</h2>
      <p className="ws-card-sub">Create your professional profile to start matching with world-class companies and trainers.</p>

      <div className="ws-field">
        <label>Full Name</label>
        <input className={`ws-input${err('full_name') ? ' ws-input-err' : ''}`} type="text"
          placeholder="Enter Your Full Name"
          value={data.full_name || ''}
          onChange={e => onChange('full_name', e.target.value)}
          onBlur={() => blur('full_name')} />
        {err('full_name') && <span className="ws-err">{errors.full_name}</span>}
      </div>

      <div className="ws-field">
        <label>Professional Title</label>
        <input className={`ws-input${err('professional_title') ? ' ws-input-err' : ''}`} type="text"
          placeholder="Enter Your Professional Title"
          value={data.professional_title || ''}
          onChange={e => onChange('professional_title', e.target.value)}
          onBlur={() => blur('professional_title')} />
        {err('professional_title') && <span className="ws-err">{errors.professional_title}</span>}
      </div>

      <div className="ws-field">
        <label>Years of Experience</label>
        <div className="ws-select-wrap">
          <select className={`ws-input ws-select${err('years_experience') ? ' ws-input-err' : ''}`}
            value={data.years_experience ?? ''}
            onChange={e => onChange('years_experience', e.target.value === '' ? null : parseInt(e.target.value))}
            onBlur={() => blur('years_experience')}>
            <option value="">Select Years of Experience</option>
            {[...Array(11)].map((_, i) => (
              <option key={i} value={i}>{i === 0 ? 'Less than 1 year' : i === 10 ? '10+ years' : `${i} year${i > 1 ? 's' : ''}`}</option>
            ))}
          </select>
          <span className="ws-select-arrow">▾</span>
        </div>
        {err('years_experience') && <span className="ws-err">{errors.years_experience}</span>}
      </div>

      <button className="ws-btn" onClick={handleNext}>Next Step</button>
    </div>
  )
}

/* ─── STEP 2 ─────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  const [skillHaveInput, setSkillHaveInput] = useState('')
  const [skillWantInput, setSkillWantInput] = useState('')
  const [fileName, setFileName] = useState('')

  const SKILL_SUGGESTIONS = [
    'Electrical Installation', 'Fault Finding', 'Solar / Renewable', 'PLC Programming',
    'HV Systems', 'Industrial Automation', 'SCADA', 'Motor Control', 'Instrumentation',
    'Data & Communications', 'Fire Alarm Systems', 'Earthing & Bonding',
  ]

  function filteredHave() {
    if (!skillHaveInput) return []
    return SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(skillHaveInput.toLowerCase()) && !(data.skills_have || []).includes(s))
  }
  function filteredWant() {
    if (!skillWantInput) return []
    return SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(skillWantInput.toLowerCase()) && !(data.skills_want || []).includes(s))
  }

  function addHave(s) { onChange('skills_have', [...(data.skills_have || []), s]); setSkillHaveInput('') }
  function removeHave(s) { onChange('skills_have', (data.skills_have || []).filter(x => x !== s)) }
  function addWant(s) { onChange('skills_want', [...(data.skills_want || []), s]); setSkillWantInput('') }
  function removeWant(s) { onChange('skills_want', (data.skills_want || []).filter(x => x !== s)) }

  function handleKeyHave(e) { if (e.key === 'Enter' && skillHaveInput.trim()) { addHave(skillHaveInput.trim()); e.preventDefault() } }
  function handleKeyWant(e) { if (e.key === 'Enter' && skillWantInput.trim()) { addWant(skillWantInput.trim()); e.preventDefault() } }

  return (
    <div className="ws-card">
      <h2 className="ws-card-title">What are your core strengths?</h2>
      <p className="ws-card-sub">Add your skills so we can show you the most relevant job opportunities and training paths.</p>

      <div className="ws-field">
        <label>Skills you have</label>
        <div className="ws-skill-box">
          {(data.skills_have || []).map(s => (
            <span key={s} className="ws-chip">{s} <button onClick={() => removeHave(s)} className="ws-chip-x">×</button></span>
          ))}
          <input className="ws-skill-input" type="text" placeholder="Search skill"
            value={skillHaveInput}
            onChange={e => setSkillHaveInput(e.target.value)}
            onKeyDown={handleKeyHave} />
        </div>
        {filteredHave().length > 0 && (
          <div className="ws-suggestions">
            {filteredHave().slice(0, 5).map(s => (
              <div key={s} className="ws-suggestion-item" onClick={() => addHave(s)}>{s}</div>
            ))}
          </div>
        )}
      </div>

      <div className="ws-field">
        <label>Skills you want to learn</label>
        <div className="ws-skill-box">
          {(data.skills_want || []).map(s => (
            <span key={s} className="ws-chip ws-chip-want">{s} <button onClick={() => removeWant(s)} className="ws-chip-x">×</button></span>
          ))}
          <input className="ws-skill-input" type="text" placeholder="Search skill"
            value={skillWantInput}
            onChange={e => setSkillWantInput(e.target.value)}
            onKeyDown={handleKeyWant} />
        </div>
        {filteredWant().length > 0 && (
          <div className="ws-suggestions">
            {filteredWant().slice(0, 5).map(s => (
              <div key={s} className="ws-suggestion-item" onClick={() => addWant(s)}>{s}</div>
            ))}
          </div>
        )}
      </div>

      <div className="ws-field">
        <div className={`ws-upload-area${fileName ? ' ws-upload-done' : ''}`}
          onClick={() => document.getElementById('ws-resume-input').click()}>
          <input id="ws-resume-input" type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { setFileName(e.target.files[0].name); onChange('resume_file', e.target.files[0]) } }} />
          <div className="ws-upload-icon">
            {fileName ? '✓' : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b8f5e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            )}
          </div>
          <div className="ws-upload-title">{fileName || 'Upload Resume (PDF)'}</div>
          <div className="ws-upload-hint">{fileName ? 'Click to change' : 'Drag or Click to Browse'}</div>
        </div>
      </div>

      <button className="ws-btn" onClick={onNext}>Next Step</button>
      <button className="ws-btn-ghost" onClick={onBack}>Go Back</button>
    </div>
  )
}

/* ─── STEP 3 ─────────────────────────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  const [showModal, setShowModal] = useState(false)

  async function handleFinish() {
    await onFinish(() => setShowModal(true))
  }

  return (
    <>
      <div className="ws-card">
        <h2 className="ws-card-title">What are you looking for?</h2>
        <p className="ws-card-sub">Define your ideal role so we can find the perfect match for your next career move.</p>

        <div className="ws-field">
          <label>Preferred Role Type</label>
          <div className="ws-select-wrap">
            <select className="ws-input ws-select"
              value={data.preferred_role_type || ''}
              onChange={e => onChange('preferred_role_type', e.target.value)}>
              <option value="">Choose role type</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="casual">Casual</option>
              <option value="fifo">Fly-in Fly-out (FIFO)</option>
            </select>
            <span className="ws-select-arrow">▾</span>
          </div>
        </div>

        <div className="ws-field">
          <label>Expected Salary/Rate</label>
          <input className="ws-input" type="text"
            placeholder="Enter amount or range"
            value={data.expected_salary || ''}
            onChange={e => onChange('expected_salary', e.target.value)} />
        </div>

        <div className="ws-field">
          <label>Availability</label>
          <div className="ws-select-wrap">
            <select className="ws-input ws-select"
              value={data.availability || ''}
              onChange={e => onChange('availability', e.target.value)}>
              <option value="">Choose availability</option>
              <option value="immediately">Immediately</option>
              <option value="1_month">Within 1 month</option>
              <option value="3_months">Within 3 months</option>
              <option value="6_months">Within 6 months</option>
            </select>
            <span className="ws-select-arrow">▾</span>
          </div>
        </div>

        <button className="ws-btn" onClick={handleFinish} disabled={loading}>
          {loading ? <><span className="ws-spinner" /> Saving…</> : 'Finish Setup'}
        </button>
        <button className="ws-btn-ghost" onClick={onBack}>Go Back</button>
      </div>

      {/* ─── Success Modal ─── */}
      {showModal && (
        <div className="ws-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ws-modal" onClick={e => e.stopPropagation()}>
            <div className="ws-modal-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {/* Confetti dots */}
            <div className="ws-confetti">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="ws-confetti-dot" style={{
                  left: `${10 + (i % 4) * 25}%`,
                  top: `${5 + Math.floor(i / 4) * 20}%`,
                  background: i % 3 === 0 ? '#e87b3a' : i % 3 === 1 ? '#6b8f5e' : '#f5c518',
                  animationDelay: `${i * 0.1}s`
                }} />
              ))}
            </div>
            <h3 className="ws-modal-title">Your profile is ready for growth!</h3>
            <p className="ws-modal-sub">
              You're now visible to world-class companies. Start exploring curated job opportunities and training paths tailored to your goals.
            </p>
            <button className="ws-btn ws-modal-btn" onClick={() => window.location.href = '/dashboard'}>
              Explore Opportunities
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function WorkerSetup() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = parseInt(stepParam) || 1

  const [data, setData] = useState({ skills_have: [], skills_want: [] })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  function onChange(field, val) { setData(p => ({ ...p, [field]: val })) }
  function goTo(n) { navigate(`/setup/worker/${n}`) }

  async function handleFinish(onSuccess) {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true); setApiError('')
    const payload = {
      full_name: data.full_name,
      trade_category: data.trade_category || 'other',
      years_experience: data.years_experience || 0,
      nationality: data.nationality || '',
      country_of_residence: data.country_of_residence || '',
      is_electrical_worker: false,
      languages: [{ name: 'English', level: 'Unknown' }],
      work_types: [],
      published: false,
    }
    try {
      try { await createCandidateProfile(payload, token) }
      catch (e) { if (e.status === 400) await updateCandidateProfile(payload, token); else throw e }
      onSuccess()
    } catch (err) {
      setApiError(err.detail || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ws-page">
      <Blobs />

      <div className="ws-layout">
        {/* Left: Step sidebar */}
        <StepSidebar current={step} />

        {/* Center: Card */}
        <div className="ws-center">
          {apiError && <div className="ws-api-error">{apiError}</div>}
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => goTo(2)} loading={loading} />}
        </div>

        {/* Right: Illustration */}
        <div className="ws-illus">
          {ILLUS[step] || ILLUS[1]}
        </div>
      </div>
    </div>
  )
}
