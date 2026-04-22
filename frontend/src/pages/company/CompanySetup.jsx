import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FigmaBg } from '../../components/FigmaBg'
import { createCompany, updateCompany, getToken } from '../../services/api'

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_KEY = 'company_setup'
function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
function saveData(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {}
}

/* ─── Step sidebar ───────────────────────────────────────────── */
const STEPS_META = [
  { label: 'Step 1', sub: 'Company basics' },
  { label: 'Step 2', sub: 'Company details' },
  { label: 'Step 3', sub: 'Hiring needs' },
  { label: 'Step 4', sub: 'All set!' },
]

function StepSidebar({ current }) {
  return (
    <div className="fd-steps">
      {STEPS_META.map((s, i) => {
        const num = i + 1
        const cls = current > num ? 'done' : current === num ? 'active' : ''
        return (
          <div className={`fd-step ${cls}`} key={i}>
            {i < STEPS_META.length - 1 && <div className="fd-step-line" />}
            <div className="fd-step-circle" />
            <div className="fd-step-info">
              <div className="fd-step-num">{s.label}</div>
              <div className="fd-step-sub">{s.sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tag input (for skills_needed) ─────────────────────────── */
function TagInput({ tags, onAdd, onRemove }) {
  const [val, setVal] = useState('')
  function add() {
    const v = val.trim()
    if (v && !tags.includes(v)) onAdd(v)
    setVal('')
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input className="fd-input" style={{ flex: 1 }} placeholder="Type a skill and press Add"
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}/>
        <button type="button" className="fd-btn" style={{ padding: '0 1rem', minWidth: 60 }} onClick={add}>Add</button>
      </div>
      <div className="fd-tags">
        {tags.map(t => (
          <span className="fd-tag" key={t}>{t}
            <button type="button" className="fd-tag-x" onClick={() => onRemove(t)}>×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusCompany1() {
  return (
    <svg viewBox="0 0 260 300" width="220" height="280" fill="none">
      <ellipse cx="130" cy="170" rx="90" ry="75" fill="#e6f1ff" opacity="0.7"/>
      <rect x="60" y="100" width="140" height="100" rx="14" fill="#fff" stroke="#d0dff0" strokeWidth="1.5"/>
      <rect x="80" y="118" width="70" height="9" rx="4.5" fill="#5379f4" opacity="0.7"/>
      <rect x="80" y="134" width="100" height="6" rx="3" fill="#d0dff0"/>
      <rect x="80" y="147" width="80" height="6" rx="3" fill="#d0dff0"/>
      <rect x="80" y="160" width="90" height="6" rx="3" fill="#d0dff0"/>
      <rect x="80" y="173" width="60" height="6" rx="3" fill="#d0dff0"/>
      <circle cx="175" cy="82" r="28" fill="#5379f4" opacity="0.1"/>
      <rect x="158" y="68" width="34" height="28" rx="5" fill="#5379f4" opacity="0.25"/>
      <rect x="165" y="75" width="8" height="8" rx="2" fill="#5379f4"/>
      <rect x="177" y="75" width="8" height="8" rx="2" fill="#5379f4"/>
      <rect x="165" y="86" width="20" height="4" rx="2" fill="#5379f4" opacity="0.6"/>
    </svg>
  )
}
function IllusCompany2() {
  return (
    <svg viewBox="0 0 260 300" width="220" height="280" fill="none">
      <ellipse cx="130" cy="175" rx="88" ry="72" fill="#fff3e0" opacity="0.75"/>
      <rect x="55" y="105" width="150" height="110" rx="14" fill="#fff" stroke="#ffe0b2" strokeWidth="1.5"/>
      <circle cx="95" cy="135" r="20" fill="#f26f37" opacity="0.15"/>
      <circle cx="95" cy="135" r="13" fill="#f26f37" opacity="0.4"/>
      <rect x="120" y="125" width="70" height="8" rx="4" fill="#f26f37" opacity="0.6"/>
      <rect x="120" y="140" width="55" height="6" rx="3" fill="#ffe0b2"/>
      <rect x="75" y="165" width="130" height="6" rx="3" fill="#ffe0b2"/>
      <rect x="75" y="178" width="110" height="6" rx="3" fill="#ffe0b2"/>
    </svg>
  )
}
function IllusCompany3() {
  return (
    <svg viewBox="0 0 260 300" width="220" height="280" fill="none">
      <ellipse cx="130" cy="175" rx="90" ry="74" fill="#e8f5e9" opacity="0.75"/>
      <rect x="60" y="100" width="140" height="110" rx="14" fill="#fff" stroke="#c8e6c9" strokeWidth="1.5"/>
      {[115, 133, 151, 169].map((y, i) => (
        <g key={i}>
          <circle cx="82" cy={y} r="6" fill={i < 2 ? '#22c55e' : '#d0dff0'}/>
          {i < 2 && <path d={`M79 ${y} L81 ${y+2} L86 ${y-3}`} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
          <rect x="95" y={y - 4} width={i === 0 ? 80 : i === 1 ? 65 : i === 2 ? 75 : 55} height="7" rx="3.5" fill={i < 2 ? '#c8e6c9' : '#d0dff0'}/>
        </g>
      ))}
    </svg>
  )
}
const ILLUS = [<IllusCompany1/>, <IllusCompany2/>, <IllusCompany3/>, null]

/* ─── STEP 1 ─────────────────────────────────────────────────── */
const INDUSTRIES = [
  'Construction','Electrical & Solar','Mining & Resources','Manufacturing',
  'Infrastructure','HVAC & Refrigeration','Plumbing','Engineering Services','Other',
]
const SIZES = ['1–10','11–50','51–200','201–500','500+']

function Step1({ data, onChange, onNext }) {
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  function validate() {
    const e = {}
    if (!data.company_name?.trim()) e.company_name = 'Please enter your company name.'
    if (!data.industry)             e.industry = 'Please select an industry.'
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
    <>
      <h2 className="fd-setup-card-title">Tell us about your company</h2>
      <p className="fd-setup-card-sub">Set up your employer profile to start discovering skilled overseas tradespeople.</p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-name">Company Name *</label>
        <input id="co-name" className={`fd-input${err('company_name') ? ' error' : ''}`}
          placeholder="Enter your company name"
          value={data.company_name || ''}
          onChange={e => onChange('company_name', e.target.value)}/>
        {err('company_name') && <span className="fd-field-error">{errors.company_name}</span>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-industry">Industry *</label>
        <select id="co-industry" className={`fd-input${err('industry') ? ' error' : ''}`}
          value={data.industry || ''}
          onChange={e => onChange('industry', e.target.value)}>
          <option value="">Select your industry</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        {err('industry') && <span className="fd-field-error">{errors.industry}</span>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-abn">ABN / Business Identifier</label>
        <input id="co-abn" className="fd-input"
          placeholder="e.g. 12 345 678 901"
          value={data.abn_or_identifier || ''}
          onChange={e => onChange('abn_or_identifier', e.target.value)}/>
      </div>

      <button className="fd-btn" onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── STEP 2 ─────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  return (
    <>
      <h2 className="fd-setup-card-title">Contact & company details</h2>
      <p className="fd-setup-card-sub">Help candidates and our team reach the right person.</p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-contact-name">Contact Name</label>
        <input id="co-contact-name" className="fd-input"
          placeholder="Hiring manager or key contact"
          value={data.contact_name || ''}
          onChange={e => onChange('contact_name', e.target.value)}/>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-contact-email">Contact Email</label>
        <input id="co-contact-email" className="fd-input" type="email"
          placeholder="contact@company.com.au"
          value={data.contact_email || ''}
          onChange={e => onChange('contact_email', e.target.value)}/>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-size">Company Size</label>
        <select id="co-size" className="fd-input"
          value={data.company_size || ''}
          onChange={e => onChange('company_size', e.target.value)}>
          <option value="">Choose employee count</option>
          {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-desc">Business Description</label>
        <textarea id="co-desc" className="fd-input" rows={3}
          placeholder="Tell us a bit about what your company does…"
          value={data.description || ''}
          onChange={e => onChange('description', e.target.value)}/>
      </div>

      <button className="fd-btn" onClick={onNext}>Next Step</button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── STEP 3 ─────────────────────────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading, apiError }) {
  return (
    <>
      <h2 className="fd-setup-card-title">What skills are you hiring for?</h2>
      <p className="fd-setup-card-sub">Select the skills and expertise levels you are currently looking for.</p>

      {apiError && <div className="fd-alert fd-alert-error">{apiError}</div>}

      <div className="fd-group">
        <label className="fd-label">Skills needed</label>
        <TagInput
          tags={data.skills_needed || []}
          onAdd={v => onChange('skills_needed', [...(data.skills_needed || []), v])}
          onRemove={v => onChange('skills_needed', (data.skills_needed || []).filter(x => x !== v))}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-expertise">Expertise level needed</label>
        <select id="co-expertise" className="fd-input"
          value={data.expertise_level || ''}
          onChange={e => onChange('expertise_level', e.target.value)}>
          <option value="">Choose expertise level</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
          <option value="expert">Expert / Lead</option>
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="co-work-nature">Nature of work</label>
        <select id="co-work-nature" className="fd-input"
          value={data.work_nature || ''}
          onChange={e => onChange('work_nature', e.target.value)}>
          <option value="">Choose nature of work</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="freelance">Freelance / Casual</option>
        </select>
      </div>

      <button className="fd-btn" onClick={onFinish} disabled={loading}>
        {loading ? <><span className="spinner"/> Saving…</> : 'Finish Setup'}
      </button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── STEP 4 ─────────────────────────────────────────────────── */
function Step4({ onDashboard }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: '#f26f37',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem',
      }}>
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path d="M2 12L12 22L30 2" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#343434', marginBottom: '0.6rem' }}>
        Company profile submitted!
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6a7380', marginBottom: '0.5rem', lineHeight: 1.5 }}>
        Your company is now <strong>pending admin review</strong>. Once approved you'll be able to browse candidates and send expressions of interest.
      </p>
      <p style={{ fontSize: '0.8rem', color: '#9ba3af', marginBottom: '1.5rem' }}>
        You'll receive an email when your account is verified.
      </p>
      <button className="fd-btn" onClick={onDashboard}>Go to Dashboard</button>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function CompanySetup() {
  const { step: stepParam } = useParams()
  const navigate            = useNavigate()

  // KEY FIX: step is internal state — no component remount on step change
  const [step, setStep]       = useState(() => Math.min(Math.max(parseInt(stepParam) || 1, 1), 4))
  const [data, setData]       = useState(() => ({ skills_needed: [], ...loadData() }))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Sync URL without creating history entries (no remount, back-button still works)
  useEffect(() => {
    const base = window.location.pathname.includes('/setup/employer-co/') ? '/setup/employer-co' : '/setup/company'
    window.history.replaceState(null, '', `${base}/${step}`)
  }, [step])

  useEffect(() => { saveData(data) }, [data])

  function onChange(field, val) { setData(p => ({ ...p, [field]: val })) }
  function goTo(n) { setApiError(''); setStep(n) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setApiError('')
    // FIX: match backend CompanyCreate schema exactly
    const payload = {
      company_name:      data.company_name      || '',
      industry:          data.industry          || '',
      contact_name:      data.contact_name      || '',
      contact_email:     data.contact_email     || '',   // FIX: was hardcoded ''
      abn_or_identifier: data.abn_or_identifier || '',
      // website_url is NOT in backend schema — removed
    }
    try {
      try { await createCompany(payload, token) }
      catch (e) {
        if (e.status === 400 || e.status === 409) await updateCompany(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      setStep(4)
    } catch (err) {
      setApiError(err?.detail || 'Failed to save company profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fd-setup-page">
      <FigmaBg />
      <div className="fd-setup-inner cs-setup-inner">
        <StepSidebar current={step} />

        <div className="fd-setup-card cs-setup-card">
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && (
            <Step3 data={data} onChange={onChange} onFinish={handleFinish}
              onBack={() => goTo(2)} loading={loading} apiError={apiError}/>
          )}
          {step === 4 && (
            <Step4 onDashboard={() => { localStorage.removeItem(LS_KEY); navigate('/dashboard') }}/>
          )}
        </div>

        {step < 4 && (
          <div className="fd-setup-illus cs-setup-illus">{ILLUS[step - 1]}</div>
        )}
      </div>
    </div>
  )
}