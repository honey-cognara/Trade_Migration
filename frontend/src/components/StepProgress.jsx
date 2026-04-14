export function StepProgress({ steps, current }) {
  return (
    <div className="step-progress">
      {steps.map((label, i) => {
        const idx = i + 1
        const state = idx < current ? 'completed' : idx === current ? 'active' : ''
        return (
          <div key={i} className={`step-item ${state}`}>
            <div className="step-dot">
              {idx < current ? '✓' : idx}
            </div>
            <span className="step-label">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
