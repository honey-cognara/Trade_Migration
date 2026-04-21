/** Shared background blobs — matches OtpPage / Figma design system */
export function FigmaBg() {
  return (
    <>
      {/* top-right: large blue ellipse */}
      <div style={{ position:'absolute', top:-90, right:-110, width:370, height:320,
        borderRadius:'50%', background:'#e6f1ff', opacity:0.9, zIndex:0 }} />
      {/* top-right: yellow-green ellipse */}
      <div style={{ position:'absolute', top:15, right:75, width:185, height:160,
        borderRadius:'50%', background:'#f4f68b', opacity:0.65, zIndex:0 }} />

      {/* bottom-left: large blue ellipse */}
      <div style={{ position:'absolute', bottom:-90, left:-115, width:355, height:305,
        borderRadius:'50%', background:'#e6f1ff', opacity:0.85, zIndex:0 }} />
      {/* bottom-left: yellow-green ellipse */}
      <div style={{ position:'absolute', bottom:22, left:52, width:170, height:150,
        borderRadius:'50%', background:'#f4f68b', opacity:0.5, zIndex:0 }} />

      {/* top-left: 4 small green dots */}
      <div style={{ position:'absolute', top:'8%',  left:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'13%', left:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6,  zIndex:0 }} />
      <div style={{ position:'absolute', top:'6%',  left:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55, zIndex:0 }} />
      <div style={{ position:'absolute', top:'17%', left:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5,  zIndex:0 }} />

      {/* bottom-right: 4 small green dots */}
      <div style={{ position:'absolute', bottom:'10%', right:'5%',   width:22, height:22, borderRadius:'50%', background:'#b4eb50', opacity:0.7,  zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'16%', right:'3.5%', width:14, height:14, borderRadius:'50%', background:'#b4eb50', opacity:0.6,  zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'8%',  right:'8.5%', width:10, height:10, borderRadius:'50%', background:'#b4eb50', opacity:0.55, zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'20%', right:'6%',   width:8,  height:8,  borderRadius:'50%', background:'#b4eb50', opacity:0.5,  zIndex:0 }} />
    </>
  )
}
