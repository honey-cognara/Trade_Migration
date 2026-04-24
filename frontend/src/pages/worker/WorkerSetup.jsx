import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCandidateProfile, updateCandidateProfile, getToken } from '../../services/api'

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_KEY = 'worker_setup'
function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
function saveData(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {}
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
  { label: 'Step 1', sub: 'Personal Identity' },
  { label: 'Step 2', sub: 'Experience & Skills' },
  { label: 'Step 3', sub: 'Career Preferences' },
]

/* ─── Background Decorations ─────────────────────────────────── */
function BgDecorations() {
  return (
    <>
      {/* Top-left orange circles */}
      <div style={{ position: 'absolute', left: '4%', top: '7%', width: 20, height: 20, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '2.5%', top: '13%', width: 13, height: 13, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '5%', top: '19%', width: 8, height: 8, borderRadius: '50%', border: '2px solid #f26f37', zIndex: 0 }} />

      {/* Top-right blobs */}
      <div style={{ position: 'absolute', top: -60, right: -80, width: 300, height: 240, borderRadius: '50%', background: '#c8f07a', opacity: 0.7, zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 20, right: 60, width: 220, height: 180, borderRadius: '50%', background: '#9dd4f0', opacity: 0.6, zIndex: 0 }} />

      {/* Bottom-left blob */}
      <div style={{ position: 'absolute', bottom: -60, left: -80, width: 280, height: 240, borderRadius: '50%', background: '#8ed8c0', opacity: 0.65, zIndex: 0 }} />

      {/* Bottom-right orange circles */}
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
              {/* Circle */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: active ? T.purple : 'transparent',
                border: active ? `2px solid ${T.purple}` : '2px solid #ccc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
              </div>
              {/* Labels */}
              <div>
                <div style={{
                  fontWeight: 700, fontSize: '0.88rem',
                  color: active ? T.purple : '#bbb',
                }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: active ? T.grey : '#ccc' }}>
                  {s.sub}
                </div>
              </div>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{ width: 2, height: 28, background: '#e0e0e0', marginLeft: 10 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Shared input style ─────────────────────────────────────── */
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
const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: T.dark,
  marginBottom: '0.35rem',
}
const groupStyle = { marginBottom: '1rem' }
const btnStyle = {
  width: '100%',
  background: T.blue,
  color: '#fff',
  border: 'none',
  borderRadius: T.radius,
  padding: '0.85rem',
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '0.5rem',
}
const backStyle = {
  display: 'block',
  textAlign: 'center',
  marginTop: '0.75rem',
  color: T.blue,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  width: '100%',
}

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Horizontal orange stripes */}
      <rect x="150" y="80" width="95" height="9" rx="4.5" fill="#f26f37" opacity="0.85" />
      <rect x="158" y="97" width="82" height="9" rx="4.5" fill="#f26f37" opacity="0.65" />
      <rect x="144" y="114" width="100" height="9" rx="4.5" fill="#f26f37" opacity="0.45" />
      <rect x="152" y="131" width="88" height="9" rx="4.5" fill="#f26f37" opacity="0.28" />
      {/* Green circle accent */}
      <circle cx="218" cy="160" r="18" fill="#8ed8c0" opacity="0.7" />
      {/* Desk */}
      <rect x="40" y="218" width="190" height="10" rx="5" fill="#d4e8f5" />
      <rect x="52" y="228" width="8" height="48" rx="3" fill="#b8d4e8" />
      <rect x="210" y="228" width="8" height="48" rx="3" fill="#b8d4e8" />
      {/* Laptop */}
      <rect x="62" y="185" width="100" height="64" rx="6" fill="#e6f1ff" stroke="#b0c8e8" strokeWidth="1.5" />
      <rect x="68" y="191" width="88" height="52" rx="3" fill="#fff" />
      <rect x="55" y="249" width="114" height="8" rx="4" fill="#d0dff0" />
      <rect x="76" y="200" width="52" height="6" rx="3" fill="#5379f4" opacity="0.6" />
      <rect x="76" y="212" width="38" height="5" rx="2.5" fill="#c1c1c8" />
      <rect x="76" y="223" width="44" height="5" rx="2.5" fill="#c1c1c8" />
      <rect x="76" y="234" width="30" height="5" rx="2.5" fill="#5379f4" opacity="0.35" />
      {/* Legs */}
      <rect x="168" y="248" width="12" height="36" rx="5" fill="#1a1a2e" />
      <rect x="186" y="248" width="12" height="36" rx="5" fill="#1a1a2e" />
      <ellipse cx="174" cy="285" rx="11" ry="5.5" fill="#111" />
      <ellipse cx="192" cy="285" rx="11" ry="5.5" fill="#111" />
      {/* Body dark jacket */}
      <path d="M152 222 Q152 200 182 200 Q212 200 212 222 L215 250 L149 250 Z" fill="#1a1a2e" />
      {/* Orange stripe */}
      <rect x="175" y="200" width="9" height="50" rx="3" fill="#f26f37" opacity="0.9" />
      {/* Head */}
      <circle cx="182" cy="178" r="22" fill="#f5c5a3" />
      {/* Hair */}
      <ellipse cx="182" cy="160" rx="21" ry="11" fill="#1a1010" />
      <ellipse cx="160" cy="177" rx="8" ry="16" fill="#1a1010" />
      <path d="M200 162 Q214 155 216 170 Q218 182 208 180" stroke="#1a1010" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Face */}
      <circle cx="176" cy="178" r="2.5" fill="#6a4020" />
      <circle cx="188" cy="178" r="2.5" fill="#6a4020" />
      <path d="M177 187 Q182 191 187 187" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
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
      <circle cx="142" cy="185" r="105" fill="#e6f1ff" opacity="0.7" />
      {/* Book stack */}
      <rect x="66" y="230" width="140" height="18" rx="5" fill="#5379f4" />
      <rect x="72" y="212" width="126" height="18" rx="5" fill="#7a9af4" />
      <rect x="78" y="194" width="112" height="18" rx="5" fill="#a0b8f8" />
      {/* Progress bars */}
      <rect x="78" y="130" width="110" height="9" rx="4.5" fill="#e0e8ff" />
      <rect x="78" y="130" width="82" height="9" rx="4.5" fill="#5379f4" />
      <rect x="78" y="146" width="110" height="9" rx="4.5" fill="#e0e8ff" />
      <rect x="78" y="146" width="56" height="9" rx="4.5" fill="#5379f4" opacity="0.7" />
      <rect x="78" y="162" width="110" height="9" rx="4.5" fill="#e0e8ff" />
      <rect x="78" y="162" width="96" height="9" rx="4.5" fill="#5379f4" opacity="0.85" />
      {/* Scattered dots */}
      <circle cx="56" cy="145" r="5" fill="#f26f37" opacity="0.6" />
      <circle cx="218" cy="168" r="4" fill="#f26f37" opacity="0.5" />
      <circle cx="230" cy="130" r="3" fill="#5b4fce" opacity="0.5" />
      {/* Person legs */}
      <rect x="115" y="270" width="14" height="36" rx="5" fill="#2d2d4a" />
      <rect x="136" y="270" width="14" height="36" rx="5" fill="#2d2d4a" />
      <ellipse cx="122" cy="307" rx="12" ry="5.5" fill="#1a1a30" />
      <ellipse cx="143" cy="307" rx="12" ry="5.5" fill="#1a1a30" />
      {/* Grey jacket/scarf body */}
      <path d="M96 250 Q96 225 132 225 Q168 225 168 250 L172 272 L92 272 Z" fill="#8898aa" />
      {/* Scarf */}
      <rect x="120" y="225" width="24" height="14" rx="4" fill="#5379f4" opacity="0.7" />
      {/* Head */}
      <circle cx="132" cy="202" r="23" fill="#d4a07a" />
      {/* Hair */}
      <ellipse cx="132" cy="183" rx="22" ry="11" fill="#3a2818" />
      <ellipse cx="110" cy="200" rx="6.5" ry="13" fill="#3a2818" />
      {/* Face */}
      <circle cx="126" cy="202" r="2.5" fill="#7a4820" />
      <circle cx="138" cy="202" r="2.5" fill="#7a4820" />
      <path d="M127 210 Q132 214 137 210" stroke="#b07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d="M96 250 Q80 262 82 278" stroke="#8898aa" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="82" cy="282" r="9" fill="#d4a07a" />
      <path d="M168 250 Q184 262 182 278" stroke="#8898aa" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="182" cy="282" r="9" fill="#d4a07a" />
    </svg>
  )
}

function IllusStep3() {
  return (
    <svg viewBox="0 0 260 320" width="240" height="300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="148" cy="190" rx="96" ry="80" fill="#e6f1ff" opacity="0.75" />
      {/* Floating checklist cards */}
      <rect x="55" y="75" width="155" height="110" rx="10" fill="#fff" stroke="#d0dff0" strokeWidth="1.5" />
      <rect x="71" y="96" width="90" height="7" rx="3.5" fill="#d0dff0" />
      <circle cx="202" cy="99" r="13" fill="#f26f37" />
      <path d="M197 99 L201 103 L208 94" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="71" y="117" width="72" height="7" rx="3.5" fill="#d0dff0" />
      <circle cx="202" cy="120" r="13" fill="#5379f4" />
      <path d="M197 120 L201 124 L208 115" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="71" y="138" width="82" height="7" rx="3.5" fill="#d0dff0" />
      <circle cx="202" cy="141" r="13" fill="#f26f37" />
      <path d="M197 141 L201 145 L208 136" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Second floating card behind */}
      <rect x="65" y="195" width="140" height="68" rx="10" fill="#f0f6ff" stroke="#d0dff0" strokeWidth="1.5" />
      <rect x="78" y="210" width="60" height="6" rx="3" fill="#d0dff0" />
      <rect x="78" y="223" width="80" height="6" rx="3" fill="#d0dff0" />
      <rect x="78" y="236" width="50" height="6" rx="3" fill="#f26f37" opacity="0.5" />
      {/* Person grey sweater */}
      <rect x="118" y="280" width="13" height="30" rx="5" fill="#c0cce8" />
      <rect x="136" y="280" width="13" height="30" rx="5" fill="#c0cce8" />
      <ellipse cx="125" cy="311" rx="11" ry="5" fill="#9ab0d0" />
      <ellipse cx="143" cy="311" rx="11" ry="5" fill="#9ab0d0" />
      <path d="M100 262 Q100 240 136 240 Q172 240 172 262 L174 282 L98 282 Z" fill="#d0d8e8" />
      <rect x="128" y="240" width="16" height="6" rx="2" fill="#5379f4" opacity="0.5" />
      {/* Head */}
      <circle cx="136" cy="218" r="22" fill="#f5c5a3" />
      <ellipse cx="136" cy="200" rx="20" ry="10" fill="#6d4c41" />
      <ellipse cx="156" cy="217" rx="7" ry="12" fill="#6d4c41" />
      {/* Face */}
      <circle cx="130" cy="218" r="2.5" fill="#7a4820" />
      <circle cx="142" cy="218" r="2.5" fill="#7a4820" />
      <path d="M131 226 Q136 230 141 226" stroke="#c07040" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d="M172 262 Q190 254 195 242" stroke="#d0d8e8" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="196" cy="238" r="8.5" fill="#f5c5a3" />
      <path d="M100 262 Q84 270 82 282" stroke="#d0d8e8" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="82" cy="286" r="8.5" fill="#f5c5a3" />
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
      style={{
        border: `2px dashed #d0dbf0`,
        borderRadius: T.radius,
        padding: '1.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: '#fff',
      }}
    >
      <input ref={fileRef} type="file" accept=".pdf" hidden onChange={onChange} />
      {/* Upload icon */}
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

/* ─── STEP 1 ─────────────────────────────────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.full_name?.trim()) e.full_name = 'Please enter your full name.'
    if (!data.professional_title?.trim()) e.professional_title = 'Please enter your professional title.'
    if (!data.years_experience && data.years_experience !== 0) e.years_experience = 'Please select years of experience.'
    return e
  }

  function handleNext() {
    setTouched({ full_name: true, professional_title: true, years_experience: true })
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  const err = (f) => touched[f] && errors[f]

  return (
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        Tell us about yourself
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Create your professional profile to start matching with world-class companies and trainers.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>Full Name</label>
        <input
          style={{ ...inputStyle, borderColor: err('full_name') ? '#e53e3e' : '#d0dbf0' }}
          type="text"
          placeholder="Enter Your Full Name"
          value={data.full_name || ''}
          onChange={(e) => { onChange('full_name', e.target.value); setErrors((p) => ({ ...p, full_name: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, full_name: true }))}
        />
        {err('full_name') && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.full_name}</div>}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Professional Title</label>
        <input
          style={{ ...inputStyle, borderColor: err('professional_title') ? '#e53e3e' : '#d0dbf0' }}
          type="text"
          placeholder="Enter Your Professional Title"
          value={data.professional_title || ''}
          onChange={(e) => { onChange('professional_title', e.target.value); setErrors((p) => ({ ...p, professional_title: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, professional_title: true }))}
        />
        {err('professional_title') && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.professional_title}</div>}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Years of Experience</label>
        <select
          style={{ ...inputStyle, borderColor: err('years_experience') ? '#e53e3e' : '#d0dbf0', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a7380' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.9rem center' }}
          value={data.years_experience ?? ''}
          onChange={(e) => { onChange('years_experience', e.target.value === '' ? null : e.target.value); setErrors((p) => ({ ...p, years_experience: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, years_experience: true }))}
        >
          <option value="">Select Years of Experience</option>
          <option value="less_than_1">Less than 1 year</option>
          <option value="1-2">1-2 years</option>
          <option value="2-5">2-5 years</option>
          <option value="5-10">5-10 years</option>
          <option value="10+">10+ years</option>
        </select>
        {err('years_experience') && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.years_experience}</div>}
      </div>

      <button style={btnStyle} onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── STEP 2 ─────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  const fileRef = useRef(null)
  const [fileName, setFile] = useState('')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (f) { setFile(f.name); onChange('resume_file', f) }
  }

  return (
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        What are your core strengths?
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Add your skills so we can show you the most relevant job opportunities and training paths.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>Skills you have</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Search skill"
          name="skillsHave"
          value={data.skills_have_input || ''}
          onChange={(e) => onChange('skills_have_input', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Skills you want to learn</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Search skill"
          name="skillsLearn"
          value={data.skills_learn_input || ''}
          onChange={(e) => onChange('skills_learn_input', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <UploadArea
          label="Upload Resume (PDF)"
          sublabel="Drag or Click to Browse"
          fileRef={fileRef}
          fileName={fileName}
          onChange={handleFile}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) { setFile(f.name); onChange('resume_file', f) }
          }}
        />
      </div>

      <button style={btnStyle} onClick={onNext}>Next Step</button>
      <button style={backStyle} onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── STEP 3 ─────────────────────────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        What are you looking for?
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Define your ideal role so we can find the perfect match for your next career move.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>Preferred Role Type</label>
        <select
          style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a7380' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.9rem center' }}
          value={data.preferred_role_type || ''}
          onChange={(e) => onChange('preferred_role_type', e.target.value)}
        >
          <option value="">Choose role type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="casual">Casual</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Expected Salary/Rate</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Enter amount or range"
          name="salary"
          value={data.expected_salary || ''}
          onChange={(e) => onChange('expected_salary', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Availability</label>
        <select
          style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a7380' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.9rem center' }}
          value={data.availability || ''}
          onChange={(e) => onChange('availability', e.target.value)}
        >
          <option value="">Choose availability</option>
          <option value="immediately">Immediately</option>
          <option value="2_weeks">2 weeks notice</option>
          <option value="1_month">1 month notice</option>
          <option value="3_months_plus">3+ months</option>
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
  { color: '#f26f37', left: '14%', delay: '0s', size: 7, round: true },
  { color: '#5379f4', left: '28%', delay: '0.15s', size: 5, round: false },
  { color: '#f26f37', left: '52%', delay: '0.08s', size: 8, round: true },
  { color: '#403c8b', left: '68%', delay: '0.28s', size: 6, round: false },
  { color: '#f26f37', left: '80%', delay: '0.04s', size: 5, round: true },
  { color: '#5379f4', left: '40%', delay: '0.22s', size: 7, round: false },
  { color: '#22c55e', left: '10%', delay: '0.38s', size: 5, round: true },
  { color: '#403c8b', left: '86%', delay: '0.12s', size: 6, round: false },
  { color: '#b4eb50', left: '58%', delay: '0.32s', size: 8, round: true },
  { color: '#f26f37', left: '24%', delay: '0.44s', size: 5, round: false },
]

function SuccessModal({ onExplore }) {
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
        {/* Confetti */}
        {CONFETTI.map((c, i) => (
          <span key={i} style={{
            position: 'absolute',
            width: c.size, height: c.size,
            borderRadius: c.round ? '50%' : '2px',
            background: c.color,
            left: c.left, top: '6%',
          }} />
        ))}
        {/* Orange circle with checkmark */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#f26f37',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.2rem',
        }}>
          <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
            <path d="M3 14L14 25L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: T.dark, marginBottom: '0.6rem' }}>
          Your profile is ready for growth!
        </h2>
        <p style={{ fontSize: '0.85rem', color: T.grey, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          You're now visible to world-class companies. Start exploring curated job
          opportunities and training paths tailored to your goals.
        </p>
        <button style={btnStyle} onClick={onExplore}>Explore Opportunities</button>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function WorkerSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(() => ({ skills_have: [], skills_want: [], ...loadData() }))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showModal, setShowModal] = useState(false)

  function onChange(field, val) {
    setData((prev) => {
      const next = { ...prev, [field]: val }
      saveData(next)
      return next
    })
  }

  async function handleFinish() {
    const token = localStorage.getItem('access_token') || getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setApiError('')
    const payload = {
      full_name: data.full_name || '',
      trade_category: data.trade_category || 'other',
      years_experience: parseInt(data.years_experience) || 0,
      nationality: data.nationality || '',
      country_of_residence: data.country_of_residence || '',
      is_electrical_worker: false,
      languages: [{ name: 'English', level: 'Unknown' }],
      work_types: [],
      published: false,
    }
    try {
      try { await createCandidateProfile(payload, token) }
      catch (e) {
        if (e.status === 400 || e.status === 409) await updateCandidateProfile(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      setShowModal(true)
    } catch (err) {
      setApiError(err?.detail || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const illus = [<IllusStep1/>, <IllusStep2/>, <IllusStep3/>]

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
          {apiError && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#c53030', fontSize: '0.85rem' }}>
              {apiError}
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
        <SuccessModal onExplore={() => { setShowModal(false); navigate('/dashboard', { replace: true }) }} />
      )}
    </div>
  )
}
