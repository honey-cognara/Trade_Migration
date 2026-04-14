import { useRef } from 'react'

export function OtpInput({ value = '', onChange, length = 6 }) {
  const inputs = useRef([])
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function handleChange(e, idx) {
    const ch = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = ch
    const joined = next.join('')
    onChange(joined)
    if (ch && idx < length - 1) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted.padEnd(length, '').slice(0, length))
      const focusIdx = Math.min(pasted.length, length - 1)
      inputs.current[focusIdx]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="otp-inputs">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          className={`otp-input${d ? ' filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  )
}
