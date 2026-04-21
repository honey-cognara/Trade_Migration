import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FigmaBg } from '../../components/FigmaBg'
import { createCompany, updateCompany, getToken } from '../../services/api'
import './CompanySetup.css'

const LS_KEY = 'company_setup'

function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
function saveData(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {}
}

/* ─── Step Sidebar ────────────────────────────────────────────── */
const STEPS_META = [
  { label: 'Step 1', sub: 'Business Identity' },
  { label: 'Step 2', sub: 'How big is your team?' },
  { label: 'Step 3', sub: 'Hiring Priorities' },
  { label: 'Step 4', sub: 'Profile Ready!' },
]

function StepSidebar({ current }) {
  return (
    <div className="fd-steps">
      {STEPS_META.map((s, i) => {
        const num    = i + 1
        const active = current === num
        const done   = current > num
        return (
          <div key={i} className={`fd-step${active ? ' active' : done ? ' done' : ''}`}>
            <div className="fd-step-circle" />
            {i < STEPS_META.length - 1 && <div className="fd-step-line" />}
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

/* ─── Illustrations ───────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-illus-svg">
      {/* Teal mountain accent shapes */}
      <polygon points="148,248 192,188 236,248" fill="#5bc8c0" opacity="0.72" />
      <polygon points="168,248 206,196 244,248" fill="#7dd8d0" opacity="0.52" />
      <polygon points="128,248 166,204 204,248" fill="#9ae8e0" opacity="0.40" />
      {/* Ground */}
      <ellipse cx="188" cy="314" rx="88" ry="32" fill="#dff0e8" />
      {/* Shadow */}
      <ellipse cx="183" cy="308" rx="42" ry="11" fill="#b8d8c8" opacity="0.55" />
      {/* Legs */}
      <rect x="164" y="258" width="17" height="54" rx="8" fill="#1a1a2e" />
      <rect x="188" y="258" width="17" height="54" rx="8" fill="#1a1a2e" />
      {/* Shoes */}
      <ellipse cx="172" cy="314" rx="13" ry="5" fill="#0d0d1a" />
      <ellipse cx="196" cy="314" rx="13" ry="5" fill="#0d0d1a" />
      {/* Body / black blazer */}
      <rect x="149" y="178" width="70" height="84" rx="12" fill="#1a1a2e" />
      {/* Blazer lapels */}
      <polygon points="178,178 184,204 170,204" fill="#252545" />
      <polygon points="190,178 184,204 198,204" fill="#252545" />
      {/* Left arm */}
      <rect x="131" y="181" width="20" height="56" rx="10" fill="#1a1a2e" />
      <circle cx="141" cy="238" r="11" fill="#b87840" />
      {/* Right arm (bag side) */}
      <rect x="216" y="181" width="20" height="50" rx="10" fill="#1a1a2e" />
      <circle cx="226" cy="232" r="11" fill="#b87840" />
      {/* Orange handbag */}
      <rect x="217" y="222" width="50" height="40" rx="9" fill="#e8783a" />
      <rect x="222" y="213" width="40" height="15" rx="5" fill="#c85818" />
      <rect x="228" y="234" width="30" height="3" rx="1.5" fill="#c85818" />
      {/* Bag handle arc */}
      <path d="M230 213 Q242 200 254 213" stroke="#c85818" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Bag clasp dot */}
      <circle cx="242" cy="221" r="3" fill="#c85818" />
      {/* Neck */}
      <rect x="177" y="156" width="13" height="24" rx="6" fill="#b07840" />
      {/* Head */}
      <circle cx="183" cy="140" r="30" fill="#b07840" />
      {/* Hair */}
      <ellipse cx="183" cy="116" rx="30" ry="16" fill="#1a1a1a" />
      <ellipse cx="211" cy="132" rx="8" ry="20" fill="#1a1a1a" transform="rotate(14 211 132)" />
      <path d="M209 127 Q226 140 220 162" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Face */}
      <circle cx="176" cy="140" r="3" fill="#7a4820" />
      <circle cx="190" cy="140" r="3" fill="#7a4820" />
      <path d="M178 150 Q183 155 188 150" stroke="#7a4820" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function IllusStep2() {
  return (
    <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-illus-svg">
      {/* Yellow-green ground blob */}
      <ellipse cx="180" cy="318" rx="108" ry="38" fill="#dff0d0" />
      {/* Teal accent top */}
      <polygon points="200,162 226,126 252,162" fill="#5bc8c0" opacity="0.6" />
      <polygon points="216,162 237,132 258,162" fill="#7dd8d0" opacity="0.4" />
      {/* Shadows */}
      <ellipse cx="130" cy="310" rx="37" ry="10" fill="#c8dcc8" opacity="0.5" />
      <ellipse cx="212" cy="312" rx="37" ry="10" fill="#c8dcc8" opacity="0.5" />

      {/* ── Woman (left, white top) ── */}
      <rect x="111" y="254" width="16" height="57" rx="7" fill="#1a1a2e" />
      <rect x="132" y="254" width="16" height="57" rx="7" fill="#1a1a2e" />
      <ellipse cx="119" cy="313" rx="11" ry="5" fill="#0d0d1a" />
      <ellipse cx="140" cy="313" rx="11" ry="5" fill="#0d0d1a" />
      {/* White top body */}
      <rect x="105" y="180" width="52" height="78" rx="10" fill="#f0f0f0" />
      <rect x="125" y="180" width="12" height="18" rx="4" fill="#e0e0e0" />
      {/* Arms */}
      <rect x="89"  y="184" width="18" height="44" rx="8" fill="#f0f0f0" />
      <rect x="155" y="184" width="18" height="44" rx="8" fill="#f0f0f0" />
      <circle cx="98"  cy="229" r="10" fill="#d4956a" />
      <circle cx="164" cy="229" r="10" fill="#d4956a" />
      {/* Orange folder */}
      <rect x="156" y="212" width="28" height="36" rx="5" fill="#e87b3a" />
      <rect x="156" y="212" width="28" height="8"  rx="5" fill="#c85a1a" />
      {/* Neck + head */}
      <rect x="125" y="160" width="12" height="22" rx="6" fill="#d4956a" />
      <circle cx="131" cy="145" r="27" fill="#d4956a" />
      {/* Hair bob */}
      <ellipse cx="131" cy="122" rx="27" ry="14" fill="#1a1a1a" />
      <ellipse cx="105" cy="138" rx="6" ry="14" fill="#1a1a1a" />
      <ellipse cx="157" cy="138" rx="6" ry="14" fill="#1a1a1a" />
      {/* Face */}
      <circle cx="124" cy="145" r="2.5" fill="#8a5030" />
      <circle cx="138" cy="145" r="2.5" fill="#8a5030" />
      <path d="M126 155 Q131 159 136 155" stroke="#8a5030" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* ── Man (right, dark vest) ── */}
      <rect x="193" y="257" width="17" height="55" rx="7" fill="#2d2d2d" />
      <rect x="216" y="257" width="17" height="55" rx="7" fill="#2d2d2d" />
      <ellipse cx="201" cy="314" rx="12" ry="5" fill="#0d0d1a" />
      <ellipse cx="225" cy="314" rx="12" ry="5" fill="#0d0d1a" />
      {/* Dark vest body */}
      <rect x="186" y="182" width="56" height="80" rx="10" fill="#3a3a5a" />
      {/* Shirt collar */}
      <rect x="206" y="182" width="14" height="20" rx="4" fill="#e8e8e8" />
      {/* Arms */}
      <rect x="169" y="186" width="19" height="47" rx="8" fill="#3a3a5a" />
      <rect x="240" y="186" width="19" height="47" rx="8" fill="#3a3a5a" />
      <circle cx="178" cy="234" r="10" fill="#7a5030" />
      <circle cx="250" cy="234" r="10" fill="#7a5030" />
      {/* Clipboard */}
      <rect x="237" y="200" width="34" height="44" rx="5" fill="#f0f0f0" />
      <rect x="237" y="200" width="34" height="8"  rx="5" fill="#c0c0c0" />
      <rect x="242" y="214" width="24" height="3" rx="1.5" fill="#e87b3a" />
      <rect x="242" y="222" width="24" height="3" rx="1.5" fill="#e87b3a" />
      <rect x="242" y="230" width="16" height="3" rx="1.5" fill="#c0c0c0" />
      {/* Neck + head */}
      <rect x="206" y="162" width="14" height="22" rx="7" fill="#7a5030" />
      <circle cx="213" cy="147" r="28" fill="#7a5030" />
      {/* Short hair */}
      <ellipse cx="213" cy="124" rx="28" ry="15" fill="#1a1a1a" />
      <ellipse cx="186" cy="142" rx="5" ry="13" fill="#1a1a1a" />
      <ellipse cx="240" cy="142" rx="5" ry="13" fill="#1a1a1a" />
      {/* Face */}
      <circle cx="206" cy="147" r="2.5" fill="#4a2a10" />
      <circle cx="220" cy="147" r="2.5" fill="#4a2a10" />
      <path d="M208 157 Q213 161 218 157" stroke="#4a2a10" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function IllusStep3() {
  return (
    <svg viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-illus-svg">
      {/* Back card */}
      <rect x="100" y="58"  width="166" height="106" rx="12" fill="#f0faf0" stroke="#d0e8d0" strokeWidth="1.5" />
      <circle cx="127" cy="94" r="20" fill="#e8f4e8" stroke="#d0e8d0" strokeWidth="1.5" />
      <circle cx="127" cy="86" r="9"  fill="#d4a070" />
      <ellipse cx="127" cy="105" rx="12" ry="8" fill="#3a3a5a" />
      <rect x="158" y="78" width="88" height="8"  rx="4" fill="#c8dcc8" />
      <rect x="158" y="94" width="70" height="6"  rx="3" fill="#e0e0e0" />
      <rect x="158" y="108" width="80" height="6" rx="3" fill="#e87b3a" opacity="0.7" />
      {/* Middle card */}
      <rect x="87" y="109" width="166" height="106" rx="12" fill="#f4fcf4" stroke="#c8dcc8" strokeWidth="1.5" />
      <circle cx="115" cy="146" r="22" fill="#e0f0e0" stroke="#c8dcc8" strokeWidth="1.5" />
      <circle cx="115" cy="137" r="10" fill="#c87050" />
      <ellipse cx="115" cy="157" rx="13" ry="9" fill="#2d2d4e" />
      <rect x="148" y="130" width="82" height="8"  rx="4" fill="#b8d0b8" />
      <rect x="148" y="146" width="65" height="6"  rx="3" fill="#e0e0e0" />
      <rect x="148" y="160" width="75" height="6"  rx="3" fill="#e87b3a" opacity="0.6" />
      {/* Front card */}
      <rect x="72" y="160" width="168" height="108" rx="12" fill="#fff" stroke="#b0cca0" strokeWidth="2" />
      <circle cx="100" cy="200" r="24" fill="#d8ecd8" stroke="#b0cca0" strokeWidth="1.5" />
      <circle cx="100" cy="191" r="11" fill="#e87b3a" />
      <ellipse cx="100" cy="213" rx="14" ry="9" fill="#1a1a2e" />
      <rect x="136" y="183" width="88" height="9"  rx="4.5" fill="#9ab89a" />
      <rect x="136" y="200" width="68" height="7"  rx="3.5" fill="#e0e0e0" />
      <rect x="136" y="215" width="80" height="7"  rx="3.5" fill="#e87b3a" opacity="0.5" />
      <rect x="136" y="229" width="55" height="5"  rx="2.5" fill="#d0d0d0" />
      {/* Orange checkmark badge */}
      <circle cx="248" cy="268" r="38" fill="#e87b3a" />
      <path d="M233 268 L244 279 L263 258" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Step 4 — Company Ready ───────────────────────────────────── */
function Step4Company({ onDashboard }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
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
      {[
        { c:'#5379f4', l:'10%' }, { c:'#f26f37', l:'25%' }, { c:'#22c55e', l:'45%' },
        { c:'#f4f68b', l:'62%' }, { c:'#f26f37', l:'78%' }, { c:'#b4eb50', l:'88%' },
      ].map(({ c, l }, i) => (
        <span key={i} style={{
          position: 'absolute', width: 7, height: 7, borderRadius: i % 2 === 0 ? '50%' : '2px',
          background: c, left: l, top: '6%',
          animation: 'fd-fall 1.2s ease-in forwards', animationDelay: `${i * 0.12}s`,
        }} />
      ))}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#343434', marginBottom: '0.6rem' }}>
        Your company profile is ready!
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6a7380', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        You're all set. Now you can start exploring top-tier talent and professional
        trainers tailored to your needs.
      </p>
      <button className="fd-btn" onClick={onDashboard}>Go to Dashboard</button>
    </div>
  )
}

const ILLUS = [<IllusStep1 />, <IllusStep2 />, <IllusStep3 />, null]

/* ─── Tag Input ───────────────────────────────────────────────── */
const SKILL_SUGGESTIONS = [
  'Electrician', 'Plumber', 'Welder', 'Carpenter', 'HVAC Technician',
  'Civil Engineer', 'Instrumentation Technician', 'Crane Operator',
  'Boilermaker', 'Scaffolder', 'Rigger', 'Diesel Mechanic',
  'Pipefitter', 'Concreter', 'Bricklayer', 'Painter',
]

function TagInput({ tags, onAdd, onRemove }) {
  const [input, setInput] = useState('')
  const [open,  setOpen]  = useState(false)

  const filtered = SKILL_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  function add(val) {
    const v = val.trim()
    if (v && !tags.includes(v)) onAdd(v)
    setInput('')
    setOpen(false)
  }

  function handleKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      add(filtered[0] || input)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="cs-tag-box fd-input" onClick={() => document.getElementById('cs-skill-input')?.focus()}>
        <div className="fd-tags" style={{ margin: 0, flexWrap: 'wrap', display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
          {tags.map((t) => (
            <span className="fd-tag" key={t}>
              {t}
              <button className="fd-tag-x" type="button" onClick={() => onRemove(t)}>×</button>
            </span>
          ))}
          <input
            id="cs-skill-input"
            className="cs-tag-input"
            placeholder={tags.length ? '' : 'Type and press Enter to add…'}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 160)}
            onKeyDown={handleKey}
          />
        </div>
      </div>
      {open && filtered.length > 0 && (
        <div className="cs-suggestions">
          {filtered.slice(0, 6).map((s) => (
            <div key={s} className="cs-suggestion-item" onMouseDown={() => add(s)}>{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Success Modal ───────────────────────────────────────────── */
const CONFETTI_COLORS = ['#5379f4', '#f26f37', '#22c55e', '#f5c518', '#5379f4', '#f26f37', '#22c55e', '#5379f4', '#f26f37', '#5379f4', '#f5c518', '#22c55e']

function SuccessModal({ onDashboard }) {
  return (
    <div className="fd-modal-overlay">
      <div className="fd-modal">
        {/* Confetti */}
        <div className="fd-confetti">
          {CONFETTI_COLORS.map((c, i) => (
            <span key={i} style={{
              background: c,
              left: `${6 + i * 8}%`,
              top: '5%',
              animationDelay: `${i * 0.07}s`,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              width: i % 3 === 0 ? 7 : 5,
              height: i % 3 === 0 ? 7 : 5,
            }} />
          ))}
        </div>
        {/* Icon */}
        <div className="fd-modal-icon">
          <div className="fd-modal-hat">🎉</div>
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path d="M3 14L14 25L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="fd-modal-title">Your company profile is ready!</h2>
        <p className="fd-modal-sub">
          You're all set. Now you can start exploring top-tier talent and professional trainers tailored to your needs.
        </p>
        <button className="fd-btn" onClick={onDashboard}>Go to Dashboard</button>
      </div>
    </div>
  )
}

/* ─── Step 1 ──────────────────────────────────────────────────── */
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
    const all = { company_name: true, industry: true }
    setTouched(all)
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  const err = (f) => touched[f] && errors[f]

  return (
    <>
      <h2 className="fd-setup-card-title">Tell us about your company.</h2>
      <p className="fd-setup-card-sub">Let's set up your business profile to help you find the right talent and expert trainers.</p>

      <div className="fd-group">
        <label className="fd-label">Legal Business Name</label>
        <input
          className={`fd-input${err('company_name') ? ' error' : ''}`}
          type="text"
          placeholder="Enter Legal Business Name"
          value={data.company_name || ''}
          onChange={(e) => { onChange('company_name', e.target.value); setErrors((p) => ({ ...p, company_name: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, company_name: true }))}
        />
        {err('company_name') && <div className="form-error">{errors.company_name}</div>}
      </div>

      <div className="fd-group">
        <label className="fd-label">Industry</label>
        <input
          className={`fd-input${err('industry') ? ' error' : ''}`}
          type="text"
          placeholder="e.g. Construction, Mining, Engineering"
          value={data.industry || ''}
          onChange={(e) => { onChange('industry', e.target.value); setErrors((p) => ({ ...p, industry: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, industry: true }))}
        />
        {err('industry') && <div className="form-error">{errors.industry}</div>}
      </div>

      <div className="fd-group">
        <label className="fd-label">Company Website</label>
        <input
          className="fd-input"
          type="url"
          placeholder="https://yourcompany.com"
          value={data.website_url || ''}
          onChange={(e) => onChange('website_url', e.target.value)}
        />
      </div>

      <button className="fd-btn" style={{ marginTop: '0.5rem' }} onClick={handleNext}>
        Next Step
      </button>
    </>
  )
}

/* ─── Step 2 ──────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+']

  return (
    <>
      <h2 className="fd-setup-card-title">How big is your team?</h2>
      <p className="fd-setup-card-sub">This helps us understand your company's scale and matching needs.</p>

      <div className="fd-group">
        <label className="fd-label">Employee count</label>
        <select
          className="fd-input"
          value={data.employee_count || ''}
          onChange={(e) => onChange('employee_count', e.target.value)}
        >
          <option value="">Choose Employee count</option>
          {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label">Business description</label>
        <textarea
          className="fd-input"
          placeholder="Tell us a bit about what your company does..."
          rows={4}
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      <button className="fd-btn" style={{ marginTop: '0.5rem' }} onClick={onNext}>
        Next Step
      </button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Step 3 ──────────────────────────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading, apiError }) {
  async function handleFinish() {
    await onFinish()
  }

  return (
    <>
      <h2 className="fd-setup-card-title">What skills are you currently looking for?</h2>
      <p className="fd-setup-card-sub">Select the skills and expertise levels you are currently looking to hire or train.</p>

      {apiError && <div className="fd-alert fd-alert-error">{apiError}</div>}

      <div className="fd-group">
        <label className="fd-label">What skills are you currently looking for?</label>
        <TagInput
          tags={data.skills_needed || []}
          onAdd={(v) => onChange('skills_needed', [...(data.skills_needed || []), v])}
          onRemove={(v) => onChange('skills_needed', (data.skills_needed || []).filter((x) => x !== v))}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label">What level of expertise do you need?</label>
        <select
          className="fd-input"
          value={data.expertise_level || ''}
          onChange={(e) => onChange('expertise_level', e.target.value)}
        >
          <option value="">Choose Expertise level</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label">What is the nature of the work?</label>
        <select
          className="fd-input"
          value={data.work_nature || ''}
          onChange={(e) => onChange('work_nature', e.target.value)}
        >
          <option value="">Choose nature of work</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="freelance">Freelance</option>
        </select>
      </div>

      <button className="fd-btn" style={{ marginTop: '0.5rem' }} onClick={handleFinish} disabled={loading}>
        {loading ? <><span className="spinner" /> Saving…</> : 'Finish Setup'}
      </button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>

      {showModal && <SuccessModal onDashboard={() => { localStorage.removeItem(LS_KEY); window.location.href = '/dashboard' }} />}
    </>
  )
}

/* ─── Main Component ──────────────────────────────────────────── */
export function CompanySetup() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = Math.min(Math.max(parseInt(stepParam) || 1, 1), 4)

  const [data,     setData]     = useState(() => ({ skills_needed: [], ...loadData() }))
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  // Persist to localStorage whenever data changes
  useEffect(() => { saveData(data) }, [data])

  function onChange(field, val) { setData((p) => ({ ...p, [field]: val })) }
  function goTo(n) { navigate(`/setup/company/${n}`) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setApiError('')
    const payload = {
      company_name:      data.company_name      || '',
      industry:          data.industry          || '',
      contact_name:      data.company_name      || '',
      contact_email:     '',
      website_url:       data.website_url       || null,
      abn_or_identifier: '',
    }
    try {
      try {
        await createCompany(payload, token)
      } catch (e) {
        if (e.status === 400 || e.status === 409) await updateCompany(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      navigate('/setup/company/4')
    } catch (err) {
      setApiError(err.detail || 'Failed to save company profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fd-setup-page">
      <FigmaBg />

      <div className="fd-setup-inner cs-setup-inner">
        {/* Left — step tracker */}
        <StepSidebar current={step} />

        {/* Centre — card */}
        <div className="fd-setup-card cs-setup-card">
          {apiError && step !== 3 && <div className="fd-alert fd-alert-error">{apiError}</div>}
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && (
            <Step3
              data={data}
              onChange={onChange}
              onFinish={handleFinish}
              onBack={() => goTo(2)}
              loading={loading}
              apiError={apiError}
            />
          )}
          {step === 4 && (
            <Step4Company onDashboard={() => { localStorage.removeItem(LS_KEY); navigate('/dashboard') }} />
          )}
        </div>

        {/* Right — illustration (hidden on step 4) */}
        {step < 4 && (
          <div className="fd-setup-illus cs-setup-illus">
            {ILLUS[step - 1]}
          </div>
        )}
      </div>
    </div>
  )
}
