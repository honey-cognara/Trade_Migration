import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTrainingProvider, getToken } from '../../services/api'

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_KEY = 'trainer_setup'
function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { service_types: [], languages: [] }
}
function saveData(data) {
  try {
    const { cert_file, ...rest } = data
    localStorage.setItem(LS_KEY, JSON.stringify(rest))
  } catch (_) {}
}

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg: '#f7f7f7',
  card: '#dce8ff',
  blue: '#5379f4',
  orange: '#f26f37',
  purple: '#5b4fce',
  dark: '#1a1a2e',
  grey: '#6a7380',
  inputBorder: '1.5px solid #d0dbf0',
  radius: 10,
}

/* ─── Steps config ───────────────────────────────────────────── */
const STEPS = [
  { label: 'Step 1', sub: 'Expert Identity' },
  { label: 'Step 2', sub: 'Training Services' },
  { label: 'Step 3', sub: 'Rates & Availability' },
]

/* ─── Background Decorations ─────────────────────────────────── */
function BgDecorations() {
  return (
    <>
      <div style={{ position: 'absolute', left: '4%', top: '7%', width: 20, height: 20, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '2.5%', top: '13%', width: 13, height: 13, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '5%', top: '19%', width: 8, height: 8, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: -60, right: -80, width: 300, height: 240, borderRadius: '50%', background: '#c8f07a', opacity: 0.7, zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 20, right: 60, width: 220, height: 180, borderRadius: '50%', background: '#9dd4f0', opacity: 0.6, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -60, left: -80, width: 280, height: 240, borderRadius: '50%', background: '#8ed8c0', opacity: 0.65, zIndex: 0 }} />
      <div style={{ position: 'absolute', right: '3.5%', bottom: '9%', width: 18, height: 18, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
      <div style={{ position: 'absolute', right: '5.5%', bottom: '15%', width: 12, height: 12, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
    </>
  )
}

/* ─── Step Sidebar ───────────────────────────────────────────── */
function StepSidebar({ steps, current }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 160, paddingTop: '1rem' }}>
      {steps.map((s, i) => {
        const n = i + 1
        const active = n <= current
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: active ? T.purple : 'transparent',
                border: active ? `2px solid ${T.purple}` : '2px solid #ccc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: active ? T.purple : '#bbb' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: active ? T.grey : '#ccc' }}>
                  {s.sub}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 2, height: 28, background: '#e0e0e0', marginLeft: 10 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Shared styles ──────────────────────────────────────────── */
const inputStyle = {
  width: '100%',
  background: '#fff',
  border: T.inputBorder,
  borderRadius: T.radius,
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  color: T.dark,
  outline: 'none',
  boxSizing: 'border-box',
}
const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a7380' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.9rem center',
}
const labelStyle = {
  display: 'block', fontWeight: 600, fontSize: '0.85rem',
  color: T.dark, marginBottom: '0.35rem',
}
const groupStyle = { marginBottom: '1rem' }
const btnStyle = {
  width: '100%', background: T.blue, color: '#fff', border: 'none',
  borderRadius: T.radius, padding: '0.85rem', fontSize: '0.95rem',
  fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem',
}
const backStyle = {
  display: 'block', textAlign: 'center', marginTop: '0.75rem',
  color: T.blue, background: 'none', border: 'none',
  cursor: 'pointer', fontSize: '0.9rem', width: '100%',
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 260 300" width="240" height="280" fill="none" aria-hidden="true">
      {/* Desk surface */}
      <rect x="18" y="192" width="210" height="10" rx="4" fill="#c5d8f8" />
      <rect x="28" y="202" width="9" height="50" rx="3" fill="#a8c4f0" />
      <rect x="207" y="202" width="9" height="50" rx="3" fill="#a8c4f0" />
      {/* Stacked books */}
      <rect x="20" y="173" width="58" height="12" rx="2" fill="#5379f4" />
      <rect x="24" y="163" width="50" height="12" rx="2" fill="#7a9cf6" />
      <rect x="22" y="153" width="54" height="12" rx="2" fill="#3a5ad0" />
      <rect x="26" y="143" width="46" height="12" rx="2" fill="#5379f4" opacity="0.7" />
      {/* Monitor */}
      <rect x="88" y="108" width="106" height="78" rx="7" fill="#eef3ff" stroke="#c5d8f8" strokeWidth="2" />
      <rect x="95" y="115" width="92" height="62" rx="4" fill="#fff" />
      <rect x="132" y="186" width="22" height="8" rx="2" fill="#c5d8f8" />
      {/* 3 color blocks on screen: blue, orange, pink */}
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
      {/* Man + woman at desk, orange highlight */}
      <path d="M158 185 Q158 165 180 165 Q202 165 202 185 L206 198 L154 198 Z" fill="#2ab5c8" />
      <circle cx="180" cy="146" r="20" fill="#f5d0a9" />
      <ellipse cx="180" cy="130" rx="19" ry="9" fill="#2a1a10" />
      <ellipse cx="161" cy="146" rx="7" ry="14" fill="#2a1a10" />
      <circle cx="174" cy="146" r="2.5" fill="#6a4020" />
      <circle cx="186" cy="146" r="2.5" fill="#6a4020" />
      <path d="M175 154 Q180 158 185 154" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
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
      {/* Orange diagram — arrow */}
      <path d="M72 105 L148 62" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M138 57 L150 62 L142 70" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Circle with X */}
      <circle cx="178" cy="112" r="19" stroke="#f26f37" strokeWidth="2.5" fill="none" />
      <path d="M167 101 L189 123 M189 101 L167 123" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" />
      {/* Circle with check */}
      <circle cx="114" cy="56" r="17" stroke="#f26f37" strokeWidth="2.5" fill="none" />
      <path d="M105 56 L112 63 L124 49" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Dashed lines */}
      <line x1="72" y1="105" x2="114" y2="56" stroke="#f26f37" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      <line x1="114" y1="56" x2="178" y2="112" stroke="#f26f37" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
      {/* Board stand */}
      <rect x="130" y="164" width="4" height="32" fill="#c5d8f8" />
      <rect x="104" y="193" width="56" height="5" rx="2" fill="#c5d8f8" />
      {/* Blue plant */}
      <rect x="18" y="248" width="14" height="44" rx="3" fill="#5379f4" opacity="0.4" />
      <ellipse cx="25" cy="234" rx="17" ry="22" fill="#4060d0" opacity="0.5" />
      <ellipse cx="14" cy="242" rx="11" ry="15" fill="#5379f4" opacity="0.4" />
      <ellipse cx="36" cy="238" rx="11" ry="16" fill="#3a50b8" opacity="0.4" />
      {/* Orange accent */}
      <rect x="200" y="254" width="32" height="22" rx="4" fill="#f26f37" opacity="0.65" />
      <rect x="204" y="244" width="24" height="12" rx="2" fill="#f5a070" opacity="0.5" />
      {/* Professor — grey hair, glasses, dark sweater */}
      <path d="M86 240 Q86 218 112 218 Q138 218 138 240 L140 268 L84 268 Z" fill="#3a3a6a" />
      <circle cx="112" cy="200" r="20" fill="#d4b090" />
      {/* Grey hair */}
      <ellipse cx="112" cy="184" rx="19" ry="9" fill="#b0a098" />
      <ellipse cx="94" cy="200" rx="6" ry="10" fill="#b0a098" />
      {/* Glasses */}
      <rect x="100" y="199" width="11" height="9" rx="3" fill="none" stroke="#2a2030" strokeWidth="1.8" />
      <rect x="115" y="199" width="11" height="9" rx="3" fill="none" stroke="#2a2030" strokeWidth="1.8" />
      <line x1="111" y1="203" x2="115" y2="203" stroke="#2a2030" strokeWidth="1.4" />
      <line x1="99" y1="203" x2="96" y2="201" stroke="#2a2030" strokeWidth="1.2" />
      <line x1="126" y1="203" x2="129" y2="201" stroke="#2a2030" strokeWidth="1.2" />
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
      {/* Background blob */}
      <ellipse cx="160" cy="188" rx="94" ry="78" fill="#c5d8f8" opacity="0.55" />
      {/* Clock on wall */}
      <circle cx="200" cy="80" r="30" fill="#fff" stroke="#c5d8f8" strokeWidth="2" />
      <circle cx="200" cy="80" r="3.5" fill="#5379f4" />
      <line x1="200" y1="80" x2="200" y2="57" stroke="#5379f4" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="200" y1="80" x2="218" y2="90" stroke="#f26f37" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="200" y1="52" x2="200" y2="57" stroke="#c5d8f8" strokeWidth="1.5" />
      <line x1="200" y1="103" x2="200" y2="108" stroke="#c5d8f8" strokeWidth="1.5" />
      <line x1="172" y1="80" x2="177" y2="80" stroke="#c5d8f8" strokeWidth="1.5" />
      <line x1="223" y1="80" x2="228" y2="80" stroke="#c5d8f8" strokeWidth="1.5" />
      {/* Orange speech bubble */}
      <path d="M108 162 Q108 126 158 126 Q208 126 208 162 Q208 198 158 198 L132 214 L144 198 Q108 198 108 162Z" fill="#f26f37" />
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
      {/* Woman in orange dress */}
      <path d="M93 248 Q93 224 120 224 Q147 224 147 248 L150 276 L90 276 Z" fill="#f26f37" />
      <circle cx="120" cy="203" r="20" fill="#f5d0a9" />
      <ellipse cx="120" cy="187" rx="19" ry="9" fill="#2a1a10" />
      <ellipse cx="139" cy="203" rx="7" ry="12" fill="#2a1a10" />
      <circle cx="114" cy="203" r="2.5" fill="#6a4020" />
      <circle cx="126" cy="203" r="2.5" fill="#6a4020" />
      <path d="M115 211 Q120 215 125 211" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M93 248 Q78 256 74 270" stroke="#f26f37" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M147 248 Q165 242 170 232" stroke="#f5d0a9" strokeWidth="8" strokeLinecap="round" fill="none" />
      <rect x="100" y="276" width="12" height="26" rx="4" fill="#c06030" />
      <rect x="117" y="276" width="12" height="26" rx="4" fill="#c06030" />
      <ellipse cx="106" cy="303" rx="11" ry="5" fill="#2a1a10" />
      <ellipse cx="123" cy="303" rx="11" ry="5" fill="#2a1a10" />
    </svg>
  )
}

/* ─── Upload area ────────────────────────────────────────────── */
function UploadArea({ label, sublabel, fileRef, fileName, onChange, onDrop }) {
  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      style={{
        border: '2px dashed #d0dbf0',
        borderRadius: T.radius,
        padding: '1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: '#fff',
      }}
    >
      <input ref={fileRef} type="file" accept=".pdf" hidden onChange={onChange} />
      <div style={{ marginBottom: '0.4rem' }}>
        {fileName
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        }
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: T.dark }}>{fileName || label}</div>
      <div style={{ fontSize: '0.78rem', color: T.grey, marginTop: '0.2rem' }}>{fileName ? 'Click to change file' : sublabel}</div>
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
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        Set up your Trainer profile
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Showcase your expertise and start connecting with companies and professionals looking to grow.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-headline">Professional Headline</label>
        <input
          id="ts-headline"
          style={{ ...inputStyle, borderColor: errors.headline ? '#e53e3e' : '#d0dbf0' }}
          type="text"
          placeholder="Enter Professional Headline e.g., Certified Python Instructor"
          name="headline"
          value={data.headline || ''}
          onChange={(e) => field('headline', e.target.value)}
        />
        {errors.headline && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.headline}</div>}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-expertise">Area of Expertise</label>
        <input
          id="ts-expertise"
          style={{ ...inputStyle, borderColor: errors.expertise ? '#e53e3e' : '#d0dbf0' }}
          type="text"
          placeholder="Enter Your Area of Expertise e.g., Technology, Leadership"
          name="expertise"
          value={data.expertise || ''}
          onChange={(e) => field('expertise', e.target.value)}
        />
        {errors.expertise && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.expertise}</div>}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-years">Years of Experience</label>
        <select
          id="ts-years"
          style={{ ...selectStyle, borderColor: errors.years_exp ? '#e53e3e' : '#d0dbf0' }}
          value={data.years_exp || ''}
          onChange={(e) => field('years_exp', e.target.value)}
        >
          <option value="">Select Years of Experience</option>
          <option value="less_than_1">Less than 1 year</option>
          <option value="1-2">1-2 years</option>
          <option value="2-5">2-5 years</option>
          <option value="5-10">5-10 years</option>
          <option value="10+">10+ years</option>
        </select>
        {errors.years_exp && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.years_exp}</div>}
      </div>

      <button style={btnStyle} onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── Step 2 — How do you teach? ─────────────────────────────── */
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
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        How do you teach?
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Tell us about the types of training services you offer to help us find the right students.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>Service Types</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Search Service Types"
          name="serviceTypes"
          value={data.service_types_input || ''}
          onChange={(e) => onChange('service_types_input', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Languages you teach in</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Search Languages"
          name="languages"
          value={data.languages_input || ''}
          onChange={(e) => onChange('languages_input', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-portfolio">Links to Portfolio</label>
        <input
          id="ts-portfolio"
          style={inputStyle}
          type="text"
          placeholder="Paste Links to Portfolio"
          name="portfolio"
          value={data.portfolio_links || ''}
          onChange={(e) => onChange('portfolio_links', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <UploadArea
          label="Upload Certifications (PDF)"
          sublabel="Drag or Click to Browse"
          fileRef={fileRef}
          fileName={fileName}
          onChange={handleFile}
          onDrop={handleDrop}
        />
      </div>

      <button style={btnStyle} onClick={onNext}>Next Step</button>
      <button style={backStyle} onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Step 3 — Set your schedule ─────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        Set your schedule
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Define your availability and pricing to start receiving training inquiries directly.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-rate">Hourly Rate ($)</label>
        <input
          id="ts-rate"
          style={inputStyle}
          type="text"
          placeholder="Enter amount or range"
          name="hourlyRate"
          value={data.hourly_rate || ''}
          onChange={(e) => onChange('hourly_rate', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-calendar">Connect Calendar</label>
        <div style={{ position: 'relative' }}>
          <input
            id="ts-calendar"
            style={{ ...inputStyle, paddingRight: '2.6rem' }}
            type="text"
            placeholder="(Google/Outlook)"
            name="calendar"
            value={data.calendar_link || ''}
            onChange={(e) => onChange('calendar_link', e.target.value)}
          />
          {/* Calendar icon */}
          <span style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6a7380" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
        </div>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle} htmlFor="ts-timezone">Timezone</label>
        <select
          id="ts-timezone"
          style={selectStyle}
          value={data.timezone || ''}
          onChange={(e) => onChange('timezone', e.target.value)}
        >
          <option value="">Choose Timezone</option>
          <option value="UTC">UTC</option>
          <option value="UTC+8">UTC+8 (Perth)</option>
          <option value="UTC+9:30">UTC+9:30 (Adelaide)</option>
          <option value="UTC+10">UTC+10 (Sydney/Melbourne)</option>
          <option value="UTC+11">UTC+11 (DST)</option>
          <option value="UTC-5">UTC-5 (EST)</option>
          <option value="UTC-8">UTC-8 (PST)</option>
        </select>
      </div>

      <button style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }} onClick={onFinish} disabled={loading}>
        {loading ? 'Saving…' : 'Finish Setup'}
      </button>
      <button style={backStyle} onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Success Modal ──────────────────────────────────────────── */
const CONFETTI = [
  { color: '#5379f4', left: '8%', size: 7, round: true },
  { color: '#f26f37', left: '20%', size: 5, round: false },
  { color: '#22c55e', left: '34%', size: 7, round: true },
  { color: '#e066aa', left: '47%', size: 5, round: false },
  { color: '#f5c842', left: '60%', size: 8, round: true },
  { color: '#5379f4', left: '72%', size: 5, round: false },
  { color: '#f26f37', left: '83%', size: 6, round: true },
  { color: '#22c55e', left: '91%', size: 5, round: false },
]

function SuccessModal({ onDashboard }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
        maxWidth: 480, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        {CONFETTI.map((c, i) => (
          <span key={i} style={{
            position: 'absolute',
            width: c.size, height: c.size,
            borderRadius: c.round ? '50%' : '2px',
            background: c.color,
            left: c.left, top: '6%',
          }} />
        ))}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#f26f37',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.2rem',
        }}>
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path d="M3 14L14 25L33 4" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: T.dark, marginBottom: '0.6rem' }}>
          Your expert profile is live!
        </h2>
        <p style={{ fontSize: '0.85rem', color: T.grey, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          You're all set to start sharing your knowledge. We'll notify you as soon as
          companies or professionals request your services.
        </p>
        <button style={btnStyle} onClick={onDashboard}>Go to Instructor Dashboard</button>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function TrainerSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(() => loadData())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  function onChange(field, val) {
    setData((p) => {
      const next = { ...p, [field]: val }
      saveData(next)
      return next
    })
  }

  async function handleFinish() {
    const token = localStorage.getItem('access_token') || getToken()
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
      setShowModal(true)
    } catch (err) {
      setError(err?.detail || 'Failed to create trainer profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const illus = [<IllusStep1 />, <IllusStep2 />, <IllusStep3 />]

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflow: 'hidden' }}>
      <BgDecorations />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'flex-start', gap: '2rem',
        maxWidth: 1100, width: '100%', margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        {/* Left: StepSidebar */}
        <StepSidebar steps={STEPS} current={step} />

        {/* Center: Card */}
        <div style={{
          flex: '0 0 auto', width: 420,
          background: T.card, borderRadius: 18,
          padding: '2.4rem 2.2rem',
          boxShadow: '0 4px 24px rgba(83,121,244,0.09)',
        }}>
          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#c53030', fontSize: '0.85rem' }} role="alert">
              {error}
            </div>
          )}

          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => setStep(2)} loading={loading} />}
        </div>

        {/* Right: Illustration */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {illus[step - 1]}
        </div>
      </div>

      {showModal && (
        <SuccessModal onDashboard={() => { setShowModal(false); navigate('/dashboard', { replace: true }) }} />
      )}
    </div>
  )
}
