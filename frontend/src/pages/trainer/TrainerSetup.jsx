import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FigmaBg } from '../../components/FigmaBg'
import { createTrainingProvider, getToken } from '../../services/api'
import './TrainerSetup.css'

/* ─── Constants ──────────────────────────────────────────────── */
const LS_KEY = 'trainer_setup'

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
  'UTC', 'EST (UTC-5)', 'PST (UTC-8)', 'GMT (UTC+0)',
  'IST (UTC+5:30)', 'PKT (UTC+5)', 'AEST (UTC+10)',
  'ACST (UTC+9:30)', 'AWST (UTC+8)', 'NZST (UTC+12)',
  'JST (UTC+9)', 'CET (UTC+1)', 'EET (UTC+2)',
]
const EXP_OPTIONS = ['1-2', '3-5', '6-10', '10+']

const STEPS_META = [
  { num: 1, label: 'Step 1', sub: 'Expert Identity' },
  { num: 2, label: 'Step 2', sub: 'Training Services' },
  { num: 3, label: 'Step 3', sub: 'Rates & Availability' },
  { num: 4, label: 'Step 4', sub: 'Profile Live!' },
]

/* ─── localStorage helpers ───────────────────────────────────── */
function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) { /* noop */ }
  return { service_types: [], languages: [] }
}
function saveData(data) {
  try {
    // Don't persist File objects
    const { cert_file, ...rest } = data
    localStorage.setItem(LS_KEY, JSON.stringify(rest))
  } catch (_) { /* noop */ }
}

/* ─── Step Sidebar ───────────────────────────────────────────── */
function StepSidebar({ current }) {
  return (
    <div className="fd-steps">
      {STEPS_META.map(({ num, label, sub }) => {
        const isActive = current === num
        const isDone = current > num
        const cls = `fd-step${isDone ? ' done' : isActive ? ' active' : ''}`
        return (
          <div className={cls} key={num}>
            <div className="fd-step-line" />
            <div className="fd-step-circle" />
            <div className="fd-step-info">
              <div className="fd-step-num">{label}</div>
              <div className="fd-step-sub">{sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tag Input ──────────────────────────────────────────────── */
function TagInput({ placeholder, selected, onAdd, onRemove, suggestions }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputId = `tag-input-${placeholder.replace(/\s+/g, '-')}`

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  )

  function add(val) {
    const v = val.trim()
    if (v && !selected.includes(v)) onAdd(v)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (filtered[0]) add(filtered[0])
      else if (query.trim()) add(query)
    }
    if (e.key === 'Backspace' && !query && selected.length) {
      onRemove(selected[selected.length - 1])
    }
  }

  return (
    <div className="ts-tag-wrap">
      <div
        className="fd-input ts-tag-box"
        onClick={() => document.getElementById(inputId)?.focus()}
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
          id={inputId}
          className="ts-tag-input"
          placeholder={selected.length ? '' : placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="ts-dropdown">
          {filtered.map((s) => (
            <div
              key={s}
              className="ts-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); add(s) }}
            >{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 260 300" width="240" height="280" fill="none" aria-hidden="true">
      {/* Desk surface */}
      <rect x="18" y="192" width="210" height="10" rx="4" fill="#c5d8f8" />
      <rect x="28" y="202" width="9" height="50" rx="3" fill="#a8c4f0" />
      <rect x="207" y="202" width="9" height="50" rx="3" fill="#a8c4f0" />
      {/* Drawer unit */}
      <rect x="105" y="207" width="85" height="44" rx="4" fill="#9ab5e8" />
      <rect x="111" y="213" width="73" height="12" rx="2" fill="#7ea0d8" />
      <circle cx="148" cy="219" r="2.5" fill="#c5d8f8" />
      <rect x="111" y="230" width="73" height="12" rx="2" fill="#7ea0d8" />
      <circle cx="148" cy="236" r="2.5" fill="#c5d8f8" />
      {/* Stacked books */}
      <rect x="20" y="173" width="58" height="12" rx="2" fill="#5379f4" />
      <rect x="24" y="163" width="50" height="12" rx="2" fill="#7a9cf6" />
      <rect x="22" y="153" width="54" height="12" rx="2" fill="#3a5ad0" />
      <rect x="26" y="143" width="46" height="12" rx="2" fill="#5379f4" opacity="0.7" />
      {/* Monitor */}
      <rect x="88" y="108" width="106" height="78" rx="7" fill="#eef3ff" stroke="#c5d8f8" strokeWidth="2" />
      <rect x="95" y="115" width="92" height="62" rx="4" fill="#fff" />
      <rect x="132" y="186" width="22" height="8" rx="2" fill="#c5d8f8" />
      {/* Abstract color blocks on screen (blue/orange/pink) */}
      <rect x="103" y="123" width="30" height="22" rx="3" fill="#5379f4" />
      <rect x="137" y="123" width="24" height="22" rx="3" fill="#f26f37" />
      <rect x="137" y="149" width="24" height="20" rx="3" fill="#f26f37" opacity="0.6" />
      <rect x="113" y="149" width="20" height="20" rx="3" fill="#e066aa" opacity="0.7" />
      {/* Chair */}
      <rect x="152" y="196" width="64" height="6" rx="3" fill="#a8c4f0" />
      <rect x="166" y="202" width="7" height="36" rx="2" fill="#a8c4f0" />
      <rect x="193" y="202" width="7" height="36" rx="2" fill="#a8c4f0" />
      {/* Legs */}
      <rect x="174" y="218" width="9" height="32" rx="3" fill="#2a2020" />
      <rect x="188" y="218" width="9" height="32" rx="3" fill="#2a2020" />
      <ellipse cx="179" cy="251" rx="9" ry="5" fill="#1a1414" />
      <ellipse cx="192" cy="251" rx="9" ry="5" fill="#1a1414" />
      {/* Body — woman in teal top */}
      <path d="M158 185 Q158 165 180 165 Q202 165 202 185 L206 198 L154 198 Z" fill="#2ab5c8" />
      {/* Head */}
      <circle cx="180" cy="146" r="20" fill="#f5d0a9" />
      {/* Dark hair */}
      <ellipse cx="180" cy="130" rx="19" ry="9" fill="#2a1a10" />
      <ellipse cx="161" cy="146" rx="7" ry="14" fill="#2a1a10" />
      {/* Face */}
      <circle cx="174" cy="146" r="2.5" fill="#6a4020" />
      <circle cx="186" cy="146" r="2.5" fill="#6a4020" />
      <path d="M175 154 Q180 158 185 154" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d="M158 185 Q143 195 146 208" stroke="#2ab5c8" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M202 185 Q216 192 210 205" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IllusStep2() {
  return (
    <svg viewBox="0 0 260 310" width="240" height="295" fill="none" aria-hidden="true">
      {/* Whiteboard */}
      <rect x="52" y="28" width="176" height="136" rx="7" fill="#f0f6ff" stroke="#c5d8f8" strokeWidth="2" />
      {/* Orange diagram on board — arrow */}
      <path d="M72 105 L148 62" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M138 57 L150 62 L142 70" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Circle with X */}
      <circle cx="178" cy="112" r="19" stroke="#f26f37" strokeWidth="2.5" fill="none" />
      <path d="M167 101 L189 123 M189 101 L167 123" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" />
      {/* Circle with check */}
      <circle cx="114" cy="56" r="17" stroke="#f26f37" strokeWidth="2.5" fill="none" />
      <path d="M105 56 L112 63 L124 49" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Connecting lines on board */}
      <line x1="72" y1="105" x2="114" y2="56" stroke="#f26f37" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      <line x1="114" y1="56" x2="178" y2="112" stroke="#f26f37" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      {/* Board stand */}
      <rect x="130" y="164" width="4" height="32" fill="#c5d8f8" />
      <rect x="104" y="193" width="56" height="5" rx="2" fill="#c5d8f8" />
      {/* Plant */}
      <rect x="18" y="248" width="14" height="44" rx="3" fill="#5379f4" opacity="0.4" />
      <ellipse cx="25" cy="234" rx="17" ry="22" fill="#4060d0" opacity="0.5" />
      <ellipse cx="14" cy="242" rx="11" ry="15" fill="#5379f4" opacity="0.4" />
      <ellipse cx="36" cy="238" rx="11" ry="16" fill="#3a50b8" opacity="0.4" />
      {/* Small orange accent block */}
      <rect x="200" y="254" width="32" height="22" rx="4" fill="#f26f37" opacity="0.65" />
      <rect x="204" y="244" width="24" height="12" rx="2" fill="#f5a070" opacity="0.5" />
      {/* Person — older man with glasses in dark top */}
      <path d="M86 240 Q86 218 112 218 Q138 218 138 240 L140 268 L84 268 Z" fill="#3a3a6a" />
      {/* Head */}
      <circle cx="112" cy="200" r="20" fill="#d4b090" />
      {/* White/grey hair */}
      <ellipse cx="112" cy="184" rx="19" ry="9" fill="#b0a098" />
      <ellipse cx="94" cy="200" rx="6" ry="10" fill="#b0a098" />
      {/* Glasses */}
      <rect x="100" y="199" width="11" height="9" rx="3" fill="none" stroke="#2a2030" strokeWidth="1.8" />
      <rect x="115" y="199" width="11" height="9" rx="3" fill="none" stroke="#2a2030" strokeWidth="1.8" />
      <line x1="111" y1="203" x2="115" y2="203" stroke="#2a2030" strokeWidth="1.4" />
      <line x1="99" y1="203" x2="96" y2="201" stroke="#2a2030" strokeWidth="1.2" />
      <line x1="126" y1="203" x2="129" y2="201" stroke="#2a2030" strokeWidth="1.2" />
      {/* Face */}
      <path d="M106 212 Q112 216 118 212" stroke="#a07050" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <rect x="93" y="268" width="13" height="36" rx="4" fill="#2a2a50" />
      <rect x="112" y="268" width="13" height="36" rx="4" fill="#2a2a50" />
      <ellipse cx="100" cy="305" rx="11" ry="5" fill="#1a1a30" />
      <ellipse cx="119" cy="305" rx="11" ry="5" fill="#1a1a30" />
      {/* Arms */}
      <path d="M86 240 Q75 255 80 270" stroke="#3a3a6a" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M138 240 Q149 255 144 270" stroke="#3a3a6a" strokeWidth="11" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IllusStep3() {
  return (
    <svg viewBox="0 0 260 310" width="240" height="295" fill="none" aria-hidden="true">
      {/* Teal background blob */}
      <ellipse cx="160" cy="188" rx="94" ry="78" fill="#c5d8f8" opacity="0.55" />
      {/* Clock on wall */}
      <circle cx="200" cy="80" r="30" fill="#fff" stroke="#c5d8f8" strokeWidth="2" />
      <circle cx="200" cy="80" r="3.5" fill="#5379f4" />
      <line x1="200" y1="80" x2="200" y2="57" stroke="#5379f4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="200" y1="80" x2="218" y2="90" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" />
      {/* Clock tick marks */}
      <line x1="200" y1="52" x2="200" y2="57" stroke="#c5d8f8" strokeWidth="1.5" />
      <line x1="200" y1="103" x2="200" y2="108" stroke="#c5d8f8" strokeWidth="1.5" />
      <line x1="172" y1="80" x2="177" y2="80" stroke="#c5d8f8" strokeWidth="1.5" />
      <line x1="223" y1="80" x2="228" y2="80" stroke="#c5d8f8" strokeWidth="1.5" />
      {/* Orange speech bubble */}
      <path d="M108 162 Q108 126 158 126 Q208 126 208 162 Q208 198 158 198 L132 214 L144 198 Q108 198 108 162Z" fill="#f26f37" />
      {/* Lines in bubble */}
      <rect x="126" y="150" width="64" height="5" rx="2.5" fill="rgba(255,255,255,0.75)" />
      <rect x="126" y="161" width="48" height="5" rx="2.5" fill="rgba(255,255,255,0.55)" />
      <rect x="126" y="172" width="56" height="5" rx="2.5" fill="rgba(255,255,255,0.55)" />
      {/* Green check badge */}
      <circle cx="214" cy="228" r="15" fill="#22c55e" />
      <path d="M207 228 L212 233 L221 222" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Calendar accent */}
      <rect x="44" y="130" width="38" height="36" rx="5" fill="#fff" stroke="#c5d8f8" strokeWidth="1.5" />
      <rect x="44" y="130" width="38" height="11" rx="5" fill="#5379f4" />
      <rect x="44" y="136" width="38" height="5" fill="#5379f4" />
      <line x1="56" y1="126" x2="56" y2="134" stroke="#5379f4" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="126" x2="70" y2="134" stroke="#5379f4" strokeWidth="2" strokeLinecap="round" />
      <rect x="50" y="148" width="6" height="6" rx="1" fill="#c5d8f8" />
      <rect x="60" y="148" width="6" height="6" rx="1" fill="#c5d8f8" />
      <rect x="70" y="148" width="6" height="6" rx="1" fill="#5379f4" />
      {/* Person — woman in orange dress */}
      <path d="M93 248 Q93 224 120 224 Q147 224 147 248 L150 276 L90 276 Z" fill="#f26f37" />
      {/* Head */}
      <circle cx="120" cy="203" r="20" fill="#f5d0a9" />
      {/* Dark hair */}
      <ellipse cx="120" cy="187" rx="19" ry="9" fill="#2a1a10" />
      <ellipse cx="139" cy="203" rx="7" ry="12" fill="#2a1a10" />
      {/* Face */}
      <circle cx="114" cy="203" r="2.5" fill="#6a4020" />
      <circle cx="126" cy="203" r="2.5" fill="#6a4020" />
      <path d="M115 211 Q120 215 125 211" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d="M93 248 Q78 256 74 270" stroke="#f26f37" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M147 248 Q165 242 170 232" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <rect x="100" y="276" width="12" height="26" rx="4" fill="#c06030" />
      <rect x="117" y="276" width="12" height="26" rx="4" fill="#c06030" />
      <ellipse cx="106" cy="303" rx="11" ry="5" fill="#2a1a10" />
      <ellipse cx="123" cy="303" rx="11" ry="5" fill="#2a1a10" />
      {/* Star badge */}
      <circle cx="72" cy="170" r="17" fill="#f26f37" />
      <rect x="68" y="153" width="8" height="9" rx="1.5" fill="#c06030" />
      <text x="72" y="176" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">★</text>
    </svg>
  )
}

/* ─── Success Modal ──────────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#5379f4','#f26f37','#22c55e','#e066aa','#f5c842',
  '#5379f4','#f26f37','#22c55e','#3a5ad0','#f5a070',
]

function SuccessModal({ onDashboard }) {
  return (
    <div className="fd-modal-overlay">
      <div className="fd-modal">
        <div className="fd-confetti" aria-hidden="true">
          {CONFETTI_COLORS.map((color, i) => (
            <span key={i} style={{
              background: color,
              left: `${8 + i * 9}%`,
              top: '5%',
              animationDelay: `${i * 0.09}s`,
            }} />
          ))}
        </div>

        <div className="fd-modal-icon">
          <div className="fd-modal-hat">🎩</div>
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
            <path d="M3 14L14 25L33 4" stroke="white" strokeWidth="4"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="fd-modal-title">Your expert profile is live!</h2>
        <p className="fd-modal-sub">
          You're all set to start sharing your knowledge. We'll notify you as soon as
          companies or professionals request your services.
        </p>

        <button className="fd-btn" onClick={onDashboard}>
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

  function field(key, value) {
    onChange(key, value)
    setErrors((p) => ({ ...p, [key]: '' }))
  }

  return (
    <>
      <h2 className="fd-setup-card-title">Set up your Trainer profile</h2>
      <p className="fd-setup-card-sub">
        Showcase your expertise and start connecting with companies and professionals looking to grow.
      </p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-headline">Professional Headline</label>
        <input
          id="ts-headline"
          className={`fd-input${errors.headline ? ' error' : ''}`}
          type="text"
          placeholder="e.g., Certified Python Instructor"
          value={data.headline || ''}
          onChange={(e) => field('headline', e.target.value)}
        />
        {errors.headline && <div className="ts-field-error">{errors.headline}</div>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-expertise">Area of Expertise</label>
        <input
          id="ts-expertise"
          className={`fd-input${errors.expertise ? ' error' : ''}`}
          type="text"
          placeholder="e.g., Technology, Leadership"
          value={data.expertise || ''}
          onChange={(e) => field('expertise', e.target.value)}
        />
        {errors.expertise && <div className="ts-field-error">{errors.expertise}</div>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-years">Years of Experience</label>
        <select
          id="ts-years"
          className={`fd-input${errors.years_exp ? ' error' : ''}`}
          value={data.years_exp || ''}
          onChange={(e) => field('years_exp', e.target.value)}
        >
          <option value="">Select years of experience</option>
          {EXP_OPTIONS.map((y) => (
            <option key={y} value={y}>{y} years</option>
          ))}
        </select>
        {errors.years_exp && <div className="ts-field-error">{errors.years_exp}</div>}
      </div>

      <button className="fd-btn" onClick={handleNext}>Next Step</button>
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

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) { setFileName(f.name); onChange('cert_file', f) }
  }

  return (
    <>
      <h2 className="fd-setup-card-title">How do you teach?</h2>
      <p className="fd-setup-card-sub">
        Tell us about the types of training services you offer to help us find the right students.
      </p>

      <div className="fd-group">
        <label className="fd-label">Service Types</label>
        <TagInput
          placeholder="Search Service Types"
          selected={data.service_types || []}
          onAdd={(v) => onChange('service_types', [...(data.service_types || []), v])}
          onRemove={(v) => onChange('service_types', (data.service_types || []).filter((x) => x !== v))}
          suggestions={SERVICE_TYPES_LIST}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label">Languages you teach in</label>
        <TagInput
          placeholder="Search Languages"
          selected={data.languages || []}
          onAdd={(v) => onChange('languages', [...(data.languages || []), v])}
          onRemove={(v) => onChange('languages', (data.languages || []).filter((x) => x !== v))}
          suggestions={LANGUAGES_LIST}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-portfolio">Links to Portfolio</label>
        <input
          id="ts-portfolio"
          className="fd-input"
          type="url"
          placeholder="Paste Links to Portfolio"
          value={data.portfolio_links || ''}
          onChange={(e) => onChange('portfolio_links', e.target.value)}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label">Upload Certifications</label>
        <div
          className={`fd-upload${fileName ? ' has-file' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          aria-label="Upload certification PDF"
        >
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={handleFile} />
          <div className="fd-upload-icon">
            {fileName
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6a7380" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            }
          </div>
          <div className="fd-upload-title">{fileName || 'Upload Certifications (PDF)'}</div>
          <div className="fd-upload-sub">{fileName ? 'Click to change file' : 'Drag & drop or click to browse'}</div>
        </div>
      </div>

      <button className="fd-btn" onClick={onNext}>Next Step</button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Step 3 — Rates & Availability ──────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <>
      <h2 className="fd-setup-card-title">Set your schedule</h2>
      <p className="fd-setup-card-sub">
        Define your availability and pricing to start receiving training inquiries directly.
      </p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-rate">Hourly Rate ($)</label>
        <input
          id="ts-rate"
          className="fd-input"
          type="text"
          placeholder="Enter amount or range"
          value={data.hourly_rate || ''}
          onChange={(e) => onChange('hourly_rate', e.target.value)}
        />
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-calendar">Connect Calendar</label>
        <div className="fd-input-wrap">
          <input
            id="ts-calendar"
            className="fd-input"
            type="text"
            placeholder="(Google/Outlook)"
            value={data.calendar_link || ''}
            onChange={(e) => onChange('calendar_link', e.target.value)}
            style={{ paddingRight: '2.6rem' }}
          />
          <span className="fd-eye" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#6a7380" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
        </div>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="ts-timezone">Timezone</label>
        <select
          id="ts-timezone"
          className="fd-input"
          value={data.timezone || ''}
          onChange={(e) => onChange('timezone', e.target.value)}
        >
          <option value="">Choose Timezone</option>
          {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <button className="fd-btn" onClick={onFinish} disabled={loading}>
        {loading
          ? <><span className="spinner" aria-hidden="true" /> Saving…</>
          : 'Finish Setup'}
      </button>
      <button className="fd-btn-ghost" onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function TrainerSetup() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = Math.min(Math.max(parseInt(stepParam) || 1, 1), 4)

  const [data, setData] = useState(() => loadData())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Persist on every change
  useEffect(() => { saveData(data) }, [data])

  function onChange(field, val) {
    setData((p) => ({ ...p, [field]: val }))
  }

  function goTo(n) { navigate(`/setup/trainer/${n}`) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setError('')
    try {
      await createTrainingProvider({
        name: data.headline || 'Trainer',
        contact_email: data.contact_email || '',
        website_url: data.portfolio_links || null,
        country: 'Australia',
        status: 'active',
      }, token)
      localStorage.removeItem(LS_KEY)
      navigate('/setup/trainer/4')
    } catch (err) {
      setError(err.detail || 'Failed to create trainer profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ILLUS = [<IllusStep1 />, <IllusStep2 />, <IllusStep3 />, null]

  return (
    <div className="fd-setup-page">
      <FigmaBg />

      <div className="fd-setup-inner" style={{ alignItems: 'center' }}>
        {/* Left — step tracker */}
        <StepSidebar current={step} />

        {/* Center — card */}
        <div className="fd-setup-card">
          {error && (
            <div className="fd-alert fd-alert-error" role="alert">{error}</div>
          )}
          {step === 1 && (
            <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />
          )}
          {step === 2 && (
            <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />
          )}
          {step === 3 && (
            <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => goTo(2)} loading={loading} />
          )}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: '#f26f37',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.2rem', position: 'relative',
              }}>
                <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-30%)', fontSize: '1.5rem' }}>🎩</span>
                <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                  <path d="M3 14L14 25L33 4" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {[
                { c:'#5379f4', l:'10%' }, { c:'#f26f37', l:'26%' }, { c:'#22c55e', l:'44%' },
                { c:'#b4eb50', l:'60%' }, { c:'#f26f37', l:'76%' }, { c:'#5379f4', l:'88%' },
              ].map(({ c, l }, i) => (
                <span key={i} style={{
                  position: 'absolute', width: 7, height: 7, borderRadius: i % 2 === 0 ? '50%' : '2px',
                  background: c, left: l, top: '6%',
                  animation: 'fd-fall 1.2s ease-in forwards', animationDelay: `${i * 0.12}s`,
                }} />
              ))}
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#343434', marginBottom: '0.6rem' }}>
                Your expert profile is live!
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6a7380', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                You're all set to start sharing your knowledge. We'll notify you as soon as
                companies or professionals request your services.
              </p>
              <button className="fd-btn" onClick={() => navigate('/dashboard')}>
                Go to Instructor Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Right — illustration (hidden on step 4) */}
        {step < 4 && (
          <div className="fd-setup-illus">
            {ILLUS[step - 1]}
          </div>
        )}
      </div>

      {showModal && (
        <SuccessModal onDashboard={() => navigate('/dashboard')} />
      )}
    </div>
  )
}
