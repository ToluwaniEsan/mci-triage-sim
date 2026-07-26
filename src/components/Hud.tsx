interface HudProps {
  resolvedCount: number
  totalPatients: number
  correctCount: number
  mistakes: number
  maxMistakes: number
  timeLeft: number
  timeLimit: number
  stars: number
  achievementsActive: boolean
}

export function Hud({
  resolvedCount,
  totalPatients,
  correctCount,
  mistakes,
  maxMistakes,
  timeLeft,
  timeLimit,
  stars,
  achievementsActive,
}: HudProps) {
  const accuracy = resolvedCount === 0 ? 100 : Math.round((correctCount / resolvedCount) * 100)
  const timerPct = Math.max(0, timeLeft / timeLimit)
  const dash = 2 * Math.PI * 26

  return (
    <>
      <div className="hud-panel hud-left">
        <span className="hud-icon">👥</span>
        <div>
          <div className="hud-label">PATIENTS</div>
          <div className="hud-value">
            {resolvedCount}/{totalPatients} <span className="hud-sub">({accuracy}% correct)</span>
          </div>
          {achievementsActive && <div className="hud-stars">⭐ x{stars}</div>}
        </div>
      </div>

      <div className="hud-panel hud-right">
        <div className="hud-label">MISTAKES</div>
        <div className="mistake-dots">
          {Array.from({ length: maxMistakes }, (_, i) => (
            <span key={i} className={`mistake-dot ${i < mistakes ? 'mistake-dot-filled' : ''}`} />
          ))}
        </div>
      </div>

      <div className="timer-ring">
        <svg viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="26" className="timer-track" />
          <circle
            cx="30"
            cy="30"
            r="26"
            className="timer-progress"
            strokeDasharray={dash}
            strokeDashoffset={dash * (1 - timerPct)}
          />
        </svg>
        <span className="timer-text">{Math.ceil(timeLeft)}s</span>
      </div>
    </>
  )
}
