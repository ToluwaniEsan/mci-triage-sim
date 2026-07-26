import { useState } from 'react'
import hospitalExterior from '../assets/scene/hospital-exterior.png'

interface PlayerGateProps {
  onSubmit: (name: string) => void
}

export function PlayerGate({ onSubmit }: PlayerGateProps) {
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed.length === 0) return
    onSubmit(trimmed.slice(0, 24))
  }

  return (
    <div className="welcome-screen" style={{ backgroundImage: `url(${hospitalExterior})` }}>
      <div className="welcome-overlay">
        <div className="welcome-title">
          <div className="title-eyebrow">EMERGENCY DEPARTMENT SIMULATOR</div>
          <h1>MCI Triage Shift</h1>
          <p className="welcome-tagline">Read fast. Decide fast. The waiting room won't wait.</p>
        </div>

        <div className="welcome-card">
          <p>New nurse on shift? Enter your name to get started.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={24}
              autoFocus
            />
            <button type="submit" disabled={name.trim().length === 0}>
              Start as Nurse {name.trim() || '___'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
