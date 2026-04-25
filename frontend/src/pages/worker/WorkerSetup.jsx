import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCandidateProfile, updateCandidateProfile, getToken } from '../../services/api'

import illusAboutMe   from '../../assets/illus-about-me.svg'
import illusPercent   from '../../assets/illus-percentages.svg'
import illusJobHunt   from '../../assets/illus-job-hunt.svg'
import iconUpload     from '../../assets/icon-upload.svg'
import radioChecked   from '../../assets/radio-checked.svg'
import radioUnchecked from '../../assets/radio-unchecked.svg'
import cornerBL       from '../../assets/corner-bl-fp.svg'
import cornerTR       from '../../assets/corner-tr-fp.svg'
import confettiGroup  from '../../assets/confetti-group-ws.svg'
import confettiGroup1 from '../../assets/confetti-group1-ws.svg'
import confettiGroup2 from '../../assets/confetti-group2-ws.svg'
import confettiGroup3 from '../../assets/confetti-group3-ws.svg'

/* ── LocalStorage helpers ── */
const LS_KEY = 'worker_setup'
function loadData() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} } }
function saveData(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {} }

const font = "'Urbanist', sans-serif"

const STEPS = [
  { label: 'Personal Identity',   sub: 'Your basic profile info' },
  { label: 'Experience & Skills', sub: 'Your skills and resume'  },
  { label: 'Career Preferences',  sub: 'What you are looking for'},
]

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a7380' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`

/* ── Sidebar ── */
function StepSidebar({ current }) {
  return (
    <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:0 }}>
      {STEPS.map((s, i) => {
        const n = i + 1
        const active = n <= current
        return (
          <div key={i} style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <img src={active ? radioChecked : radioUnchecked} alt=""
                style={{ width:24, height:24, flexShrink:0 }} />
              <div>
                <p style={{ fontFamily:font, fontSize:16, fontWeight:700, margin:0, lineHeight:1.3,
                  color: active ? '#403c8b' : '#8280a7' }}>
                  {s.label}
                </p>
                <p style={{ fontFamily:font, fontSize:14, fontWeight:400, margin:0, lineHeight:1.3,
                  color: active ? '#6a7380' : '#b0aec8' }}>
                  {s.sub}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width:2, height:32,
                background: n < current ? '#403c8b' : '#e0dff0',
                marginLeft:11, marginTop:4, marginBottom:4,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Shared styles ── */
const iStyle = {
  height:56, padding:'16px 20px',
  border:'1px solid #6a7380', borderRadius:12, background:'#fff',
  fontFamily:font, fontSize:16, fontWeight:400, color:'#343434',
  outline:'none', boxSizing:'border-box', width:'100%', lineHeight:1.3,
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <label style={{ fontFamily:font, fontSize:16, fontWeight:700, color:'#343434', lineHeight:1.3 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrMsg({ msg }) {
  return msg ? <p style={{ color:'#ef4444', fontSize:13, margin:0, fontFamily:font }}>{msg}</p> : null
}

function NextBtn({ loading, label, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width:'100%', height:53, background:'#5379f4', color:'#fff',
      border:'none', borderRadius:12,
      fontFamily:font, fontSize:16, fontWeight:600, lineHeight:1.3,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
      boxShadow:'0 4px 13.6px 0 #97b6fd', transition:'background 0.18s',
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4264d6' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      background:'none', border:'none', width:'100%',
      fontFamily:font, fontSize:16, fontWeight:600,
      color:'#403c8b', textDecoration:'underline',
      cursor:'pointer', lineHeight:1.3, padding:0,
    }}>
      Go Back
    </button>
  )
}

/* ── Upload area ── */
function UploadArea({ label, sub, fileRef, fileName, onChange, onDrop }) {
  return (
    <div onClick={() => fileRef.current?.click()}
      onDragOver={e => e.preventDefault()} onDrop={onDrop}
      style={{
        border:'2px dashed #6a7380', borderRadius:12, background:'#fff',
        padding:'1.5rem', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        gap:8, cursor:'pointer', minHeight:120,
      }}>
      <input ref={fileRef} type="file" accept=".pdf" hidden onChange={onChange} />
      <img src={iconUpload} alt="" style={{ width:32, height:32 }} />
      <p style={{ fontFamily:font, fontSize:14, fontWeight:700, color:'#343434', margin:0 }}>
        {fileName || label}
      </p>
      <p style={{ fontFamily:font, fontSize:12, color:'#6a7380', margin:0 }}>
        {fileName ? 'Click to change' : sub}
      </p>
    </div>
  )
}

/* ── STEP 1 ── */
function Step1({ data, onChange, onNext }) {
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  function validate() {
    const e = {}
    if (!data.full_name?.trim())          e.full_name          = 'Full name is required.'
    if (!data.professional_title?.trim()) e.professional_title = 'Professional title is required.'
    if (!data.years_experience)           e.years_experience   = 'Please select years of experience.'
    return e
  }

  function handleNext() {
    setTouched({ full_name:true, professional_title:true, years_experience:true })
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  const err = f => touched[f] && errors[f]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <p style={{ fontFamily:font, fontSize:28, fontWeight:700, color:'#343434', margin:'0 0 8px', lineHeight:1.3 }}>
          Tell us about yourself
        </p>
        <p style={{ fontFamily:font, fontSize:16, color:'#6a7380', margin:0, lineHeight:1.5 }}>
          Create your professional profile to start matching with world-class companies.
        </p>
      </div>

      <Field label="Full Name">
        <input type="text" placeholder="Enter Your Full Name"
          value={data.full_name || ''}
          onChange={e => { onChange('full_name', e.target.value); setErrors(p => ({...p, full_name:''})) }}
          onBlur={() => setTouched(p => ({...p, full_name:true}))}
          style={{ ...iStyle, borderColor: err('full_name') ? '#ef4444' : '#6a7380' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
        />
        <ErrMsg msg={err('full_name')} />
      </Field>

      <Field label="Professional Title">
        <input type="text" placeholder="e.g. Licensed Electrician"
          value={data.professional_title || ''}
          onChange={e => { onChange('professional_title', e.target.value); setErrors(p => ({...p, professional_title:''})) }}
          onBlur={() => setTouched(p => ({...p, professional_title:true}))}
          style={{ ...iStyle, borderColor: err('professional_title') ? '#ef4444' : '#6a7380' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
        />
        <ErrMsg msg={err('professional_title')} />
      </Field>

      <Field label="Years of Experience">
        <select value={data.years_experience ?? ''}
          onChange={e => { onChange('years_experience', e.target.value || null); setErrors(p => ({...p, years_experience:''})) }}
          onBlur={() => setTouched(p => ({...p, years_experience:true}))}
          style={{ ...iStyle, borderColor: err('years_experience') ? '#ef4444' : '#6a7380',
            appearance:'none', backgroundImage:SELECT_ARROW, backgroundRepeat:'no-repeat', backgroundPosition:'right 1.2rem center' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
        >
          <option value="">Select Years of Experience</option>
          <option value="0">Less than 1 year</option>
          <option value="1">1–2 years</option>
          <option value="3">3–5 years</option>
          <option value="5">5–10 years</option>
          <option value="10">10+ years</option>
        </select>
        <ErrMsg msg={err('years_experience')} />
      </Field>

      <NextBtn label="Next Step" onClick={handleNext} />
    </div>
  )
}

/* ── STEP 2 ── */
function Step2({ data, onChange, onNext, onBack }) {
  const fileRef = useRef(null)
  const [fileName, setFile] = useState(data.resume_name || '')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <p style={{ fontFamily:font, fontSize:28, fontWeight:700, color:'#343434', margin:'0 0 8px', lineHeight:1.3 }}>
          What are your core strengths?
        </p>
        <p style={{ fontFamily:font, fontSize:16, color:'#6a7380', margin:0, lineHeight:1.5 }}>
          Add your skills so we can show you the most relevant opportunities.
        </p>
      </div>

      <Field label="Skills you have">
        <input type="text" placeholder="e.g. Wiring, PLC Programming"
          value={data.skills_have_input || ''}
          onChange={e => onChange('skills_have_input', e.target.value)}
          style={iStyle}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <Field label="Skills you want to learn">
        <input type="text" placeholder="e.g. Solar Installation"
          value={data.skills_learn_input || ''}
          onChange={e => onChange('skills_learn_input', e.target.value)}
          style={iStyle}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <Field label="Upload Resume (PDF)">
        <UploadArea
          label="Click or drag to upload resume"
          sub="PDF files only · Max 10MB"
          fileRef={fileRef}
          fileName={fileName}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) { setFile(f.name); onChange('resume_file', f); onChange('resume_name', f.name) }
          }}
          onDrop={e => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) { setFile(f.name); onChange('resume_file', f); onChange('resume_name', f.name) }
          }}
        />
      </Field>

      <NextBtn label="Next Step" onClick={onNext} />
      <BackBtn onClick={onBack} />
    </div>
  )
}

/* ── STEP 3 ── */
function Step3({ data, onChange, onFinish, onBack, loading }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <p style={{ fontFamily:font, fontSize:28, fontWeight:700, color:'#343434', margin:'0 0 8px', lineHeight:1.3 }}>
          What are you looking for?
        </p>
        <p style={{ fontFamily:font, fontSize:16, color:'#6a7380', margin:0, lineHeight:1.5 }}>
          Define your ideal role so we can find the perfect match.
        </p>
      </div>

      <Field label="Preferred Role Type">
        <select value={data.preferred_role_type || ''}
          onChange={e => onChange('preferred_role_type', e.target.value)}
          style={{ ...iStyle, appearance:'none', backgroundImage:SELECT_ARROW, backgroundRepeat:'no-repeat', backgroundPosition:'right 1.2rem center' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        >
          <option value="">Choose role type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="casual">Casual</option>
        </select>
      </Field>

      <Field label="Expected Salary / Rate">
        <input type="text" placeholder="e.g. $80,000/yr or $45/hr"
          value={data.expected_salary || ''}
          onChange={e => onChange('expected_salary', e.target.value)}
          style={iStyle}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      </Field>

      <Field label="Availability">
        <select value={data.availability || ''}
          onChange={e => onChange('availability', e.target.value)}
          style={{ ...iStyle, appearance:'none', backgroundImage:SELECT_ARROW, backgroundRepeat:'no-repeat', backgroundPosition:'right 1.2rem center' }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #5379f4' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        >
          <option value="">Choose availability</option>
          <option value="immediately">Immediately</option>
          <option value="2_weeks">2 weeks notice</option>
          <option value="1_month">1 month notice</option>
          <option value="3_months_plus">3+ months</option>
        </select>
      </Field>

      <NextBtn loading={loading} label="Finish Setup" onClick={onFinish} />
      <BackBtn onClick={onBack} />
    </div>
  )
}

/* ── Success Modal ── */
function SuccessModal({ onExplore }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(53,53,53,0.63)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:100, padding:'1rem',
    }}>
      <div style={{
        background:'#fff', borderRadius:24, padding:'2.5rem 2rem',
        maxWidth:460, width:'100%', textAlign:'center',
        position:'relative', overflow:'hidden',
      }}>
        <img src={confettiGroup}  alt="" aria-hidden="true" style={{ position:'absolute', top:0, left:0,   width:120, pointerEvents:'none' }} />
        <img src={confettiGroup1} alt="" aria-hidden="true" style={{ position:'absolute', top:0, right:0,  width:120, pointerEvents:'none' }} />
        <img src={confettiGroup2} alt="" aria-hidden="true" style={{ position:'absolute', bottom:0, left:0,  width:100, pointerEvents:'none' }} />
        <img src={confettiGroup3} alt="" aria-hidden="true" style={{ position:'absolute', bottom:0, right:0, width:100, pointerEvents:'none' }} />

        <div style={{
          width:88, height:88, borderRadius:'50%', background:'#f26f37',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 1.2rem', position:'relative', zIndex:1,
        }}>
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
            <path d="M3 16L15 28L37 4" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p style={{ fontFamily:font, fontSize:28, fontWeight:700, color:'#343434', margin:'0 0 8px', position:'relative', zIndex:1, lineHeight:1.3 }}>
          Your profile is ready!
        </p>
        <p style={{ fontFamily:font, fontSize:16, color:'#6a7380', margin:'0 0 24px', lineHeight:1.5, position:'relative', zIndex:1 }}>
          You are now visible to world-class companies. Start exploring curated
          job opportunities tailored to your goals.
        </p>
        <button onClick={onExplore} style={{
          width:'100%', height:53, background:'#5379f4', color:'#fff',
          border:'none', borderRadius:12,
          fontFamily:font, fontSize:16, fontWeight:600, cursor:'pointer',
          boxShadow:'0 4px 13.6px 0 #97b6fd', position:'relative', zIndex:1, lineHeight:1.3,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4264d6' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#5379f4' }}
        >
          Explore Opportunities
        </button>
      </div>
    </div>
  )
}

/* ── Main Component ── */
export function WorkerSetup() {
  const navigate = useNavigate()
  const [step,      setStep]      = useState(1)
  const [data,      setData]      = useState(() => loadData())
  const [loading,   setLoading]   = useState(false)
  const [apiError,  setApiError]  = useState('')
  const [showModal, setShowModal] = useState(false)

  function onChange(field, val) {
    setData(prev => { const n = { ...prev, [field]: val }; saveData(n); return n })
  }

  async function handleFinish() {
    const token = localStorage.getItem('access_token') || getToken()
    if (!token) { navigate('/login'); return }
    setLoading(true); setApiError('')
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
      setShowModal(true)
    } catch (err) {
      setApiError(err?.detail || 'Failed to save profile. Please try again.')
    } finally { setLoading(false) }
  }

  const ILLUS = [illusAboutMe, illusPercent, illusJobHunt]

  return (
    <div style={{
      background:'#fbfbfb', minHeight:'100vh',
      position:'relative', overflow:'hidden', fontFamily:font,
    }}>
      <img src={cornerBL} alt="" aria-hidden="true" style={{ position:'absolute', bottom:0, left:0,  width:368, height:396, pointerEvents:'none', zIndex:0 }} />
      <img src={cornerTR} alt="" aria-hidden="true" style={{ position:'absolute', top:0,  right:0, width:446, height:401, pointerEvents:'none', zIndex:0 }} />

      <div style={{ position:'relative', zIndex:2, minHeight:'100vh', display:'flex', alignItems:'center' }}>
        <div style={{
          width:'100%', maxWidth:1200, margin:'2rem auto',
          padding:'0 60px', display:'flex', alignItems:'center', gap:'3rem',
        }}>
          <StepSidebar current={step} />

          <div style={{
            width:551, flexShrink:0,
            background:'rgba(230,241,255,0.94)',
            backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)',
            borderRadius:16, padding:32,
          }}>
            {apiError && (
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', color:'#b91c1c',
                borderRadius:8, padding:'0.55rem 0.8rem', fontSize:14, fontFamily:font, marginBottom:16 }}>
                {apiError}
              </div>
            )}
            {step === 1 && <Step1 data={data} onChange={onChange} onNext={() => { setApiError(''); setStep(2) }} />}
            {step === 2 && <Step2 data={data} onChange={onChange} onNext={() => { setApiError(''); setStep(3) }} onBack={() => setStep(1)} />}
            {step === 3 && <Step3 data={data} onChange={onChange} onFinish={handleFinish} onBack={() => setStep(2)} loading={loading} />}
          </div>

          <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src={ILLUS[step-1]} alt="" style={{ width:'100%', maxWidth:460, height:'auto' }} />
          </div>
        </div>
      </div>

      {showModal && (
        <SuccessModal onExplore={() => { setShowModal(false); navigate('/dashboard', { replace:true }) }} />
      )}
    </div>
  )
}
