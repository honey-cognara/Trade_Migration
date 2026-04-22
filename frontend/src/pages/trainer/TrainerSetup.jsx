import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FigmaBg } from '../../components/FigmaBg'
import { createTrainingProvider, getToken } from '../../services/api'

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_KEY = 'trainer_setup'
function loadData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
function saveData(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {}
}

/* ─── Step sidebar ───────────────────────────────────────────── */
const STEPS_META = [
  { label: 'Step 1', sub: 'Organisation info' },
  { label: 'Step 2', sub: 'Course offerings' },
  { label: 'Step 3', sub: 'Contact details' },
  { label: 'Step 4', sub: 'Profile live!' },
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

/* ─── Illustrations ──────────────────────────────────────────── */
function IllusStep1() {
  return (
    <svg viewBox="0 0 260 300" width="220" height="280" fill="none">
      <ellipse cx="130" cy="175" rx="90" ry="74" fill="#e8f5e9" opacity="0.75"/>
      <rect x="60" y="100" width="140" height="110" rx="14" fill="#fff" stroke="#c8e6c9" strokeWidth="1.5"/>
      <rect x="80" y="120" width="80" height="9" rx="4.5" fill="#22c55e" opacity="0.7"/>
      <rect x="80" y="136" width="100" height="6" rx="3" fill="#c8e6c9"/>
      <rect x="80" y="149" width="85" height="6" rx="3" fill="#c8e6c9"/>
      <circle cx="172" cy="160" r="16" fill="#22c55e" opacity="0.2"/>
      <path d="M165 160 L170 165 L180 153" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IllusStep2() {
  return (
    <svg viewBox="0 0 260 300" width="220" height="280" fill="none">
      <ellipse cx="130" cy="175" rx="88" ry="72" fill="#e3f2fd" opacity="0.75"/>
      <rect x="55" y="100" width="150" height="115" rx="14" fill="#fff" stroke="#bbdefb" strokeWidth="1.5"/>
      {[120, 142, 164].map((y, i) => (
        <g key={i}>
          <rect x="75" y={y} width={90 - i*10} height="8" rx="4" fill="#bbdefb"/>
          <circle cx="172" cy={y+4} r="10" fill={i === 0 ? '#1976d2' : '#bbdefb'} opacity={i === 0 ? 1 : 0.6}/>
        </g>
      ))}
    </svg>
  )
}
function IllusStep3() {
  return (
    <svg viewBox="0 0 260 300" width="220" height="280" fill="none">
      <ellipse cx="130" cy="175" rx="86" ry="70" fill="#fce4ec" opacity="0.7"/>
      <rect x="60" y="105" width="140" height="105" rx="14" fill="#fff" stroke="#f8bbd0" strokeWidth="1.5"/>
      <circle cx="100" cy="140" r="22" fill="#ec407a" opacity="0.15"/>
      <circle cx="100" cy="140" r="14" fill="#ec407a" opacity="0.3"/>
      <rect x="125" y="128" width="60" height="8" rx="4" fill="#f8bbd0"/>
      <rect x="125" y="143" width="45" height="6" rx="3" fill="#f8bbd0"/>
      <rect x="75" y="168" width="110" height="6" rx="3" fill="#f8bbd0"/>
      <rect x="75" y="181" width="90" height="6" rx="3" fill="#f8bbd0"/>
    </svg>
  )
}
const ILLUS = [<IllusStep1/>, <IllusStep2/>, <IllusStep3/>, null]

/* ─── STEP 1 ─────────────────────────────────────────────────── */
const TRADE_CATEGORIES = ['electrical','plumbing','hvac','civil','mechanical','other']

function Step1({ data, onChange, onNext }) {
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  function validate() {
    const e = {}
    if (!data.name?.trim()) e.name = 'Please enter your organisation name.'
    return e
  }
  function handleNext() {
    setTouched({ name: true })
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }
  const err = f => touched[f] && errors[f]
  return (
    <>
      <h2 className="fd-setup-card-title">About your organisation</h2>
      <p className="fd-setup-card-sub">Set up your training provider profile to connect with skilled overseas tradespeople.</p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-name">Organisation Name *</label>
        <input id="tr-name" className={`fd-input${err('name') ? ' error' : ''}`}
          placeholder="e.g. Australian Skills Academy"
          value={data.name || ''}
          onChange={e => onChange('name', e.target.value)}/>
        {err('name') && <span className="fd-field-error">{errors.name}</span>}
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-country">Country</label>
        <input id="tr-country" className="fd-input"
          placeholder="e.g. Australia"
          value={data.country || 'Australia'}
          onChange={e => onChange('country', e.target.value)}/>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-website">Website URL</label>
        <input id="tr-website" className="fd-input" type="url"
          placeholder="https://yourorganisation.com.au"
          value={data.website_url || ''}
          onChange={e => onChange('website_url', e.target.value)}/>
      </div>

      <button className="fd-btn" onClick={handleNext}>Next Step</button>
    </>
  )
}

/* ─── STEP 2 ─────────────────────────────────────────────────── */
function Step2({ data, onChange, onNext, onBack }) {
  return (
    <>
      <h2 className="fd-setup-card-title">What do you teach?</h2>
      <p className="fd-setup-card-sub">Tell us about the trade categories and delivery modes you offer.</p>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-trade">Primary Trade Category</label>
        <select id="tr-trade" className="fd-input"
          value={data.trade_category || ''}
          onChange={e => onChange('trade_category', e.target.value)}>
          <option value="">Select trade category</option>
          {TRADE_CATEGORIES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-delivery">Delivery Mode</label>
        <select id="tr-delivery" className="fd-input"
          value={data.delivery_mode || ''}
          onChange={e => onChange('delivery_mode', e.target.value)}>
          <option value="">Select delivery mode</option>
          <option value="online">Online</option>
          <option value="in-person">In-person</option>
          <option value="blended">Blended</option>
        </select>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-desc">Course Description (optional)</label>
        <textarea id="tr-desc" className="fd-input" rows={3}
          placeholder="Brief description of your training offerings…"
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
      <h2 className="fd-setup-card-title">Contact details</h2>
      <p className="fd-setup-card-sub">How can candidates and employers reach your organisation?</p>

      {apiError && <div className="fd-alert fd-alert-error">{apiError}</div>}

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-email">Contact Email</label>
        <input id="tr-email" className="fd-input" type="email"
          placeholder="info@yourorganisation.com.au"
          value={data.contact_email || ''}
          onChange={e => onChange('contact_email', e.target.value)}/>
      </div>

      <div className="fd-group">
        <label className="fd-label" htmlFor="tr-location">Location</label>
        <input id="tr-location" className="fd-input"
          placeholder="e.g. Sydney, NSW"
          value={data.location || ''}
          onChange={e => onChange('location', e.target.value)}/>
      </div>

      <button className="fd-btn" onClick={onFinish} disabled={loading}>
        {loading ? <><span className="spinner" aria-hidden="true"/> Saving…</> : 'Finish Setup'}
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
        width: 72, height: 72, borderRadius: '50%', background: '#22c55e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem',
      }}>
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path d="M2 12L12 22L30 2" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#343434', marginBottom: '0.6rem' }}>
        Your provider profile is live!
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6a7380', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        You're all set to start sharing your training courses. Candidates will be able to discover and enrol in your programs.
      </p>
      <button className="fd-btn" onClick={onDashboard}>Go to Dashboard</button>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export function TrainerSetup() {
  const { step: stepParam } = useParams()
  const navigate            = useNavigate()

  // KEY FIX: step is internal state — no remount between steps
  const [step, setStep]       = useState(() => Math.min(Math.max(parseInt(stepParam) || 1, 1), 4))
  const [data, setData]       = useState(() => loadData())
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Sync URL without adding history entries
  useEffect(() => {
    const base = window.location.pathname.includes('/setup/provider/') ? '/setup/provider' : '/setup/trainer'
    window.history.replaceState(null, '', `${base}/${step}`)
  }, [step])

  useEffect(() => { saveData(data) }, [data])

  function onChange(field, val) { setData(p => ({ ...p, [field]: val })) }
  function goTo(n) { setError(''); setStep(n) }

  async function handleFinish() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true)
    setError('')
    // FIX: calls /training/provider (correct backend URL)
    try {
      await createTrainingProvider({
        name:          data.name          || 'Training Provider',
        contact_email: data.contact_email || '',
        website_url:   data.website_url   || null,
        country:       data.country       || 'Australia',
      }, token)
      localStorage.removeItem(LS_KEY)
      setStep(4)
    } catch (err) {
      setError(err?.detail || 'Failed to create provider profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fd-setup-page">
      <FigmaBg />
      <div className="fd-setup-inner" style={{ alignItems: 'center' }}>
        <StepSidebar current={step} />

        <div className="fd-setup-card">
          {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
          {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
          {step === 3 && (
            <Step3 data={data} onChange={onChange} onFinish={handleFinish}
              onBack={() => goTo(2)} loading={loading} apiError={error}/>
          )}
          {step === 4 && (
            <Step4 onDashboard={() => { localStorage.removeItem(LS_KEY); navigate('/dashboard') }}/>
          )}
        </div>

        {step < 4 && (
          <div className="fd-setup-illus">{ILLUS[step - 1]}</div>
        )}
      </div>
    </div>
  )
}