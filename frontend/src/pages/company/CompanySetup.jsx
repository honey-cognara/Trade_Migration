import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createCompany, updateCompany, getToken } from '../../services/api'
import './CompanySetup.css'

/* ─── Decorative blobs & circles (same language as Worker) ───── */
function Blobs() {
  return (
    <>
      <div className="cs-blob cs-blob-tl" />
      <div className="cs-blob cs-blob-br" />
      <div className="cs-circle" style={{ top: 48,  left: 72,  width: 30, height: 30, borderWidth: 3 }} />
      <div className="cs-circle" style={{ top: 96,  left: 140, width: 12, height: 12, borderWidth: 2 }} />
      <div className="cs-dot"   style={{ top: 148, left: 84 }} />
      <div className="cs-circle" style={{ bottom: 72,  right: 110, width: 32, height: 32, borderWidth: 3 }} />
      <div className="cs-circle" style={{ bottom: 44,  right: 195, width: 14, height: 14, borderWidth: 2 }} />
      <div className="cs-dot"   style={{ bottom: 130, right: 78 }} />
    </>
  )
}

/* ─── Left sidebar stepper ───────────────────────────────────── */
function StepSidebar({ current }) {
  const steps = [
    { n: 1, label: 'Step 1', sub: 'Business Identity' },
    { n: 2, label: 'Step 2', sub: 'How big is your team?' },
    { n: 3, label: 'Step 3', sub: 'Hiring Priorities' },
  ]
  return (
    <div className="cs-sidebar">
      {steps.map((s, i) => {
        const done   = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="cs-sidebar-item">
            {i > 0 && <div className={`cs-connector${steps[i - 1].n < current ? ' cs-connector-done' : ''}`} />}
            <div className="cs-sidebar-row">
              <div className={`cs-step-dot${done ? ' done' : active ? ' active' : ''}`}>
                {done ? (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <div className={`cs-step-inner${active ? ' active' : ''}`} />
                )}
              </div>
              <div>
                <div className={`cs-step-label${active || done ? ' active' : ''}`}>{s.label}</div>
                <div className="cs-step-sub">{s.sub}</div>
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
  /* Step 1: Businesswoman with bag */
  1: (
    <svg viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-illus-svg">
      {/* Yellow-green ground blob */}
      <ellipse cx="200" cy="310" rx="90" ry="38" fill="#dff0d0" />
      {/* Teal mountain shapes */}
      <polygon points="155,240 195,185 235,240" fill="#5bc8c0" opacity="0.7" />
      <polygon points="175,240 208,195 240,240" fill="#7dd8d0" opacity="0.5" />
      <polygon points="130,240 165,200 200,240" fill="#9ae8e0" opacity="0.4" />
      {/* Shadow */}
      <ellipse cx="185" cy="305" rx="45" ry="12" fill="#c8dcc8" opacity="0.6" />
      {/* Legs */}
      <rect x="163" y="255" width="18" height="55" rx="8" fill="#1a1a2e" />
      <rect x="188" y="255" width="18" height="55" rx="8" fill="#1a1a2e" />
      {/* Shoes */}
      <ellipse cx="172" cy="312" rx="12" ry="5" fill="#0d0d1a" />
      <ellipse cx="197" cy="312" rx="12" ry="5" fill="#0d0d1a" />
      {/* Body / blazer */}
      <rect x="148" y="175" width="68" height="85" rx="12" fill="#1a1a2e" />
      {/* Blazer lapel */}
      <polygon points="175,175 182,200 168,200" fill="#2a2a4e" />
      <polygon points="189,175 182,200 196,200" fill="#2a2a4e" />
      {/* Left arm (natural hang) */}
      <rect x="130" y="178" width="20" height="55" rx="10" fill="#1a1a2e" />
      <circle cx="140" cy="235" r="11" fill="#b07040" />
      {/* Right arm (holding bag strap) */}
      <rect x="214" y="178" width="20" height="50" rx="10" fill="#1a1a2e" />
      <circle cx="224" cy="230" r="11" fill="#b07040" />
      {/* Orange bag */}
      <rect x="215" y="220" width="48" height="38" rx="8" fill="#e87b3a" />
      <rect x="220" y="212" width="38" height="14" rx="5" fill="#c85a1a" />
      <rect x="225" y="232" width="28" height="3" rx="1.5" fill="#c85a1a" />
      {/* Bag handle */}
      <path d="M228 212 Q239 200 250 212" stroke="#c85a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <rect x="176" y="155" width="12" height="24" rx="6" fill="#b07040" />
      {/* Head */}
      <circle cx="182" cy="140" r="30" fill="#b07040" />
      {/* Hair - ponytail */}
      <ellipse cx="182" cy="116" rx="30" ry="16" fill="#1a1a1a" />
      <ellipse cx="210" cy="130" rx="8" ry="20" fill="#1a1a1a" transform="rotate(15 210 130)" />
      <path d="M208 125 Q225 138 218 160" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Face features */}
      <circle cx="175" cy="140" r="3" fill="#7a4820" />
      <circle cx="189" cy="140" r="3" fill="#7a4820" />
      <path d="M177 150 Q182 155 187 150" stroke="#7a4820" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),

  /* Step 2: Two colleagues walking */
  2: (
    <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-illus-svg">
      {/* Yellow-green ground blob */}
      <ellipse cx="180" cy="315" rx="110" ry="40" fill="#dff0d0" />
      {/* Teal mountain top */}
      <polygon points="200,160 225,125 250,160" fill="#5bc8c0" opacity="0.6" />
      <polygon points="215,160 235,130 255,160" fill="#7dd8d0" opacity="0.4" />
      {/* Shadows */}
      <ellipse cx="130" cy="308" rx="38" ry="11" fill="#c8dcc8" opacity="0.5" />
      <ellipse cx="210" cy="310" rx="38" ry="11" fill="#c8dcc8" opacity="0.5" />

      {/* ── Woman (left) ── */}
      {/* Legs */}
      <rect x="110" y="252" width="16" height="58" rx="7" fill="#1a1a2e" />
      <rect x="132" y="252" width="16" height="58" rx="7" fill="#1a1a2e" />
      <ellipse cx="118" cy="312" rx="11" ry="5" fill="#0d0d1a" />
      <ellipse cx="140" cy="312" rx="11" ry="5" fill="#0d0d1a" />
      {/* Body */}
      <rect x="104" y="178" width="52" height="78" rx="10" fill="#f0f0f0" />
      {/* Collar detail */}
      <rect x="124" y="178" width="12" height="18" rx="4" fill="#e0e0e0" />
      {/* Arms */}
      <rect x="88"  y="182" width="18" height="45" rx="8" fill="#f0f0f0" />
      <rect x="154" y="182" width="18" height="45" rx="8" fill="#f0f0f0" />
      <circle cx="97"  cy="228" r="10" fill="#d4956a" />
      <circle cx="163" cy="228" r="10" fill="#d4956a" />
      {/* Orange folder in hand */}
      <rect x="155" y="210" width="28" height="36" rx="5" fill="#e87b3a" />
      <rect x="155" y="210" width="28" height="8"  rx="5" fill="#c85a1a" />
      {/* Neck + head */}
      <rect x="124" y="158" width="12" height="22" rx="6" fill="#d4956a" />
      <circle cx="130" cy="143" r="27" fill="#d4956a" />
      {/* Hair bob */}
      <ellipse cx="130" cy="121" rx="27" ry="14" fill="#1a1a1a" />
      <ellipse cx="104" cy="137" rx="6" ry="14" fill="#1a1a1a" />
      <ellipse cx="156" cy="137" rx="6" ry="14" fill="#1a1a1a" />
      {/* Face */}
      <circle cx="123" cy="143" r="2.5" fill="#8a5030" />
      <circle cx="137" cy="143" r="2.5" fill="#8a5030" />
      <path d="M125 153 Q130 157 135 153" stroke="#8a5030" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* ── Man (right) ── */}
      {/* Legs */}
      <rect x="192" y="255" width="17" height="56" rx="7" fill="#2d2d2d" />
      <rect x="215" y="255" width="17" height="56" rx="7" fill="#2d2d2d" />
      <ellipse cx="200" cy="313" rx="12" ry="5" fill="#0d0d1a" />
      <ellipse cx="224" cy="313" rx="12" ry="5" fill="#0d0d1a" />
      {/* Body / vest */}
      <rect x="185" y="180" width="56" height="80" rx="10" fill="#3a3a5a" />
      {/* Shirt collar */}
      <rect x="205" y="180" width="14" height="20" rx="4" fill="#e8e8e8" />
      {/* Arms */}
      <rect x="168" y="184" width="19" height="48" rx="8" fill="#3a3a5a" />
      <rect x="239" y="184" width="19" height="48" rx="8" fill="#3a3a5a" />
      <circle cx="177" cy="233" r="10" fill="#7a5030" />
      <circle cx="249" cy="233" r="10" fill="#7a5030" />
      {/* Clipboard */}
      <rect x="236" y="198" width="34" height="44" rx="5" fill="#f0f0f0" />
      <rect x="236" y="198" width="34" height="8"  rx="5" fill="#c0c0c0" />
      <rect x="241" y="212" width="24" height="3" rx="1.5" fill="#e87b3a" />
      <rect x="241" y="220" width="24" height="3" rx="1.5" fill="#e87b3a" />
      <rect x="241" y="228" width="16" height="3" rx="1.5" fill="#c0c0c0" />
      {/* Neck + head */}
      <rect x="205" y="160" width="14" height="22" rx="7" fill="#7a5030" />
      <circle cx="212" cy="145" r="28" fill="#7a5030" />
      {/* Short hair */}
      <ellipse cx="212" cy="122" rx="28" ry="15" fill="#1a1a1a" />
      <ellipse cx="185" cy="140" rx="5" ry="13" fill="#1a1a1a" />
      <ellipse cx="239" cy="140" rx="5" ry="13" fill="#1a1a1a" />
      {/* Face */}
      <circle cx="205" cy="145" r="2.5" fill="#4a2a10" />
      <circle cx="219" cy="145" r="2.5" fill="#4a2a10" />
      <path d="M207 155 Q212 159 217 155" stroke="#4a2a10" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),

  /* Step 3: Profile cards stack with orange checkmark */
  3: (
    <svg viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-illus-svg">
      {/* Back card (lightest) */}
      <rect x="100" y="60"  width="165" height="105" rx="12" fill="#f0faf0" stroke="#d0e8d0" strokeWidth="1.5" />
      {/* Avatar circle on back card */}
      <circle cx="127" cy="95" r="20" fill="#e8f4e8" stroke="#d0e8d0" strokeWidth="1.5" />
      <circle cx="127" cy="87" r="9"  fill="#d4a070" />
      <ellipse cx="127" cy="106" rx="12" ry="8" fill="#3a3a5a" />
      {/* Text lines on back card */}
      <rect x="158" y="80" width="88" height="8"  rx="4" fill="#c8dcc8" />
      <rect x="158" y="96" width="70" height="6"  rx="3" fill="#e0e0e0" />
      <rect x="158" y="110" width="80" height="6" rx="3" fill="#e87b3a" opacity="0.7" />

      {/* Middle card */}
      <rect x="88" y="110" width="165" height="105" rx="12" fill="#f4fcf4" stroke="#c8dcc8" strokeWidth="1.5" />
      <circle cx="115" cy="147" r="22" fill="#e0f0e0" stroke="#c8dcc8" strokeWidth="1.5" />
      <circle cx="115" cy="138" r="10" fill="#c87050" />
      <ellipse cx="115" cy="158" rx="13" ry="9" fill="#2d2d4e" />
      <rect x="148" y="132" width="82" height="8"  rx="4" fill="#b8d0b8" />
      <rect x="148" y="148" width="65" height="6"  rx="3" fill="#e0e0e0" />
      <rect x="148" y="162" width="75" height="6"  rx="3" fill="#e87b3a" opacity="0.6" />

      {/* Front card (main, darker border) */}
      <rect x="72" y="160" width="168" height="108" rx="12" fill="#fff" stroke="#b0cca0" strokeWidth="2" />
      <circle cx="100" cy="200" r="24" fill="#d8ecd8" stroke="#b0cca0" strokeWidth="1.5" />
      <circle cx="100" cy="191" r="11" fill="#e87b3a" />
      <ellipse cx="100" cy="213" rx="14" ry="9" fill="#1a1a2e" />
      {/* Text lines front card */}
      <rect x="136" y="184" width="88" height="9"  rx="4.5" fill="#9ab89a" />
      <rect x="136" y="201" width="68" height="7"  rx="3.5" fill="#e0e0e0" />
      <rect x="136" y="216" width="80" height="7"  rx="3.5" fill="#e87b3a" opacity="0.5" />
      <rect x="136" y="230" width="55" height="5"  rx="2.5" fill="#d0d0d0" />

      {/* Large orange checkmark circle bottom-right */}
      <circle cx="248" cy="268" r="38" fill="#e87b3a" />
      <path d="M233 268 L244 279 L263 258" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

/* ─── STEP 1 ─────────────────────────────────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})
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

  const err = (f) => touched[f] && errors[f]

  return (
    <div className="cs-card">
      <h2 className="cs-card-title">Tell us about your company.</h2>
      <p className="cs-card-sub">Let's set up your business profile to help you find the right talent and expert trainers.</p>

      <div className="cs-field">
        <label>Legal Business Name</label>
        <input className={`cs-input${err('company_name') ? ' cs-input-err' : ''}`}
          type="text" placeholder="Enter Legal Business Name"
          value={data.company_name || ''}
          onChange={e => onChange('company_name', e.target.value)}
          onBlur={() => setTouched(p => ({ ...p, company_name: true }))} />
        {err('company_name') && <span className="cs-err">{errors.company_name}</span>}
      </div>

      <div className="cs-field">
        <label>Industry</label>
        <input className={`cs-input${err('industry') ? ' cs-input-err' : ''}`}
          type="text" placeholder="Enter Industry"
          value={data.industry || ''}
          onChange={e => onChange('industry', e.target.value)}
          onBlur={() => setTouched(p => ({ ...p, industry: true }))} />
        {err('industry') && <span className="cs-err">{errors.industry}</span>}
      </div>

      <div className="cs-field">
        <label>Company Website</label>
        <input className="cs-input" type="url" placeholder="Enter Company Website"
          value={data.website_url || ''}
          onChange={e => onChange('website_url', e.target.value)} />
      </div>

      <button className="cs-btn" onClick={handleNext}>Next Step</button>
    </div>
  )
}

/* ─── STEP 2 ─────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  const SIZE_OPTIONS = [
    '1 – 10', '11 – 50', '51 – 200', '201 – 500', '501 – 1000', '1000+'
  ]

  return (
    <div className="cs-card">
      <h2 className="cs-card-title">How big is your team?</h2>
      <p className="cs-card-sub">This helps us understand your company's scale and matching needs.</p>

      <div className="cs-field">
        <label>Employee count</label>
        <div className="cs-select-wrap">
          <select className="cs-input cs-select"
            value={data.employee_count || ''}
            onChange={e => onChange('employee_count', e.target.value)}>
            <option value="">Choose Employee count</option>
            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="cs-select-arrow">▾</span>
        </div>
      </div>

      <div className="cs-field">
        <label>Business description</label>
        <textarea className="cs-input cs-textarea"
          placeholder="Tell us a bit about what your company does…"
          rows={4}
          value={data.description || ''}
          onChange={e => onChange('description', e.target.value)} />
      </div>

      <button className="cs-btn" onClick={onNext}>Next Step</button>
      <button className="cs-btn-ghost" onClick={onBack}>Go Back</button>
    </div>
  )
}

/* ─── STEP 3 ─────────────────────────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  const [skillInput, setSkillInput] = useState('')
  const [showModal, setShowModal] = useState(false)

  const SKILL_SUGGESTIONS = [
    'Electrician', 'Plumber', 'Welder', 'Carpenter', 'HVAC Technician',
    'Civil Engineer', 'Instrumentation Technician', 'Crane Operator',
    'Boilermaker', 'Scaffolder', 'Rigger', 'Diesel Mechanic',
  ]

  function filtered() {
    if (!skillInput) return []
    return SKILL_SUGGESTIONS.filter(s =>
      s.toLowerCase().includes(skillInput.toLowerCase()) &&
      !(data.skills_needed || []).includes(s)
    )
  }

  function addSkill(s) {
    onChange('skills_needed', [...(data.skills_needed || []), s])
    setSkillInput('')
  }
  function removeSkill(s) {
    onChange('skills_needed', (data.skills_needed || []).filter(x => x !== s))
  }
  function handleKey(e) {
    if (e.key === 'Enter' && skillInput.trim()) { addSkill(skillInput.trim()); e.preventDefault() }
  }

  async function handleFinish() {
    await onFinish(() => setShowModal(true))
  }

  return (
    <>
      <div className="cs-card">
        <h2 className="cs-card-title">What skills are you currently looking for?</h2>
        <p className="cs-card-sub">Select the skills and expertise levels you are currently looking to hire or train.</p>

        <div className="cs-field" style={{ position: 'relative' }}>
          <label>What skills are you currently looking for?</label>
          <div className="cs-skill-box">
            {(data.skills_needed || []).map(s => (
              <span key={s} className="cs-chip">
                {s}
                <button className="cs-chip-x" onClick={() => removeSkill(s)}>×</button>
              </span>
            ))}
            <input className="cs-skill-input" type="text" placeholder="Search skill tags"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleKey} />
          </div>
          {filtered().length > 0 && (
            <div className="cs-suggestions">
              {filtered().slice(0, 5).map(s => (
                <div key={s} className="cs-suggestion-item" onClick={() => addSkill(s)}>{s}</div>
              ))}
            </div>
          )}
        </div>

        <div className="cs-field">
          <label>What level of expertise do you need?</label>
          <div className="cs-select-wrap">
            <select className="cs-input cs-select"
              value={data.expertise_level || ''}
              onChange={e => onChange('expertise_level', e.target.value)}>
              <option value="">Choose Expertise level</option>
              <option value="entry">Entry Level (0 – 2 years)</option>
              <option value="mid">Mid Level (3 – 5 years)</option>
              <option value="senior">Senior Level (6 – 10 years)</option>
              <option value="expert">Expert / Master (10+ years)</option>
            </select>
            <span className="cs-select-arrow">▾</span>
          </div>
        </div>

        <div className="cs-field">
          <label>What is the nature of the work?</label>
          <div className="cs-select-wrap">
            <select className="cs-input cs-select"
              value={data.work_nature || ''}
              onChange={e => onChange('work_nature', e.target.value)}>
              <option value="">Choose nature of work</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="casual">Casual</option>
              <option value="fifo">Fly-in Fly-out (FIFO)</option>
            </select>
            <span className="cs-select-arrow">▾</span>
          </div>
        </div>

        <button className="cs-btn" onClick={handleFinish} disabled={loading}>
          {loading ? <><span className="cs-spinner" /> Saving…</> : 'Finish Setup'}
        </button>
        <button className="cs-btn-ghost" onClick={onBack}>Go Back</button>
      </div>

      {/* ─── Success Modal ─── */}
      {showModal && (
        <div className="cs-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cs-modal" onClick={e => e.stopPropagation()}>
            {/* Confetti */}
            <div className="cs-confetti">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="cs-confetti-dot" style={{
                  left: `${8 + (i % 5) * 20}%`,
                  top:  `${4 + Math.floor(i / 5) * 22}%`,
                  background: i % 3 === 0 ? '#e87b3a' : i % 3 === 1 ? '#6b8f5e' : '#f5c518',
                  animationDelay: `${i * 0.08}s`,
                  width: i % 2 === 0 ? 7 : 5,
                  height: i % 2 === 0 ? 7 : 5,
                }} />
              ))}
            </div>
            {/* Party hat on top of icon */}
            <div className="cs-modal-icon-wrap">
              <div className="cs-modal-party-hat">🎉</div>
              <div className="cs-modal-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h3 className="cs-modal-title">Your company profile is ready!</h3>
            <p className="cs-modal-sub">
              You're all set. Now you can start exploring top-tier talent and professional trainers tailored to your needs.
            </p>
            <button className="cs-btn cs-modal-btn" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function CompanySetup() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = parseInt(stepParam) || 1

  const [data, setData] = useState({ skills_needed: [] })
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  function onChange(field, val) { setData(p => ({ ...p, [field]: val })) }
  function goTo(n) { navigate(`/setup/company/${n}`) }

  async function handleFinish(onSuccess) {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true); setApiError('')
    const payload = {
      company_name:  data.company_name  || '',
      industry:      data.industry      || '',
      contact_name:  data.company_name  || '',
      contact_email: '',
      website_url:   data.website_url   || null,
      abn_or_identifier: '',
    }
    try {
      try { await createCompany(payload, token) }
      catch (e) { if (e.status === 400) await updateCompany(payload, token); else throw e }
      onSuccess()
    } catch (err) {
      setApiError(err.detail || 'Failed to save company profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cs-page">
      <Blobs />
      <div className="cs-layout">
        <StepSidebar current={step} />
        <div className="cs-center">
          {apiError && <div className="cs-api-error">{apiError}</div>}
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => goTo(2)} loading={loading} />}
        </div>
        <div className="cs-illus">
          {ILLUS[step] || ILLUS[1]}
        </div>
      </div>
    </div>
  )
}
