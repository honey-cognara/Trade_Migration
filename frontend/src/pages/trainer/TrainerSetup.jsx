import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './TrainerSetup.css'
import { createTrainingProvider, getToken } from '../../services/api'

/* ─── Constants ──────────────────────────────────────────────── */
const SERVICE_TYPES_LIST = [
  'Online Courses', 'In-Person Training', 'Workshops', 'Mentoring',
  'Assessment Only', 'RPL (Recognition of Prior Learning)', 'Bootcamp',
  'Corporate Training', 'Certificate Programs',
]
const LANGUAGES_LIST = [
  'English', 'Urdu', 'Hindi', 'Arabic', 'Tagalog', 'Mandarin',
  'Vietnamese', 'Punjabi', 'Nepali', 'Bangla',
]
const TIMEZONES = [
  'AEST (UTC+10)', 'ACST (UTC+9:30)', 'AWST (UTC+8)',
  'NZST (UTC+12)', 'UTC', 'IST (UTC+5:30)', 'PKT (UTC+5)',
]
const EXP_YEARS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '10+']

/* ─── Decorative blobs + accents ─────────────────────────────── */
function Blobs() {
  return (
    <>
      <div className="ts-blob ts-blob-tl" />
      <div className="ts-blob ts-blob-br" />
      {/* orange rings top-left */}
      <div className="ts-circle" style={{ width: 52, height: 52, top: '6%', left: '7%', borderWidth: 2.5, opacity: 0.45 }} />
      <div className="ts-circle" style={{ width: 28, height: 28, top: '11%', left: '14%', borderWidth: 2, opacity: 0.3 }} />
      {/* dots */}
      <div className="ts-dot" style={{ top: '14%', left: '6%' }} />
      <div className="ts-dot" style={{ top: '18%', left: '18%' }} />
      <div className="ts-dot" style={{ top: '8%', left: '20%' }} />
      {/* bottom-right ring */}
      <div className="ts-circle" style={{ width: 38, height: 38, bottom: '8%', right: '3%', borderWidth: 2, opacity: 0.3 }} />
      <div className="ts-dot" style={{ bottom: '12%', right: '8%' }} />
      <div className="ts-dot" style={{ bottom: '6%', right: '14%' }} />
    </>
  )
}

/* ─── Sidebar stepper ────────────────────────────────────────── */
const STEPS_META = [
  { label: 'Step 1', sub: 'Expert Identity' },
  { label: 'Step 2', sub: 'Training Services' },
  { label: 'Step 3', sub: 'Rates & Availability' },
]

function StepSidebar({ current }) {
  return (
    <div className="ts-sidebar">
      {STEPS_META.map((s, i) => {
        const num = i + 1
        const isActive = current === num
        const isDone   = current > num
        return (
          <div className="ts-sidebar-item" key={i}>
            <div className="ts-sidebar-row">
              <div className={`ts-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                {isDone
                  ? <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <div className={`ts-step-inner ${isActive ? 'active' : ''}`} />}
              </div>
              <div>
                <div className={`ts-step-label ${isActive || isDone ? 'active' : ''}`}>{s.label}</div>
                <div className="ts-step-sub">{s.sub}</div>
              </div>
            </div>
            {i < STEPS_META.length - 1 && (
              <div className={`ts-connector ${isDone ? 'ts-connector-done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tag search input (reusable) ────────────────────────────── */
function TagInput({ placeholder, selected, onAdd, onRemove, suggestions }) {
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  )

  function add(val) {
    const v = val.trim()
    if (v && !selected.includes(v)) onAdd(v)
    setQuery(''); setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="ts-skill-box" onClick={() => document.getElementById(`ti-${placeholder}`)?.focus()}>
        {selected.map((s) => (
          <span className="ts-chip" key={s}>
            {s}
            <button className="ts-chip-x" type="button" onClick={() => onRemove(s)}>×</button>
          </span>
        ))}
        <input
          id={`ti-${placeholder}`}
          className="ts-skill-input"
          placeholder={selected.length ? '' : placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) add(filtered[0]); else if (query.trim()) add(query) } }}
        />
      </div>
      {open && (filtered.length > 0) && (
        <div className="ts-suggestions">
          {filtered.map((s) => (
            <div className="ts-suggestion-item" key={s} onMouseDown={() => add(s)}>{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 240 290" width="230" height="280" fill="none">
      {/* Desk */}
      <rect x="20" y="180" width="200" height="10" rx="4" fill="#c8e6c0" />
      <rect x="30" y="190" width="8" height="55" rx="3" fill="#b0d8a0" />
      <rect x="202" y="190" width="8" height="55" rx="3" fill="#b0d8a0" />
      {/* Drawers */}
      <rect x="100" y="195" width="80" height="48" rx="4" fill="#9ab880" />
      <rect x="106" y="202" width="68" height="14" rx="2" fill="#7aad6a" />
      <circle cx="140" cy="209" r="3" fill="#c8e6c0" />
      <rect x="106" y="220" width="68" height="14" rx="2" fill="#7aad6a" />
      <circle cx="140" cy="227" r="3" fill="#c8e6c0" />
      {/* Stack of books */}
      <rect x="22" y="160" width="55" height="12" rx="2" fill="#5a8a4a" />
      <rect x="26" y="150" width="48" height="12" rx="2" fill="#7aad6a" />
      <rect x="24" y="140" width="52" height="12" rx="2" fill="#3a5a3a" />
      {/* Monitor */}
      <rect x="90" y="100" width="100" height="76" rx="6" fill="#e8f5e8" stroke="#c8e6c0" strokeWidth="2" />
      <rect x="96" y="106" width="88" height="60" rx="3" fill="#fff" />
      <rect x="130" y="176" width="20" height="8" rx="2" fill="#c8e6c0" />
      {/* Colored blocks on monitor */}
      <rect x="104" y="116" width="28" height="20" rx="3" fill="#7aad6a" />
      <rect x="136" y="116" width="22" height="20" rx="3" fill="#e87b3a" />
      <rect x="136" y="140" width="22" height="18" rx="3" fill="#e87b3a" opacity="0.7" />
      <rect x="110" y="140" width="22" height="18" rx="3" fill="#5a8a4a" opacity="0.5" />
      {/* Person — woman sitting */}
      {/* Chair */}
      <rect x="148" y="185" width="60" height="6" rx="3" fill="#a0c890" />
      <rect x="163" y="191" width="6" height="40" rx="2" fill="#a0c890" />
      <rect x="187" y="191" width="6" height="40" rx="2" fill="#a0c890" />
      {/* Legs */}
      <rect x="173" y="210" width="8" height="30" rx="3" fill="#3a2a20" />
      <rect x="185" y="210" width="8" height="30" rx="3" fill="#3a2a20" />
      {/* shoes */}
      <ellipse cx="177" cy="241" rx="9" ry="5" fill="#2a2020" />
      <ellipse cx="189" cy="241" rx="9" ry="5" fill="#2a2020" />
      {/* Body */}
      <path d="M155 178 Q155 158 176 158 Q197 158 197 178 L200 190 L152 190 Z" fill="#e87b3a" />
      {/* Head */}
      <circle cx="176" cy="138" r="20" fill="#f5d0a9" />
      {/* Hair — dark long */}
      <ellipse cx="176" cy="122" rx="19" ry="9" fill="#2a1a10" />
      <ellipse cx="157" cy="138" rx="7" ry="14" fill="#2a1a10" />
      {/* Face */}
      <circle cx="170" cy="138" r="2.5" fill="#6a4020" />
      <circle cx="182" cy="138" r="2.5" fill="#6a4020" />
      <path d="M171 146 Q176 150 181 146" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d="M155 178 Q140 188 143 200" stroke="#e87b3a" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M197 178 Q210 185 205 198" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IllusStep2() {
  return (
    <svg viewBox="0 0 240 300" width="230" height="290" fill="none">
      {/* Large whiteboard */}
      <rect x="50" y="30" width="170" height="130" rx="6" fill="#f0faf0" stroke="#c8e6c0" strokeWidth="2" />
      {/* Orange drawings on board */}
      {/* Arrow */}
      <path d="M70 100 L140 60" stroke="#e87b3a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M130 56 L142 60 L134 68" stroke="#e87b3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Circle with X */}
      <circle cx="170" cy="110" r="18" stroke="#e87b3a" strokeWidth="2.5" fill="none" />
      <path d="M160 100 L180 120 M180 100 L160 120" stroke="#e87b3a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Circle with checkmark */}
      <circle cx="110" cy="55" r="16" stroke="#e87b3a" strokeWidth="2.5" fill="none" />
      <path d="M101 55 L108 62 L120 48" stroke="#e87b3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Board stand */}
      <rect x="128" y="160" width="4" height="30" fill="#c8e6c0" />
      <rect x="100" y="188" width="60" height="5" rx="2" fill="#c8e6c0" />
      {/* Decorative plants */}
      <rect x="20" y="240" width="12" height="45" rx="3" fill="#7aad6a" />
      <ellipse cx="26" cy="228" rx="16" ry="22" fill="#5a8a4a" />
      <ellipse cx="16" cy="235" rx="10" ry="14" fill="#7aad6a" />
      <ellipse cx="36" cy="232" rx="10" ry="16" fill="#3a5a3a" />
      {/* Orange plant pots / accent */}
      <rect x="195" y="248" width="30" height="20" rx="3" fill="#e87b3a" opacity="0.7" />
      <rect x="198" y="240" width="24" height="10" rx="2" fill="#d4a060" opacity="0.6" />
      {/* Person — man in dark top */}
      {/* Body */}
      <path d="M88 230 Q88 210 112 210 Q136 210 136 230 L138 260 L86 260 Z" fill="#4a4a7a" />
      {/* Head */}
      <circle cx="112" cy="192" r="20" fill="#d4b090" />
      {/* Hair — white/grey */}
      <ellipse cx="112" cy="176" rx="18" ry="8" fill="#b0a098" />
      {/* glasses */}
      <rect x="100" y="191" width="10" height="8" rx="3" fill="none" stroke="#3a3030" strokeWidth="1.5" />
      <rect x="114" y="191" width="10" height="8" rx="3" fill="none" stroke="#3a3030" strokeWidth="1.5" />
      <line x1="110" y1="195" x2="114" y2="195" stroke="#3a3030" strokeWidth="1.2" />
      {/* Face */}
      <path d="M107 202 Q112 206 117 202" stroke="#a07050" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <rect x="95" y="260" width="12" height="34" rx="4" fill="#2a2a4a" />
      <rect x="113" y="260" width="12" height="34" rx="4" fill="#2a2a4a" />
      <ellipse cx="101" cy="295" rx="10" ry="5" fill="#1a1a2a" />
      <ellipse cx="119" cy="295" rx="10" ry="5" fill="#1a1a2a" />
      {/* Arms — hands in pockets */}
      <path d="M88 230 Q78 245 82 260" stroke="#4a4a7a" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M136 230 Q146 245 142 260" stroke="#4a4a7a" strokeWidth="10" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IllusStep3() {
  return (
    <svg viewBox="0 0 240 300" width="230" height="290" fill="none">
      {/* Teal/green background blob */}
      <ellipse cx="155" cy="185" rx="90" ry="75" fill="#c8f0d8" opacity="0.7" />
      {/* Clock on wall */}
      <circle cx="195" cy="80" r="28" fill="#fff" stroke="#c8e6c0" strokeWidth="2" />
      <circle cx="195" cy="80" r="3" fill="#5a8a4a" />
      <line x1="195" y1="80" x2="195" y2="58" stroke="#5a8a4a" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="195" y1="80" x2="212" y2="88" stroke="#e87b3a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Large orange speech bubble */}
      <path d="M105 155 Q105 120 155 120 Q205 120 205 155 Q205 190 155 190 L130 205 L142 190 Q105 190 105 155Z" fill="#e87b3a" />
      {/* lines in speech bubble */}
      <rect x="122" y="143" width="66" height="5" rx="2.5" fill="rgba(255,255,255,0.7)" />
      <rect x="122" y="154" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.5)" />
      <rect x="122" y="165" width="58" height="5" rx="2.5" fill="rgba(255,255,255,0.5)" />
      {/* green check badge */}
      <circle cx="210" cy="220" r="14" fill="#7aad6a" />
      <path d="M204 220 L209 225 L218 214" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Person — woman in orange dress */}
      {/* Dress/body */}
      <path d="M95 240 Q95 218 120 218 Q145 218 145 240 L148 270 L92 270 Z" fill="#e87b3a" />
      {/* Head */}
      <circle cx="120" cy="198" r="20" fill="#f5d0a9" />
      {/* Hair — dark bob */}
      <ellipse cx="120" cy="182" rx="18" ry="9" fill="#2a1a10" />
      <ellipse cx="138" cy="198" rx="7" ry="12" fill="#2a1a10" />
      {/* Face */}
      <circle cx="114" cy="198" r="2.5" fill="#6a4020" />
      <circle cx="126" cy="198" r="2.5" fill="#6a4020" />
      <path d="M115 206 Q120 210 125 206" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms — one reaching forward */}
      <path d="M95 240 Q80 248 76 262" stroke="#e87b3a" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M145 240 Q162 235 168 225" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <rect x="102" y="270" width="11" height="24" rx="4" fill="#c06030" />
      <rect x="118" y="270" width="11" height="24" rx="4" fill="#c06030" />
      <ellipse cx="108" cy="295" rx="10" ry="5" fill="#2a1a10" />
      <ellipse cx="124" cy="295" rx="10" ry="5" fill="#2a1a10" />
      {/* Orange badge/medal */}
      <circle cx="75" cy="168" r="16" fill="#e87b3a" />
      <rect x="71" y="152" width="8" height="8" rx="1" fill="#c06030" />
      <text x="75" y="174" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">★</text>
    </svg>
  )
}

/* ─── Success Modal ──────────────────────────────────────────── */
function SuccessModal({ onDashboard }) {
  const CONFETTI = [
    { color: '#e87b3a', left: '18%', delay: '0s',   size: 7 },
    { color: '#7aad6a', left: '30%', delay: '0.2s', size: 5 },
    { color: '#e87b3a', left: '55%', delay: '0.1s', size: 8 },
    { color: '#5a8a4a', left: '70%', delay: '0.3s', size: 6 },
    { color: '#e87b3a', left: '82%', delay: '0.05s',size: 5 },
    { color: '#7aad6a', left: '42%', delay: '0.25s',size: 7 },
    { color: '#e87b3a', left: '12%', delay: '0.4s', size: 5 },
    { color: '#5a8a4a', left: '88%', delay: '0.15s',size: 6 },
    { color: '#c8e6c0', left: '60%', delay: '0.35s',size: 8 },
    { color: '#e87b3a', left: '25%', delay: '0.45s',size: 5 },
  ]

  return (
    <div className="ts-modal-overlay">
      <div className="ts-modal">
        <div className="ts-confetti">
          {CONFETTI.map((c, i) => (
            <div key={i} className="ts-confetti-dot" style={{
              width: c.size, height: c.size, background: c.color,
              left: c.left, top: '10%',
              animationDelay: c.delay,
            }} />
          ))}
        </div>

        <div className="ts-modal-icon-wrap">
          <div className="ts-modal-party-hat">🎩</div>
          <div className="ts-modal-icon">
            <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
              <path d="M3 14L13 24L31 4" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h2 className="ts-modal-title">Your expert profile is live!</h2>
        <p className="ts-modal-sub">
          You're all set to start sharing your knowledge. We'll notify you as soon as companies or professionals request your services.
        </p>

        <button className="ts-btn ts-modal-btn" onClick={onDashboard}>
          Go to Instructor Dashboard
        </button>
      </div>
    </div>
  )
}

/* ─── Step 1 — Expert Identity ───────────────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!data.headline?.trim()) e.headline = 'Professional headline is required.'
    if (!data.expertise?.trim()) e.expertise = 'Area of expertise is required.'
    if (!data.years_exp) e.years_exp = 'Please select years of experience.'
    return e
  }

  function handleNext() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  return (
    <>
      <h2 className="ts-card-title">Set up your Trainer profile</h2>
      <p className="ts-card-sub">Showcase your expertise and start connecting with companies and professionals looking to grow.</p>

      <div className="ts-field">
        <label>Professional Headline</label>
        <input className={`ts-input${errors.headline ? ' ts-input-err' : ''}`} type="text"
          placeholder="Enter Professional Headline  e.g. Certified Python Instructor"
          value={data.headline || ''}
          onChange={(e) => { onChange('headline', e.target.value); setErrors((p) => ({ ...p, headline: '' })) }} />
        {errors.headline && <span className="ts-err">{errors.headline}</span>}
      </div>

      <div className="ts-field">
        <label>Area of Expertise</label>
        <input className={`ts-input${errors.expertise ? ' ts-input-err' : ''}`} type="text"
          placeholder="Enter Your Area of Expertise  e.g. Technology, Leadership"
          value={data.expertise || ''}
          onChange={(e) => { onChange('expertise', e.target.value); setErrors((p) => ({ ...p, expertise: '' })) }} />
        {errors.expertise && <span className="ts-err">{errors.expertise}</span>}
      </div>

      <div className="ts-field">
        <label>Years of Experience</label>
        <div className="ts-select-wrap">
          <select className={`ts-input ts-select${errors.years_exp ? ' ts-input-err' : ''}`}
            value={data.years_exp || ''}
            onChange={(e) => { onChange('years_exp', e.target.value); setErrors((p) => ({ ...p, years_exp: '' })) }}>
            <option value="">Select Years of Experience</option>
            {EXP_YEARS.map((y) => <option key={y} value={y}>{y} year{y !== '1' ? 's' : ''}</option>)}
          </select>
          <span className="ts-select-arrow">▾</span>
        </div>
        {errors.years_exp && <span className="ts-err">{errors.years_exp}</span>}
      </div>

      <button className="ts-btn" onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── Step 2 — Training Services ─────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState('')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (f) { setFileName(f.name); onChange('cert_file', f) }
  }

  return (
    <>
      <h2 className="ts-card-title">How do you teach?</h2>
      <p className="ts-card-sub">Tell us about the types of training services you offer to help us find the right students.</p>

      <div className="ts-field">
        <label>Service Types</label>
        <TagInput
          placeholder="Search Service Types"
          selected={data.service_types || []}
          onAdd={(v) => onChange('service_types', [...(data.service_types || []), v])}
          onRemove={(v) => onChange('service_types', (data.service_types || []).filter((x) => x !== v))}
          suggestions={SERVICE_TYPES_LIST}
        />
      </div>

      <div className="ts-field">
        <label>Languages you teach in</label>
        <TagInput
          placeholder="Search Languages"
          selected={data.languages || []}
          onAdd={(v) => onChange('languages', [...(data.languages || []), v])}
          onRemove={(v) => onChange('languages', (data.languages || []).filter((x) => x !== v))}
          suggestions={LANGUAGES_LIST}
        />
      </div>

      <div className="ts-field">
        <label>Links to Portfolio</label>
        <input className="ts-input" type="url"
          placeholder="Paste Links to Portfolio"
          value={data.portfolio_links || ''}
          onChange={(e) => onChange('portfolio_links', e.target.value)} />
      </div>

      {/* Upload area */}
      <div className={`ts-upload-area ${fileName ? 'done' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setFileName(f.name); onChange('cert_file', f) } }}>
        <input ref={fileRef} type="file" accept=".pdf" hidden onChange={handleFile} />
        <div className="ts-upload-icon">
          {fileName
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5a8a4a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aad6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          }
        </div>
        <div className="ts-upload-title">{fileName || 'Upload Certifications (PDF)'}</div>
        <div className="ts-upload-hint">{fileName ? 'Click to change file' : 'Drag or Click to Browse'}</div>
      </div>

      <button className="ts-btn" onClick={onNext}>Next Step</button>
      <button className="ts-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Step 3 — Rates & Availability ──────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <>
      <h2 className="ts-card-title">Set your schedule</h2>
      <p className="ts-card-sub">Define your availability and pricing to start receiving training inquiries directly.</p>

      <div className="ts-field">
        <label>Hourly Rate ($)</label>
        <input className="ts-input" type="text"
          placeholder="Enter amount or range"
          value={data.hourly_rate || ''}
          onChange={(e) => onChange('hourly_rate', e.target.value)} />
      </div>

      <div className="ts-field">
        <label>Connect Calendar</label>
        <div className="ts-cal-wrap">
          <input className="ts-input" type="text"
            placeholder="(Google/Outlook)"
            value={data.calendar_link || ''}
            onChange={(e) => onChange('calendar_link', e.target.value)}
            style={{ paddingRight: '2.4rem' }} />
          <span className="ts-cal-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ab89a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
        </div>
      </div>

      <div className="ts-field">
        <label>Timezone</label>
        <div className="ts-select-wrap">
          <select className="ts-input ts-select"
            value={data.timezone || ''}
            onChange={(e) => onChange('timezone', e.target.value)}>
            <option value="">Choose Timezone</option>
            {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="ts-select-arrow">▾</span>
        </div>
      </div>

      <button className="ts-btn" onClick={onFinish} disabled={loading}>
        {loading ? <><span className="ts-spinner" /> Saving…</> : 'Finish Setup'}
      </button>
      <button className="ts-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export function TrainerSetup() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = Math.min(Math.max(parseInt(stepParam) || 1, 1), 3)

  const [data, setData]       = useState({ service_types: [], languages: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showModal, setShowModal] = useState(false)

  function onChange(field, val) { setData((p) => ({ ...p, [field]: val })) }
  function goTo(n) { navigate(`/setup/trainer/${n}`) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true); setError('')
    const payload = {
      name: data.headline || 'Trainer',
      contact_email: data.contact_email || '',
      website_url: data.portfolio_links || null,
      country: 'Australia',
      status: 'active',
    }
    try {
      await createTrainingProvider(payload, token)
      setShowModal(true)
    } catch (err) {
      setError(err.detail || 'Failed to create trainer profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ILLUS = [<IllusStep1 />, <IllusStep2 />, <IllusStep3 />]

  return (
    <div className="ts-page">
      <Blobs />

      <div className="ts-layout">
        {/* Left sidebar stepper */}
        <StepSidebar current={step} />

        {/* Center card */}
        <div className="ts-card">
          {error && <div className="ts-api-error">{error}</div>}
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => goTo(2)} loading={loading} />}
        </div>

        {/* Right illustration */}
        <div className="ts-illus">
          {ILLUS[step - 1]}
        </div>
      </div>

      {/* Success modal */}
      {showModal && (
        <SuccessModal onDashboard={() => navigate('/dashboard')} />
      )}
    </div>
  )
}
