import { Link } from 'react-router-dom'
import illusHire from '../assets/illus-hire.svg'
import illusTrain from '../assets/illus-train.svg'
import illusWork from '../assets/illus-work.svg'

export function LandingPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#f9f9f9', position:'relative', overflow:'hidden' }}>

      {/* ── Background blobs ── */}
      {/* Top-right blue+yellow blobs */}
      <div style={{ position:'absolute', top:-60, right:-80, width:320, height:280, borderRadius:'50%', background:'#e6f1ff', opacity:0.85, zIndex:0 }} />
      <div style={{ position:'absolute', top:20, right:80, width:160, height:140, borderRadius:'50%', background:'#f4f68b', opacity:0.7, zIndex:0 }} />
      {/* Bottom-left green blobs */}
      <div style={{ position:'absolute', bottom:-60, left:-80, width:300, height:260, borderRadius:'50%', background:'#b4eb50', opacity:0.55, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:40, left:60, width:140, height:120, borderRadius:'50%', background:'#f4f68b', opacity:0.5, zIndex:0 }} />
      {/* Small decorative dots */}
      <div style={{ position:'absolute', top:'18%', left:'6%', width:8, height:8, borderRadius:'50%', background:'#f26f37', opacity:0.6, zIndex:0 }} />
      <div style={{ position:'absolute', top:'14%', left:'8.5%', width:5, height:5, borderRadius:'50%', background:'#f26f37', opacity:0.4, zIndex:0 }} />
      <div style={{ position:'absolute', top:'22%', right:'8%', width:6, height:6, borderRadius:'50%', background:'#e6f1ff', zIndex:0 }} />

      {/* ── Content ── */}
      <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'3rem 1rem', textAlign:'center' }}>

        {/* Hero text */}
        <h1 style={{ fontFamily:"'Inter', sans-serif", fontSize:'clamp(1.7rem,3.5vw,2.5rem)', fontWeight:800, color:'#1a1a2e', lineHeight:1.25, maxWidth:700, marginBottom:'1rem' }}>
          Connecting world-class talent with opportunities<br />and the skills to succeed.
        </h1>
        <p style={{ fontSize:'0.95rem', color:'#555', maxWidth:620, lineHeight:1.7, marginBottom:'3rem' }}>
          Welcome to a professional ecosystem where hiring meets learning. Whether you're building a team,
          advancing your career, or sharing your expertise, we provide the platform to connect you with the right
          people and the specific skills needed to succeed in today's market.
        </p>

        {/* ── Role cards ── */}
        <div style={{ display:'flex', gap:'1.75rem', flexWrap:'wrap', justifyContent:'center', marginBottom:'2.5rem' }}>

          {/* ── Card 1: Hire ── */}
          <Link to="/register?role=employer" style={{ textDecoration:'none' }}>
            <div
              style={{ width:230, background:'#f7f8fc', border:'1.5px solid #dde3f0', borderRadius:18, overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.18s, transform 0.18s', boxShadow:'0 2px 12px rgba(83,121,244,0.06)' }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 10px 32px rgba(83,121,244,0.18)'; e.currentTarget.style.transform='translateY(-4px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 2px 12px rgba(83,121,244,0.06)'; e.currentTarget.style.transform='' }}
            >
              <div style={{ width:'100%', height:190, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem 0.5rem 0.5rem' }}>
                <img src={illusHire} alt="Hire illustration" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
              <div style={{ padding:'0.75rem 1rem 1.1rem', textAlign:'center', fontWeight:800, fontSize:'1rem', color:'#1a1a2e' }}>
                I want to hire
              </div>
            </div>
          </Link>

          {/* ── Card 2: Train ── */}
          <Link to="/register?role=training_provider" style={{ textDecoration:'none' }}>
            <div
              style={{ width:230, background:'#f7f8fc', border:'1.5px solid #dde3f0', borderRadius:18, overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.18s, transform 0.18s', boxShadow:'0 2px 12px rgba(83,121,244,0.06)' }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 10px 32px rgba(83,121,244,0.18)'; e.currentTarget.style.transform='translateY(-4px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 2px 12px rgba(83,121,244,0.06)'; e.currentTarget.style.transform='' }}
            >
              <div style={{ width:'100%', height:190, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem 0.5rem 0.5rem' }}>
                <img src={illusTrain} alt="Train illustration" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
              <div style={{ padding:'0.75rem 1rem 1.1rem', textAlign:'center', fontWeight:800, fontSize:'1rem', color:'#1a1a2e' }}>
                I want to train
              </div>
            </div>
          </Link>

          {/* ── Card 3: Work (blue bg + corner accents) ── */}
          <Link to="/register?role=candidate" style={{ textDecoration:'none' }}>
            <div
              style={{ width:230, background:'#e6f1ff', border:'1.5px solid #c8d9f5', borderRadius:18, overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.18s, transform 0.18s', boxShadow:'0 2px 12px rgba(83,121,244,0.08)', position:'relative' }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 10px 32px rgba(83,121,244,0.22)'; e.currentTarget.style.transform='translateY(-4px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 2px 12px rgba(83,121,244,0.08)'; e.currentTarget.style.transform='' }}
            >
              {/* Green corner top-left */}
              <div style={{ position:'absolute', top:0, left:0, width:44, height:44, background:'#b4eb50', borderRadius:'0 0 40px 0', opacity:0.85 }} />
              {/* Orange circle bottom-right */}
              <div style={{ position:'absolute', bottom:38, right:0, width:36, height:36, background:'#f26f37', borderRadius:'14px 0 0 14px' }} />

              <div style={{ width:'100%', height:190, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem 0.5rem 0.5rem', position:'relative', zIndex:1 }}>
                <img src={illusWork} alt="Work illustration" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
              <div style={{ padding:'0.75rem 1rem 1.1rem', textAlign:'center', fontWeight:800, fontSize:'1rem', color:'#1a1a2e', position:'relative', zIndex:1 }}>
                I want to work
              </div>
            </div>
          </Link>

        </div>

        <div style={{ fontSize:'0.88rem', color:'#666' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#5379f4', fontWeight:700 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
