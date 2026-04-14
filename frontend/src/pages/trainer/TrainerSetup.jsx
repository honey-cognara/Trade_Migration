import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { StepProgress } from '../../components/StepProgress'
import { createTrainingProvider, getToken } from '../../services/api'

const STEPS = ['Expert Identity', 'Training Services', 'Rates & Availability', 'Done']

const EXPERTISE_AREAS = [
  'Electrical Safety', 'High Voltage', 'Solar/Renewable', 'PLC & Automation',
  'Fault Finding', 'SCADA Systems', 'Work Health & Safety', 'Trade Licensing',
  'English for Trades', 'Civil Construction', 'Fire Safety', 'First Aid'
]
const SERVICE_TYPES = ['Online Courses', 'In-Person Training', 'Workshops', 'Mentoring', 'Assessment Only', 'RPL (Recognition of Prior Learning)']
const LANGUAGES_OPTIONS = ['English', 'Urdu', 'Hindi', 'Arabic', 'Tagalog', 'Mandarin', 'Vietnamese', 'Punjabi']
const TIMEZONES = ['AEST (UTC+10)', 'ACST (UTC+9:30)', 'AWST (UTC+8)', 'NZST (UTC+12)', 'UTC', 'IST (UTC+5:30)', 'PKT (UTC+5)']

function Step1({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!data.name?.trim()) e.name = 'Provider/organisation name is required.'
    if (!data.headline?.trim()) e.headline = 'Headline is required.'
    if (!data.contact_email?.trim()) e.contact_email = 'Email is required.'
    return e
  }

  function handleNext() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  return (
    <>
      <h2 className="setup-card-title">Expert Identity</h2>
      <p className="setup-card-sub">Tell workers and candidates about your training organisation</p>

      <div className="form-group">
        <label>Organisation / Provider Name</label>
        <input className={`form-input${errors.name ? ' error' : ''}`} type="text"
          placeholder="e.g. Pacific Trades Training RTO" value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)} />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label>Headline / Tagline</label>
        <input className={`form-input${errors.headline ? ' error' : ''}`} type="text"
          placeholder="e.g. Australia's leading trades upskilling provider"
          value={data.headline || ''}
          onChange={(e) => onChange('headline', e.target.value)} />
        {errors.headline && <p className="form-error">{errors.headline}</p>}
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label>Years in Operation</label>
          <input className="form-input" type="number" min="0" placeholder="e.g. 8"
            value={data.years_operation || ''}
            onChange={(e) => onChange('years_operation', parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-group">
          <label>RTO / CRICOS Number (optional)</label>
          <input className="form-input" type="text" placeholder="e.g. 12345"
            value={data.rto_number || ''}
            onChange={(e) => onChange('rto_number', e.target.value)} />
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label>Contact Email</label>
          <input className={`form-input${errors.contact_email ? ' error' : ''}`} type="email"
            placeholder="training@provider.com" value={data.contact_email || ''}
            onChange={(e) => onChange('contact_email', e.target.value)} />
          {errors.contact_email && <p className="form-error">{errors.contact_email}</p>}
        </div>
        <div className="form-group">
          <label>Website</label>
          <input className="form-input" type="url" placeholder="https://provider.com"
            value={data.website_url || ''}
            onChange={(e) => onChange('website_url', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label>Country</label>
        <input className="form-input" type="text" placeholder="e.g. Australia"
          value={data.country || ''}
          onChange={(e) => onChange('country', e.target.value)} />
      </div>

      <div className="setup-actions">
        <div />
        <button className="btn btn-primary" onClick={handleNext}>Next →</button>
      </div>
    </>
  )
}

function Step2({ data, onChange, onNext, onBack }) {
  function toggleService(s) {
    const c = data.service_types || []
    onChange('service_types', c.includes(s) ? c.filter((x) => x !== s) : [...c, s])
  }
  function toggleExpertise(s) {
    const c = data.expertise_areas || []
    onChange('expertise_areas', c.includes(s) ? c.filter((x) => x !== s) : [...c, s])
  }
  function toggleLang(l) {
    const c = data.languages || []
    onChange('languages', c.includes(l) ? c.filter((x) => x !== l) : [...c, l])
  }

  return (
    <>
      <h2 className="setup-card-title">Training Services</h2>
      <p className="setup-card-sub">What do you offer and who can you help?</p>

      <div className="form-group">
        <label>Service Types</label>
        <div className="chip-group">
          {SERVICE_TYPES.map((s) => (
            <button key={s} type="button"
              className={`chip${(data.service_types || []).includes(s) ? ' selected' : ''}`}
              onClick={() => toggleService(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Areas of Expertise</label>
        <div className="chip-group">
          {EXPERTISE_AREAS.map((s) => (
            <button key={s} type="button"
              className={`chip${(data.expertise_areas || []).includes(s) ? ' selected' : ''}`}
              onClick={() => toggleExpertise(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Languages of Instruction</label>
        <div className="chip-group">
          {LANGUAGES_OPTIONS.map((l) => (
            <button key={l} type="button"
              className={`chip${(data.languages || []).includes(l) ? ' selected' : ''}`}
              onClick={() => toggleLang(l)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Portfolio / Course Links (optional)</label>
        <textarea className="form-input" rows={2}
          placeholder="https://course1.com&#10;https://course2.com"
          value={data.portfolio_links || ''}
          onChange={(e) => onChange('portfolio_links', e.target.value)} />
      </div>

      <div className="form-group">
        <label>Certifications / Accreditations (optional)</label>
        <input className="form-input" type="text"
          placeholder="e.g. ISO 9001, ASQA Registered, ACPET Member"
          value={data.certifications || ''}
          onChange={(e) => onChange('certifications', e.target.value)} />
      </div>

      <div className="setup-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>Next →</button>
      </div>
    </>
  )
}

function Step3({ data, onChange, onNext, onBack, loading }) {
  return (
    <>
      <h2 className="setup-card-title">Rates & Availability</h2>
      <p className="setup-card-sub">Let candidates know your pricing and schedule</p>

      <div className="form-row-2">
        <div className="form-group">
          <label>Hourly Rate (AUD)</label>
          <input className="form-input" type="number" min="0" placeholder="e.g. 120"
            value={data.hourly_rate || ''}
            onChange={(e) => onChange('hourly_rate', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Course Fee Range</label>
          <input className="form-input" type="text" placeholder="e.g. $500 – $2,000"
            value={data.fee_range || ''}
            onChange={(e) => onChange('fee_range', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label>Timezone</label>
        <select className="form-input" value={data.timezone || ''}
          onChange={(e) => onChange('timezone', e.target.value)}>
          <option value="">Select timezone…</option>
          {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Availability / Schedule Notes</label>
        <textarea className="form-input" rows={3}
          placeholder="e.g. Mon–Fri 9am–5pm AEST. Weekend workshops available on request."
          value={data.availability_notes || ''}
          onChange={(e) => onChange('availability_notes', e.target.value)} />
      </div>

      <div className="form-check">
        <input type="checkbox" id="online_capable"
          checked={!!data.online_capable}
          onChange={(e) => onChange('online_capable', e.target.checked)} />
        <label htmlFor="online_capable">I can deliver training fully online</label>
      </div>
      <div className="form-check">
        <input type="checkbox" id="govt_funded"
          checked={!!data.govt_funded}
          onChange={(e) => onChange('govt_funded', e.target.checked)} />
        <label htmlFor="govt_funded">Government-funded training available</label>
      </div>

      <div className="setup-actions">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext} disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : 'Complete Setup'}
        </button>
      </div>
    </>
  )
}

function Step4({ onDashboard }) {
  return (
    <div className="success-card">
      <div className="success-icon">✓</div>
      <h2 className="success-title">Training Profile Ready!</h2>
      <p className="success-sub">
        Your training provider profile has been created. You can now add courses and connect with candidates seeking upskilling.
      </p>
      <button className="btn btn-primary" onClick={onDashboard}>
        Go to Instructor Dashboard →
      </button>
    </div>
  )
}

export function TrainerSetup() {
  const { step: stepParam } = useParams()
  const navigate = useNavigate()
  const step = parseInt(stepParam) || 1

  const [data, setData] = useState({ service_types: [], expertise_areas: [], languages: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function onChange(field, val) { setData((p) => ({ ...p, [field]: val })) }
  function goTo(n) { navigate(`/setup/trainer/${n}`) }

  async function handleComplete() {
    const token = getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true); setError('')
    const payload = {
      name: data.name,
      contact_email: data.contact_email,
      website_url: data.website_url || null,
      country: data.country || 'Australia',
      status: 'active',
    }
    try {
      await createTrainingProvider(payload, token)
      goTo(4)
    } catch (err) {
      setError(err.detail || 'Failed to create training provider profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-header">
        <Logo />
        <div className="setup-title">Training Provider Setup</div>
        <div className="setup-sub">Connect with candidates who need your expertise</div>
      </div>

      <StepProgress steps={STEPS} current={step} />

      <div className="setup-card">
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => goTo(2)} />}
        {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
        {step === 3 && <Step3 data={data} onChange={onChange} onNext={handleComplete} onBack={() => goTo(2)} loading={loading} />}
        {step === 4 && <Step4 onDashboard={() => navigate('/dashboard')} />}
      </div>
    </div>
  )
}
