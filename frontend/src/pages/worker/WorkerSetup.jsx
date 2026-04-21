import { useState, useRef } from 'react'
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
  { label: 'Step 1', sub: 'Personal Identity' },
  { label: 'Step 2', sub: 'Experience & Skills' },
  { label: 'Step 3', sub: 'Career Preferences' },
  { label: 'Step 4', sub: 'Profile Ready!' },
]

function StepTracker({ current }) {
  return (
    <div className="fd-steps wks-steps">
      {STEPS_META.map((s, i) => {
        const num = i + 1
        const isActive = current === num
        const isDone   = current > num
        const cls = isDone ? 'done' : isActive ? 'active' : ''
        return (
          <div className={`fd-step ${cls}`} key={i}>
            {/* connector line between steps */}
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
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const inputRef              = useRef(null)

  const filtered = (suggestions || SKILL_SUGGESTIONS).filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  )

  function add(val) {
    const v = val.trim()
    if (v && !selected.includes(v)) onAdd(v)
    setQuery('')
    setOpen(false)
  }

  function handleKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
      e.preventDefault()
      if (filtered[0]) add(filtered[0])
      else add(query)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="wks-tag-box"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((s) => (
          <span className="fd-tag" key={s}>
            {s}
            <button
              type="button"
              className="fd-tag-x"
              onClick={(e) => { e.stopPropagation(); onRemove(s) }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          className="wks-tag-input"
          placeholder={selected.length ? '' : placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="wks-suggestions">
          {filtered.slice(0, 6).map((s) => (
            <div key={s} className="wks-suggestion-item" onMouseDown={() => add(s)}>{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Horizontal orange stripes background element */}
      <rect x="150" y="80" width="95" height="9" rx="4.5" fill="#f26f37" opacity="0.85" />
      <rect x="158" y="97" width="82" height="9" rx="4.5" fill="#f26f37" opacity="0.65" />
      <rect x="144" y="114" width="100" height="9" rx="4.5" fill="#f26f37" opacity="0.45" />
      <rect x="152" y="131" width="88" height="9" rx="4.5" fill="#f26f37" opacity="0.28" />

      {/* Desk surface */}
      <rect x="40" y="218" width="190" height="10" rx="5" fill="#d4e8f5" />
      <rect x="52" y="228" width="8" height="48" rx="3" fill="#b8d4e8" />
      <rect x="210" y="228" width="8" height="48" rx="3" fill="#b8d4e8" />

      {/* Chair */}
      <rect x="148" y="222" width="68" height="6" rx="3" fill="#b8cce0" />
      <rect x="162" y="228" width="7" height="44" rx="3" fill="#b8cce0" />
      <rect x="197" y="228" width="7" height="44" rx="3" fill="#b8cce0" />

      {/* Laptop on desk */}
      <rect x="62" y="185" width="100" height="64" rx="6" fill="#e6f1ff" stroke="#b0c8e8" strokeWidth="1.5" />
      <rect x="68" y="191" width="88" height="52" rx="3" fill="#fff" />
      <rect x="55" y="249" width="114" height="8" rx="4" fill="#d0dff0" />
      {/* Screen content lines */}
      <rect x="76" y="200" width="52" height="6" rx="3" fill="#5379f4" opacity="0.6" />
      <rect x="76" y="212" width="38" height="5" rx="2.5" fill="#c1c1c8" />
      <rect x="76" y="223" width="44" height="5" rx="2.5" fill="#c1c1c8" />
      <rect x="76" y="234" width="30" height="5" rx="2.5" fill="#5379f4" opacity="0.35" />

      {/* Person — woman sitting, dark outfit with orange stripe jacket */}
      {/* Legs */}
      <rect x="168" y="248" width="12" height="36" rx="5" fill="#1a1a2e" />
      <rect x="186" y="248" width="12" height="36" rx="5" fill="#1a1a2e" />
      <ellipse cx="174" cy="285" rx="11" ry="5.5" fill="#111" />
      <ellipse cx="192" cy="285" rx="11" ry="5.5" fill="#111" />

      {/* Body — dark outfit */}
      <path d="M152 222 Q152 200 182 200 Q212 200 212 222 L215 250 L149 250 Z" fill="#1a1a2e" />

      {/* Orange jacket stripe detail */}
      <rect x="175" y="200" width="9" height="50" rx="3" fill="#f26f37" opacity="0.9" />

      {/* Head */}
      <circle cx="182" cy="178" r="22" fill="#f5c5a3" />

      {/* Hair — dark with ponytail */}
      <ellipse cx="182" cy="160" rx="21" ry="11" fill="#1a1010" />
      <ellipse cx="160" cy="177" rx="8" ry="16" fill="#1a1010" />
      {/* Ponytail */}
      <path d="M200 162 Q214 155 216 170 Q218 182 208 180" stroke="#1a1010" strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* Face */}
      <circle cx="176" cy="178" r="2.5" fill="#6a4020" />
      <circle cx="188" cy="178" r="2.5" fill="#6a4020" />
      <path d="M177 187 Q182 191 187 187" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Arms — working on laptop */}
      <path d="M152 222 Q136 232 138 248" stroke="#1a1a2e" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="138" cy="252" r="8" fill="#f5c5a3" />
      <path d="M212 222 Q226 230 222 244" stroke="#1a1a2e" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="221" cy="248" r="8" fill="#f5c5a3" />
    </svg>
  )
}

function IllusStep2() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="142" cy="185" r="105" fill="#e6f1ff" opacity="0.7" />

      {/* Book stack */}
      <rect x="66" y="230" width="140" height="18" rx="5" fill="#5379f4" />
      <rect x="72" y="212" width="126" height="18" rx="5" fill="#7a9af4" />
      <rect x="78" y="194" width="112" height="18" rx="5" fill="#a0b8f8" />

      {/* Progress bars (skills display) */}
      <rect x="78" y="130" width="110" height="9" rx="4.5" fill="#e0e8ff" />
      <rect x="78" y="130" width="82"  height="9" rx="4.5" fill="#5379f4" />
      <rect x="78" y="146" width="110" height="9" rx="4.5" fill="#e0e8ff" />
      <rect x="78" y="146" width="56"  height="9" rx="4.5" fill="#5379f4" opacity="0.7" />
      <rect x="78" y="162" width="110" height="9" rx="4.5" fill="#e0e8ff" />
      <rect x="78" y="162" width="96"  height="9" rx="4.5" fill="#5379f4" opacity="0.85" />

      {/* Person — man in hoodie/casual, standing */}
      {/* Legs */}
      <rect x="115" y="270" width="14" height="36" rx="5" fill="#2d2d4a" />
      <rect x="136" y="270" width="14" height="36" rx="5" fill="#2d2d4a" />
      <ellipse cx="122" cy="307" rx="12" ry="5.5" fill="#1a1a30" />
      <ellipse cx="143" cy="307" rx="12" ry="5.5" fill="#1a1a30" />

      {/* Hoodie body */}
      <path d="M96 250 Q96 225 132 225 Q168 225 168 250 L172 272 L92 272 Z" fill="#5379f4" />
      {/* Hoodie pocket */}
      <rect x="118" y="254" width="30" height="14" rx="5" fill="#4060e0" />

      {/* Head */}
      <circle cx="132" cy="202" r="23" fill="#d4a07a" />

      {/* Hair */}
      <ellipse cx="132" cy="183" rx="22" ry="11" fill="#3a2818" />
      <ellipse cx="110" cy="200" rx="6.5" ry="13" fill="#3a2818" />

      {/* Face */}
      <circle cx="126" cy="202" r="2.5" fill="#7a4820" />
      <circle cx="138" cy="202" r="2.5" fill="#7a4820" />
      <path d="M127 210 Q132 214 137 210" stroke="#b07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Arms by side */}
      <path d="M96 250 Q80 262 82 278" stroke="#5379f4" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="82" cy="282" r="9" fill="#d4a07a" />
      <path d="M168 250 Q184 262 182 278" stroke="#5379f4" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="182" cy="282" r="9" fill="#d4a07a" />
    </svg>
  )
}

function IllusStep3() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background blob */}
      <ellipse cx="148" cy="190" rx="96" ry="80" fill="#e6f1ff" opacity="0.75" />

      {/* Checklist panel */}
      <rect x="60" y="95" width="150" height="100" rx="10" fill="#fff" stroke="#d0dff0" strokeWidth="1.5" />

      {/* Row 1 */}
      <rect x="76" y="114" width="82" height="7" rx="3.5" fill="#d0dff0" />
      <circle cx="198" cy="117" r="12" fill="#5379f4" />
      <path d="M193 117 L197 121 L204 112" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Row 2 */}
      <rect x="76" y="133" width="68" height="7" rx="3.5" fill="#d0dff0" />
      <circle cx="198" cy="136" r="12" fill="#5379f4" />
      <path d="M193 136 L197 140 L204 131" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Row 3 */}
      <rect x="76" y="152" width="78" height="7" rx="3.5" fill="#f26f37" opacity="0.7" />
      <circle cx="198" cy="155" r="12" fill="#f26f37" />
      <path d="M193 155 L197 159 L204 150" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Person — standing, casual light outfit */}
      {/* Legs */}
      <rect x="122" y="278" width="13" height="30" rx="5" fill="#c0cce8" />
      <rect x="140" y="278" width="13" height="30" rx="5" fill="#c0cce8" />
      <ellipse cx="129" cy="309" rx="11" ry="5" fill="#9ab0d0" />
      <ellipse cx="147" cy="309" rx="11" ry="5" fill="#9ab0d0" />

      {/* Body */}
      <path d="M102 260 Q102 238 136 238 Q170 238 170 260 L172 280 L100 280 Z" fill="#e0e8ff" />
      {/* Collar stripe */}
      <rect x="128" y="238" width="16" height="6" rx="2" fill="#5379f4" opacity="0.5" />

      {/* Head */}
      <circle cx="136" cy="216" r="22" fill="#f5c5a3" />

      {/* Hair */}
      <ellipse cx="136" cy="198" rx="20" ry="10" fill="#6d4c41" />
      <ellipse cx="156" cy="215" rx="7" ry="12" fill="#6d4c41" />

      {/* Face */}
      <circle cx="130" cy="216" r="2.5" fill="#7a4820" />
      <circle cx="142" cy="216" r="2.5" fill="#7a4820" />
      <path d="M131 224 Q136 228 141 224" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Pointing arm (right) */}
      <path d="M170 260 Q188 252 193 240" stroke="#e0e8ff" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="194" cy="236" r="8.5" fill="#f5c5a3" />

      {/* Left arm */}
      <path d="M102 260 Q86 268 84 280" stroke="#e0e8ff" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="84" cy="284" r="8.5" fill="#f5c5a3" />
    </svg>
  )
}

const ILLUS = [<IllusStep1 />, <IllusStep2 />, <IllusStep3 />, null]

/* ─── STEP 1 — Tell us about yourself ───────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.full_name?.trim())          e.full_name = 'Please enter your full name.'
    if (!data.professional_title?.trim()) e.professional_title = 'Please enter your professional title.'
    if (!data.years_experience && data.years_experience !== 0) e.years_experience = 'Please select years of experience.'
    return e
  }

  function blur(field) { setTouched((p) => ({ ...p, [field]: true })) }

  function handleNext() {
    setTouched({ full_name: true, professional_title: true, years_experience: true })
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  const err = (f) => touched[f] && errors[f]

  return (
    <>
      <h2 className="fd-setup-card-title">Tell us about yourself</h2>
      <p className="fd-setup-card-sub">
        Create your professional profile to start matching with world-class companies and trainers.
      </p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="wks-full-name">Full Name</label>
        <input
          id="wks-full-name"
          className={`fd-input${err('full_name') ? ' error' : ''}`}
          type="text"
          placeholder="Enter Your Full Name"
          value={data.full_name || ''}
          onChange={(e) => { onChange('full_name', e.target.value); setErrors((p) => ({ ...p, full_name: '' })) }}
          onBlur={() => blur('full_name')}
        />
        {err('full_name') && <div className="wks-field-err">{errors.full_name}</div>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="wks-prof-title">Professional Title</label>
        <input
          id="wks-prof-title"
          className={`fd-input${err('professional_title') ? ' error' : ''}`}
          type="text"
          placeholder="Enter Your Professional Title"
          value={data.professional_title || ''}
          onChange={(e) => { onChange('professional_title', e.target.value); setErrors((p) => ({ ...p, professional_title: '' })) }}
          onBlur={() => blur('professional_title')}
        />
        {err('professional_title') && <div className="wks-field-err">{errors.professional_title}</div>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="wks-years-exp">Years of Experience</label>
        <select
          id="wks-years-exp"
          className={`fd-input${err('years_experience') ? ' error' : ''}`}
          value={data.years_experience ?? ''}
          onChange={(e) => { onChange('years_experience', e.target.value === '' ? null : e.target.value); setErrors((p) => ({ ...p, years_experience: '' })) }}
          onBlur={() => blur('years_experience')}
        >
          <option value="">Select Years of Experience</option>
          <option value="1-2">1-2 years</option>
          <option value="3-5">3-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="10+">10+ years</option>
        </select>
        {err('years_experience') && <div className="wks-field-err">{errors.years_experience}</div>}
      </div>

      <button className="fd-btn" onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── STEP 2 — Core Strengths ────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  const fileRef             = useRef(null)
  const [fileName, setFile] = useState('')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (f) { setFile(f.name); onChange('resume_file', f) }
  }

  return (
    <>
      <h2 className="fd-setup-card-title">What are your core strengths?</h2>
      <p className="fd-setup-card-sub">
        Add your skills so we can show you the most relevant job opportunities and training paths.
      </p>

      <div className="fd-group">
        <label className="fd-label">Skills you have</label>
        <TagInput
          id="wks-skills-have"
          placeholder="Type a skill and press Enter"
          selected={data.skills_have || []}
          onAdd={(v) => onChange('skills_have', [...(data.skills_have || []), v])}
          onRemove={(v) => onChange('skills_have', (data.skills_have || []).filter((x) => x !== v))}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label">Skills you want to learn</label>
        <TagInput
          id="wks-skills-want"
          placeholder="Type a skill and press Enter"
          selected={data.skills_want || []}
          onAdd={(v) => onChange('skills_want', [...(data.skills_want || []), v])}
          onRemove={(v) => onChange('skills_want', (data.skills_want || []).filter((x) => x !== v))}
        />
      </div>

      <div className="fd-group">
        <div
          className={`fd-upload${fileName ? ' has-file' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) { setFile(f.name); onChange('resume_file', f) }
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={handleFile} />
          <div className="fd-upload-icon">
            {fileName
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6a7380" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            }
          </div>
          <div className="fd-upload-title">{fileName || 'Upload Resume (PDF)'}</div>
          <div className="fd-upload-sub">{fileName ? 'Click to change file' : 'Drag or Click to Browse'}</div>
        </div>
      </div>

      <button className="fd-btn" onClick={onNext}>Next Step</button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── STEP 3 — Career Preferences ───────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <>
      <h2 className="fd-setup-card-title">What are you looking for?</h2>
      <p className="fd-setup-card-sub">
        Define your ideal role so we can find the perfect match for your next career move.
      </p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="wks-role-type">Preferred Role Type</label>
        <select
          id="wks-role-type"
          className="fd-input"
          value={data.preferred_role_type || ''}
          onChange={(e) => onChange('preferred_role_type', e.target.value)}
        >
          <option value="">Choose role type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="casual">Casual</option>
          <option value="fifo">Fly-in Fly-out (FIFO)</option>
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="wks-salary">Expected Salary / Rate</label>
        <input
          id="wks-salary"
          className="fd-input"
          type="text"
          placeholder="Enter amount or range  e.g. $80,000 – $100,000"
          value={data.expected_salary || ''}
          onChange={(e) => onChange('expected_salary', e.target.value)}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="wks-availability">Availability</label>
        <select
          id="wks-availability"
          className="fd-input"
          value={data.availability || ''}
          onChange={(e) => onChange('availability', e.target.value)}
        >
          <option value="">Choose availability</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="casual">Casual</option>
        </select>
      </div>

      <button className="fd-btn" onClick={onFinish} disabled={loading}>
        {loading ? <><span className="spinner" /> Saving…</> : 'Finish Setup'}
      </button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Step 4 — Profile Ready ─────────────────────────────────── */
function Step4({ onExplore }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
      {/* Orange circle icon */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: '#f26f37',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem', position: 'relative',
      }}>
        <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-30%)', fontSize: '1.5rem' }}>🎉</span>
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <path d="M3 14L14 25L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Confetti dots */}
      {[
        { c:'#f26f37', l:'10%' }, { c:'#5379f4', l:'25%' }, { c:'#22c55e', l:'45%' },
        { c:'#f4f68b', l:'60%' }, { c:'#b4eb50', l:'75%' }, { c:'#f26f37', l:'88%' },
      ].map(({ c, l }, i) => (
        <span key={i} style={{
          position: 'absolute', width: 7, height: 7, borderRadius: i % 2 === 0 ? '50%' : '2px',
          background: c, left: l, top: '6%',
          animation: 'fd-fall 1.2s ease-in forwards',
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}

      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#343434', marginBottom: '0.6rem' }}>
        Your profile is ready for growth!
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6a7380', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        You're now visible to world-class companies. Start exploring curated job
        opportunities and training paths tailored to your goals.
      </p>

      <button className="fd-btn" onClick={onExplore}>Explore Opportunities</button>
    </div>
  )
}

/* ─── Success Modal ──────────────────────────────────────────── */
const CONFETTI_DOTS = [
  { color: '#f26f37', left: '14%',  delay: '0s',    size: 7 },
  { color: '#5379f4', left: '28%',  delay: '0.15s', size: 5 },
  { color: '#f26f37', left: '52%',  delay: '0.08s', size: 8 },
  { color: '#403c8b', left: '68%',  delay: '0.28s', size: 6 },
  { color: '#f26f37', left: '80%',  delay: '0.04s', size: 5 },
  { color: '#5379f4', left: '40%',  delay: '0.22s', size: 7 },
  { color: '#f26f37', left: '10%',  delay: '0.38s', size: 5 },
  { color: '#403c8b', left: '86%',  delay: '0.12s', size: 6 },
  { color: '#b4eb50', left: '58%',  delay: '0.32s', size: 8 },
  { color: '#f26f37', left: '24%',  delay: '0.44s', size: 5 },
]

function SuccessModal({ onExplore }) {
  return (
    <div className="fd-modal-overlay" onClick={onExplore}>
      <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Confetti */}
        <div className="fd-confetti">
          {CONFETTI_DOTS.map((c, i) => (
            <span key={i} style={{
              width: c.size,
              height: c.size,
              background: c.color,
              left: c.left,
              top: '8%',
              animationDelay: c.delay,
            }} />
          ))}
        </div>

        {/* Orange circle icon with party hat */}
        <div className="fd-modal-icon">
          <span className="fd-modal-hat">🎩</span>
          <svg width="36" height="30" viewBox="0 0 36 30" fill="none">
            <path d="M3 15L14 26L33 5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="fd-modal-title">Your profile is ready for growth!</h2>
        <p className="fd-modal-sub">
          You're now visible to world-class companies. Start exploring curated job opportunities
          and training paths tailored to your goals.
        </p>

        <button className="fd-btn" onClick={onExplore}>
          Explore Opportunities
        </button>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function WorkerSetup() {
  const { step: stepParam } = useParams()
  const navigate            = useNavigate()
  const step                = Math.min(Math.max(parseInt(stepParam) || 1, 1), 4)

  const [data, setData]         = useState(() => ({ skills_have: [], skills_want: [], ...loadData() }))
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [showModal, setShowModal] = useState(false)

  function onChange(field, val) {
    setData((prev) => {
      const next = { ...prev, [field]: val }
      saveData(next)
      return next
    })
  }

  function goTo(n) { navigate(`/setup/worker/${n}`) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setApiError('')
    const payload = {
      full_name:            data.full_name || '',
      trade_category:       data.trade_category || 'other',
      years_experience:     parseInt(data.years_experience) || 0,
      nationality:          data.nationality || '',
      country_of_residence: data.country_of_residence || '',
      is_electrical_worker: false,
      languages:            [{ name: 'English', level: 'Unknown' }],
      work_types:           [],
      published:            false,
    }
    try {
      try { await createCandidateProfile(payload, token) }
      catch (e) {
        if (e.status === 400 || e.status === 409) await updateCandidateProfile(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      navigate('/setup/worker/4')
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
        {/* Left: step tracker */}
        <StepTracker current={step} />

        {/* Center: card */}
        <div className="fd-setup-card wks-card">
          {apiError && (
            <div className="fd-alert fd-alert-error" style={{ marginBottom: '1rem' }}>{apiError}</div>
          )}

          {step === 1 && (
            <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />
          )}
          {step === 2 && (
            <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />
          )}
          {step === 3 && (
            <Step3
              data={data}
              onChange={onChange}
              onFinish={handleFinish}
              onBack={() => goTo(2)}
              loading={loading}
            />
          )}
          {step === 4 && (
            <Step4 onExplore={() => navigate('/dashboard')} />
          )}
        </div>

        {/* Right: illustration (hidden on step 4) */}
        {step < 4 && (
          <div className="fd-setup-illus wks-illus">
            {ILLUS[step - 1]}
          </div>
        )}
      </div>

      {/* Legacy modal fallback */}
      {showModal && (
        <SuccessModal onExplore={() => { setShowModal(false); navigate('/dashboard') }} />
      )}
    </div>
  )
}
