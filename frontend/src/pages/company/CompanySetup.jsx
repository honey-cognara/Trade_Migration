import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCompany, updateCompany, getToken } from '../../services/api'

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_KEY = 'company_setup'
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
  { label: 'Step 1', sub: 'Business Identity' },
  { label: 'Step 2', sub: 'How big is your team?' },
  { label: 'Step 3', sub: 'Hiring Priorities' },
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
    <svg viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg" width="260" height="320">
      {/* Teal mountain shapes */}
      <polygon points="148,248 192,188 236,248" fill="#5bc8c0" opacity="0.72" />
      <polygon points="168,248 206,196 244,248" fill="#7dd8d0" opacity="0.52" />
      <polygon points="128,248 166,204 204,248" fill="#9ae8e0" opacity="0.40" />
      {/* Ground */}
      <ellipse cx="188" cy="314" rx="88" ry="32" fill="#dff0e8" />
      <ellipse cx="183" cy="308" rx="42" ry="11" fill="#b8d8c8" opacity="0.55" />
      {/* Legs */}
      <rect x="164" y="258" width="17" height="54" rx="8" fill="#1a1a2e" />
      <rect x="188" y="258" width="17" height="54" rx="8" fill="#1a1a2e" />
      <ellipse cx="172" cy="314" rx="13" ry="5" fill="#0d0d1a" />
      <ellipse cx="196" cy="314" rx="13" ry="5" fill="#0d0d1a" />
      {/* Dark suit body */}
      <rect x="149" y="178" width="70" height="84" rx="12" fill="#1a1a2e" />
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
      <path d="M230 213 Q242 200 254 213" stroke="#c85818" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="242" cy="221" r="3" fill="#c85818" />
      {/* Neck */}
      <rect x="177" y="156" width="13" height="24" rx="6" fill="#b07840" />
      {/* Head */}
      <circle cx="183" cy="140" r="30" fill="#b07840" />
      {/* Hair ponytail */}
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
    <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" width="270" height="310">
      <ellipse cx="180" cy="318" rx="108" ry="38" fill="#dff0d0" />
      <polygon points="200,162 226,126 252,162" fill="#5bc8c0" opacity="0.6" />
      <polygon points="216,162 237,132 258,162" fill="#7dd8d0" opacity="0.4" />
      {/* Shadows */}
      <ellipse cx="130" cy="310" rx="37" ry="10" fill="#c8dcc8" opacity="0.5" />
      <ellipse cx="212" cy="312" rx="37" ry="10" fill="#c8dcc8" opacity="0.5" />
      {/* Woman (left, white top) */}
      <rect x="111" y="254" width="16" height="57" rx="7" fill="#1a1a2e" />
      <rect x="132" y="254" width="16" height="57" rx="7" fill="#1a1a2e" />
      <ellipse cx="119" cy="313" rx="11" ry="5" fill="#0d0d1a" />
      <ellipse cx="140" cy="313" rx="11" ry="5" fill="#0d0d1a" />
      <rect x="105" y="180" width="52" height="78" rx="10" fill="#f0f0f0" />
      <rect x="125" y="180" width="12" height="18" rx="4" fill="#e0e0e0" />
      <rect x="89" y="184" width="18" height="44" rx="8" fill="#f0f0f0" />
      <rect x="155" y="184" width="18" height="44" rx="8" fill="#f0f0f0" />
      <circle cx="98" cy="229" r="10" fill="#d4956a" />
      <circle cx="164" cy="229" r="10" fill="#d4956a" />
      {/* Orange folder */}
      <rect x="156" y="212" width="28" height="36" rx="5" fill="#e87b3a" />
      <rect x="156" y="212" width="28" height="8" rx="5" fill="#c85a1a" />
      <rect x="125" y="160" width="12" height="22" rx="6" fill="#d4956a" />
      <circle cx="131" cy="145" r="27" fill="#d4956a" />
      {/* Bob hair */}
      <ellipse cx="131" cy="122" rx="27" ry="14" fill="#1a1a1a" />
      <ellipse cx="105" cy="138" rx="6" ry="14" fill="#1a1a1a" />
      <ellipse cx="157" cy="138" rx="6" ry="14" fill="#1a1a1a" />
      <circle cx="124" cy="145" r="2.5" fill="#8a5030" />
      <circle cx="138" cy="145" r="2.5" fill="#8a5030" />
      <path d="M126 155 Q131 159 136 155" stroke="#8a5030" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Man (right, dark vest) */}
      <rect x="193" y="257" width="17" height="55" rx="7" fill="#2d2d2d" />
      <rect x="216" y="257" width="17" height="55" rx="7" fill="#2d2d2d" />
      <ellipse cx="201" cy="314" rx="12" ry="5" fill="#0d0d1a" />
      <ellipse cx="225" cy="314" rx="12" ry="5" fill="#0d0d1a" />
      <rect x="186" y="182" width="56" height="80" rx="10" fill="#3a3a5a" />
      <rect x="206" y="182" width="14" height="20" rx="4" fill="#e8e8e8" />
      <rect x="169" y="186" width="19" height="47" rx="8" fill="#3a3a5a" />
      <rect x="240" y="186" width="19" height="47" rx="8" fill="#3a3a5a" />
      <circle cx="178" cy="234" r="10" fill="#7a5030" />
      <circle cx="250" cy="234" r="10" fill="#7a5030" />
      {/* Clipboard */}
      <rect x="237" y="200" width="34" height="44" rx="5" fill="#f0f0f0" />
      <rect x="237" y="200" width="34" height="8" rx="5" fill="#c0c0c0" />
      <rect x="242" y="214" width="24" height="3" rx="1.5" fill="#e87b3a" />
      <rect x="242" y="222" width="24" height="3" rx="1.5" fill="#e87b3a" />
      <rect x="242" y="230" width="16" height="3" rx="1.5" fill="#c0c0c0" />
      <rect x="206" y="162" width="14" height="22" rx="7" fill="#7a5030" />
      <circle cx="213" cy="147" r="28" fill="#7a5030" />
      <ellipse cx="213" cy="124" rx="28" ry="15" fill="#1a1a1a" />
      <ellipse cx="186" cy="142" rx="5" ry="13" fill="#1a1a1a" />
      <ellipse cx="240" cy="142" rx="5" ry="13" fill="#1a1a1a" />
      <circle cx="206" cy="147" r="2.5" fill="#4a2a10" />
      <circle cx="220" cy="147" r="2.5" fill="#4a2a10" />
      <path d="M208 157 Q213 161 218 157" stroke="#4a2a10" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function IllusStep3() {
  return (
    <svg viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg" width="270" height="295">
      {/* Back card */}
      <rect x="100" y="58" width="166" height="106" rx="12" fill="#f0faf0" stroke="#d0e8d0" strokeWidth="1.5" />
      <circle cx="127" cy="94" r="20" fill="#e8f4e8" stroke="#d0e8d0" strokeWidth="1.5" />
      <circle cx="127" cy="86" r="9" fill="#d4a070" />
      <ellipse cx="127" cy="105" rx="12" ry="8" fill="#3a3a5a" />
      <rect x="158" y="78" width="88" height="8" rx="4" fill="#c8dcc8" />
      <rect x="158" y="94" width="70" height="6" rx="3" fill="#e0e0e0" />
      <rect x="158" y="108" width="80" height="6" rx="3" fill="#e87b3a" opacity="0.7" />
      {/* Middle card */}
      <rect x="87" y="109" width="166" height="106" rx="12" fill="#f4fcf4" stroke="#c8dcc8" strokeWidth="1.5" />
      <circle cx="115" cy="146" r="22" fill="#e0f0e0" stroke="#c8dcc8" strokeWidth="1.5" />
      <circle cx="115" cy="137" r="10" fill="#c87050" />
      <ellipse cx="115" cy="157" rx="13" ry="9" fill="#2d2d4e" />
      <rect x="148" y="130" width="82" height="8" rx="4" fill="#b8d0b8" />
      <rect x="148" y="146" width="65" height="6" rx="3" fill="#e0e0e0" />
      <rect x="148" y="160" width="75" height="6" rx="3" fill="#e87b3a" opacity="0.6" />
      {/* Front card */}
      <rect x="72" y="160" width="168" height="108" rx="12" fill="#fff" stroke="#b0cca0" strokeWidth="2" />
      <circle cx="100" cy="200" r="24" fill="#d8ecd8" stroke="#b0cca0" strokeWidth="1.5" />
      <circle cx="100" cy="191" r="11" fill="#e87b3a" />
      <ellipse cx="100" cy="213" rx="14" ry="9" fill="#1a1a2e" />
      <rect x="136" y="183" width="88" height="9" rx="4.5" fill="#9ab89a" />
      <rect x="136" y="200" width="68" height="7" rx="3.5" fill="#e0e0e0" />
      <rect x="136" y="215" width="80" height="7" rx="3.5" fill="#e87b3a" opacity="0.5" />
      <rect x="136" y="229" width="55" height="5" rx="2.5" fill="#d0d0d0" />
      {/* Orange checkmark badge */}
      <circle cx="248" cy="268" r="38" fill="#e87b3a" />
      <path d="M233 268 L244 279 L263 258" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Step 1 ─────────────────────────────────────────────────── */
function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.company_name?.trim()) e.company_name = 'Legal business name is required.'
    if (!data.industry?.trim()) e.industry = 'Industry is required.'
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
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        Tell us about your company.
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Let's set up your business profile to help you find the right talent and expert trainers.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>Legal Business Name</label>
        <input
          style={{ ...inputStyle, borderColor: err('company_name') ? '#e53e3e' : '#d0dbf0' }}
          type="text"
          placeholder="Enter Legal Business Name"
          name="companyName"
          value={data.company_name || ''}
          onChange={(e) => { onChange('company_name', e.target.value); setErrors((p) => ({ ...p, company_name: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, company_name: true }))}
        />
        {err('company_name') && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.company_name}</div>}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>ABN (Australian Business Number)</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: '2.4rem' }}
            type="text"
            placeholder="Enter 11-digit ABN"
            name="abn"
            value={data.abn || ''}
            onChange={(e) => onChange('abn', e.target.value)}
          />
          <span style={{
            position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
            color: '#6a7380', fontSize: '0.85rem', pointerEvents: 'none',
          }}>○</span>
        </div>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Industry</label>
        <input
          style={{ ...inputStyle, borderColor: err('industry') ? '#e53e3e' : '#d0dbf0' }}
          type="text"
          placeholder="Enter Industry"
          name="industry"
          value={data.industry || ''}
          onChange={(e) => { onChange('industry', e.target.value); setErrors((p) => ({ ...p, industry: '' })) }}
          onBlur={() => setTouched((p) => ({ ...p, industry: true }))}
        />
        {err('industry') && <div style={{ color: '#e53e3e', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.industry}</div>}
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Company Website</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Enter Company Website"
          name="website"
          value={data.website_url || ''}
          onChange={(e) => onChange('website_url', e.target.value)}
        />
      </div>

      <button style={btnStyle} onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  return (
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        How big is your team?
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        This helps us understand your company's scale and matching needs.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>Employee count</label>
        <select
          style={selectStyle}
          value={data.employee_count || ''}
          onChange={(e) => onChange('employee_count', e.target.value)}
        >
          <option value="">Choose Employee count</option>
          <option value="1-10">1-10</option>
          <option value="11-50">11-50</option>
          <option value="51-200">51-200</option>
          <option value="200-500">200-500</option>
          <option value="500+">500+</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Business description</label>
        <textarea
          style={{ ...inputStyle, height: 'auto', resize: 'none' }}
          placeholder="Tell us a bit about what your company does..."
          rows={4}
          name="description"
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      <button style={btnStyle} onClick={onNext}>Next Step</button>
      <button style={backStyle} onClick={onBack}>Go Back</button>
    </>
  )
}

/* ─── Step 3 ─────────────────────────────────────────────────── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: T.dark, marginBottom: '0.5rem', marginTop: 0 }}>
        What skills are you currently looking for?
      </h2>
      <p style={{ fontSize: '0.88rem', color: T.grey, marginBottom: '1.4rem', lineHeight: 1.55 }}>
        Select the skills and expertise levels you are currently looking to hire or train.
      </p>

      <div style={groupStyle}>
        <label style={labelStyle}>What skills are you currently looking for?</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Search skill tags"
          name="skills"
          value={data.skills_input || ''}
          onChange={(e) => onChange('skills_input', e.target.value)}
        />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>What level of expertise do you need?</label>
        <select
          style={selectStyle}
          value={data.expertise_level || ''}
          onChange={(e) => onChange('expertise_level', e.target.value)}
        >
          <option value="">Choose Expertise level</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="executive">Executive</option>
        </select>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>What is the nature of the work?</label>
        <select
          style={selectStyle}
          value={data.work_nature || ''}
          onChange={(e) => onChange('work_nature', e.target.value)}
        >
          <option value="">Choose nature of work</option>
          <option value="on_site">On-site</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="flexible">Flexible</option>
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
  { color: '#f5c518', left: '48%', size: 5, round: false },
  { color: '#5379f4', left: '62%', size: 8, round: true },
  { color: '#f26f37', left: '74%', size: 5, round: false },
  { color: '#22c55e', left: '84%', size: 6, round: true },
  { color: '#f26f37', left: '91%', size: 5, round: false },
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
            <path d="M3 14L14 25L33 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: T.dark, marginBottom: '0.6rem' }}>
          Your company profile is ready!
        </h2>
        <p style={{ fontSize: '0.85rem', color: T.grey, lineHeight: 1.6, marginBottom: '1.5rem' }}>
          You're all set. Now you can start exploring top-tier talent and professional
          trainers tailored to your needs.
        </p>
        <button style={btnStyle} onClick={onDashboard}>Go to Dashboard</button>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function CompanySetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(() => ({ skills_needed: [], ...loadData() }))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
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
    setApiError('')
    const payload = {
      company_name: data.company_name || '',
      industry: data.industry || '',
      contact_name: data.company_name || '',
      contact_email: '',
      website_url: data.website_url || null,
      abn_or_identifier: data.abn || '',
    }
    try {
      try {
        await createCompany(payload, token)
      } catch (e) {
        if (e.status === 400 || e.status === 409) await updateCompany(payload, token)
        else throw e
      }
      localStorage.removeItem(LS_KEY)
      setShowModal(true)
    } catch (err) {
      setApiError(err?.detail || 'Failed to save company profile. Please try again.')
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
        <SuccessModal onDashboard={() => { setShowModal(false); navigate('/dashboard', { replace: true }) }} />
      )}
    </div>
  )
}
