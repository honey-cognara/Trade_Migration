import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FigmaBg } from '../../components/FigmaBg'
import { createCandidateProfile, updateCandidateProfile, getToken } from '../../services/api'
import './WorkerSetup.css'

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_KEY = 'worker_setup'
function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
function saveData(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {}
}

/* ─── Step Tracker ───────────────────────────────────────────── */
const STEPS_META = [
  { label: 'Step 1', sub: 'Personal info' },
  { label: 'Step 2', sub: 'Experience & skills' },
  { label: 'Step 3', sub: 'Work preferences' },
  { label: 'Step 4', sub: 'Profile ready!' },
]

function StepTracker({ current }) {
  return (
    <div className="fd-steps wks-steps">
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

/* ─── Tag Input ──────────────────────────────────────────────── */
const SKILL_SUGGESTIONS = [
  'Electrical Installation', 'Fault Finding', 'Solar / Renewable', 'PLC Programming',
  'HV Systems', 'Industrial Automation', 'SCADA', 'Motor Control', 'Instrumentation',
  'Data & Communications', 'Fire Alarm Systems', 'Earthing & Bonding',
  'Project Management', 'AutoCAD', 'Leadership', 'Welding', 'Plumbing',
  'HVAC', 'Civil Works', 'Structural', 'Safety Management',
]

function TagInput({ id, placeholder, selected, onAdd, onRemove, suggestions }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const inputRef          = useRef(null)
  const filtered = (suggestions || SKILL_SUGGESTIONS).filter(
    s => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  )
  function add(val) {
    const v = val.trim()
    if (v && !selected.includes(v)) onAdd(v)
    setQuery(''); setOpen(false)
  }
  function handleKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
      e.preventDefault()
      if (filtered[0]) add(filtered[0]); else add(query)
    }
  }
  return (
    <div style={{ position: 'relative' }}>
      <div className="wks-tag-box" onClick={() => inputRef.current?.focus()}>
        {selected.map(s => (
          <span className="fd-tag" key={s}>
            {s}
            <button type="button" className="fd-tag-x"
              onClick={e => { e.stopPropagation(); onRemove(s) }}>×</button>
          </span>
        ))}
        <input ref={inputRef} id={id} className="wks-tag-input"
          placeholder={selected.length ? '' : placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="wks-suggestions">
          {filtered.slice(0, 6).map(s => (
            <li key={s} className="wks-suggestion-item" onMouseDown={() => add(s)}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none">
      <ellipse cx="130" cy="190" rx="90" ry="75" fill="#e6f1ff" opacity="0.8"/>
      <rect x="70" y="130" width="120" height="90" rx="12" fill="#fff" stroke="#d0dff0" strokeWidth="1.5"/>
      <rect x="88" y="148" width="50" height="8" rx="4" fill="#5379f4" opacity="0.7"/>
      <rect x="88" y="163" width="84" height="6" rx="3" fill="#d0dff0"/>
      <rect x="88" y="175" width="70" height="6" rx="3" fill="#d0dff0"/>
      <circle cx="130" cy="90" r="28" fill="#f5c5a3"/>
      <ellipse cx="130" cy="68" rx="22" ry="12" fill="#5379f4"/>
    </svg>
  )
}
function IllusStep2() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none">
      <ellipse cx="138" cy="195" rx="86" ry="72" fill="#fff3e0" opacity="0.8"/>
      <rect x="58" y="120" width="144" height="110" rx="12" fill="#fff" stroke="#ffe0b2" strokeWidth="1.5"/>
      <rect x="74" y="140" width="60" height="8" rx="4" fill="#f26f37" opacity="0.7"/>
      <rect x="74" y="156" width="110" height="6" rx="3" fill="#ffe0b2"/>
      <rect x="74" y="168" width="90" height="6" rx="3" fill="#ffe0b2"/>
      <rect x="74" y="180" width="100" height="6" rx="3" fill="#ffe0b2"/>
      <circle cx="130" cy="85" r="28" fill="#ffb8b8"/>
      <ellipse cx="130" cy="66" rx="20" ry="10" fill="#3a2818"/>
    </svg>
  )
}
function IllusStep3() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none">
      <ellipse cx="148" cy="190" rx="96" ry="80" fill="#e6f1ff" opacity="0.75"/>
      <rect x="60" y="95" width="150" height="100" rx="10" fill="#fff" stroke="#d0dff0" strokeWidth="1.5"/>
      <rect x="76" y="114" width="82" height="7" rx="3.5" fill="#d0dff0"/>
      <circle cx="198" cy="117" r="12" fill="#5379f4"/>
      <path d="M193 117 L197 121 L204 112" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="76" y="133" width="68" height="7" rx="3.5" fill="#d0dff0"/>
      <circle cx="198" cy="136" r="12" fill="#5379f4"/>
      <path d="M193 136 L197 140 L204 131" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="76" y="152" width="78" height="7" rx="3.5" fill="#f26f37" opacity="0.7"/>
      <circle cx="198" cy="155" r="12" fill="#f26f37"/>
    </svg>
  )
}
const ILLUS = [<IllusStep1/>, <IllusStep2/>, <IllusStep3/>, null]

/* ─── STEP 1 — Personal info ─────────────────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.full_name?.trim()) e.full_name = 'Please enter your full name.'
    if (!data.trade_category)    e.trade_category = 'Please select your trade.'
    return e
  }
  function handleNext() {
    setTouched({ full_name: true, trade_category: true })
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }
  const err = f => touched[f] && errors[f]

  return (
    <>
      <h2 className="fd-setup-card-title">Tell us about yourself</h2>
      <p className="fd-setup-card-sub">Create your professional profile to start matching with Australian employers.</p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-name">Full Name *</label>
        <input id="w-name" className={`fd-input${err('full_name') ? ' error' : ''}`}
          placeholder="Enter your full name"
          value={data.full_name || ''}
          onChange={e => onChange('full_name', e.target.value)}/>
        {err('full_name') && <span className="fd-field-error">{errors.full_name}</span>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-trade">Trade Category *</label>
        <select id="w-trade" className={`fd-input${err('trade_category') ? ' error' : ''}`}
          value={data.trade_category || ''}
          onChange={e => onChange('trade_category', e.target.value)}>
          <option value="">Select your trade</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="hvac">HVAC</option>
          <option value="civil">Civil</option>
          <option value="mechanical">Mechanical</option>
          <option value="other">Other</option>
        </select>
        {err('trade_category') && <span className="fd-field-error">{errors.trade_category}</span>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-nationality">Nationality</label>
        <input id="w-nationality" className="fd-input"
          placeholder="e.g. Pakistani, Indian"
          value={data.nationality || ''}
          onChange={e => onChange('nationality', e.target.value)}/>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-country">Country of Residence</label>
        <input id="w-country" className="fd-input"
          placeholder="e.g. Pakistan"
          value={data.country_of_residence || ''}
          onChange={e => onChange('country_of_residence', e.target.value)}/>
      </div>

      <button className="fd-btn" onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── STEP 2 — Experience & skills ──────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  return (
    <>
      <h2 className="fd-setup-card-title">Your experience & skills</h2>
      <p className="fd-setup-card-sub">Help employers understand your background and expertise.</p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-exp">Years of Experience</label>
        <select id="w-exp" className="fd-input"
          value={data.years_experience || ''}
          onChange={e => onChange('years_experience', e.target.value)}>
          <option value="">Select years</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="5">5 years</option>
          <option value="7">7 years</option>
          <option value="10">10 years</option>
          <option value="15">15+ years</option>
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label">Skills I have</label>
        <TagInput id="w-skills-have" placeholder="Type a skill and press Enter…"
          selected={data.skills_have || []}
          onAdd={v => onChange('skills_have', [...(data.skills_have || []), v])}
          onRemove={v => onChange('skills_have', (data.skills_have || []).filter(x => x !== v))}/>
      </div>

      <div className="fd-group">
        <label className="fd-label">Skills I want to develop</label>
        <TagInput id="w-skills-want" placeholder="Type a skill and press Enter…"
          selected={data.skills_want || []}
          onAdd={v => onChange('skills_want', [...(data.skills_want || []), v])}
          onRemove={v => onChange('skills_want', (data.skills_want || []).filter(x => x !== v))}/>
      </div>

      <button className="fd-btn" onClick={onNext}>Next Step</button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── STEP 3 — Work preferences ─────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading, apiError }) {
  return (
    <>
      <h2 className="fd-setup-card-title">Work preferences</h2>
      <p className="fd-setup-card-sub">Tell employers what kind of work you're looking for.</p>

      {apiError && <div className="fd-alert fd-alert-error">{apiError}</div>}

      {/* work_types — uses the backend's actual valid values */}
      <div className="fd-group">
        <label className="fd-label">Types of work (select all that apply)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
          {[
            { value: 'domestic',   label: 'Domestic' },
            { value: 'commercial', label: 'Commercial' },
            { value: 'industrial', label: 'Industrial' },
            { value: 'powerlines', label: 'Powerlines' },
          ].map(opt => {
            const selected = (data.work_types || []).includes(opt.value)
            return (
              <button key={opt.value} type="button"
                onClick={() => {
                  const current = data.work_types || []
                  onChange('work_types', selected
                    ? current.filter(v => v !== opt.value)
                    : [...current, opt.value])
                }}
                style={{
                  padding: '0.45rem 1rem', borderRadius: 20, fontSize: '0.85rem',
                  fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  border: selected ? '2px solid #5379f4' : '1.5px solid #d0dbf0',
                  background: selected ? '#eef2ff' : '#fff',
                  color: selected ? '#5379f4' : '#6a7380',
                }}>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-role-type">Employment type</label>
        <select id="w-role-type" className="fd-input"
          value={data.preferred_role_type || ''}
          onChange={e => onChange('preferred_role_type', e.target.value)}>
          <option value="">Choose employment type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="casual">Casual</option>
          <option value="fifo">Fly-in Fly-out (FIFO)</option>
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="w-availability">Availability</label>
        <select id="w-availability" className="fd-input"
          value={data.availability || ''}
          onChange={e => onChange('availability', e.target.value)}>
          <option value="">Choose availability</option>
          <option value="immediately">Immediately</option>
          <option value="2_weeks">2 weeks notice</option>
          <option value="1_month">1 month</option>
          <option value="3_months">3 months</option>
        </select>
      </div>

      <button className="fd-btn" onClick={onFinish} disabled={loading}>
        {loading ? <><span className="spinner" aria-hidden="true"/> Saving…</> : 'Finish Setup'}
      </button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── STEP 4 — Done ──────────────────────────────────────────── */
function Step4({ onExplore }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: '#5379f4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem',
      }}>
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path d="M2 12L12 22L30 2" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#343434', marginBottom: '0.6rem' }}>
        Your profile is live!
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6a7380', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Employers can now discover you. Start exploring curated job opportunities and training paths tailored to your goals.
      </p>
      <button className="fd-btn" onClick={onExplore}>Go to Dashboard</button>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function WorkerSetup() {
  const { step: stepParam } = useParams()
  const navigate            = useNavigate()

  // Step is internal state — no remount when step changes
  const [step, setStep]       = useState(() => Math.min(Math.max(parseInt(stepParam) || 1, 1), 4))
  const [data, setData]       = useState(() => ({ skills_have: [], skills_want: [], work_types: [], ...loadData() }))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Sync URL without browser history entry (no remount)
  useEffect(() => {
    const base = window.location.pathname.includes('/setup/employer/') ? '/setup/employer' : '/setup/worker'
    window.history.replaceState(null, '', `${base}/${step}`)
  }, [step])

  function onChange(field, val) {
    setData(prev => {
      const next = { ...prev, [field]: val }
      saveData(next)
      return next
    })
  }

  function goTo(n) { setApiError(''); setStep(n) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setApiError('')

    // Build payload — all fields match backend CandidateProfileCreate schema
    const payload = {
      full_name:            data.full_name || '',
      trade_category:       data.trade_category || 'other',
      // years_experience: send as integer — backend also accepts string ranges now
      years_experience:     data.years_experience ? parseInt(data.years_experience, 10) : 0,
      nationality:          data.nationality || '',
      country_of_residence: data.country_of_residence || '',
      is_electrical_worker: data.trade_category === 'electrical',
      languages:            [{ name: 'English', level: 'Unknown' }],
      // work_types: only send backend-valid values (domestic/commercial/industrial/powerlines)
      // preferred_role_type and availability are stored in profile_summary as context
      work_types:           (data.work_types || []).filter(v =>
        ['domestic', 'commercial', 'industrial', 'powerlines'].includes(v)
      ),
      profile_summary:      [
        data.preferred_role_type ? `Employment type: ${data.preferred_role_type}` : '',
        data.availability        ? `Availability: ${data.availability}` : '',
        (data.skills_have || []).length  ? `Skills: ${data.skills_have.join(', ')}` : '',
        (data.skills_want || []).length  ? `Wants to learn: ${data.skills_want.join(', ')}` : '',
      ].filter(Boolean).join(' | ') || null,
      published: false,
    }

    try {
      try { await createCandidateProfile(payload, token) }
      catch (e) {
        if (e.status === 400 || e.status === 409) await updateCandidateProfile(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      setStep(4)
    } catch (err) {
      setApiError(err?.detail || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fd-page fd-setup-page">
      <FigmaBg />
      <div className="fd-setup-inner wks-inner">
        <StepTracker current={step} />

        <div className="fd-setup-card wks-card">
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && (
            <Step3 data={data} onChange={onChange} onFinish={handleFinish}
              onBack={() => goTo(2)} loading={loading} apiError={apiError}/>
          )}
          {step === 4 && <Step4 onExplore={() => navigate('/dashboard')} />}
        </div>

        {step < 4 && (
          <div className="fd-setup-illus wks-illus">{ILLUS[step - 1]}</div>
        )}
      </div>
    </div>
  )
}