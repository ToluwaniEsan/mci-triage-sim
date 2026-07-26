import type { CSSProperties } from 'react'

const LEVELS = [
  { count: 20, name: 'Beginner', accent: '#2ea34a' },
  { count: 40, name: 'Busy Shift', accent: '#8bbf3f' },
  { count: 60, name: 'Overflow', accent: '#d9a521' },
  { count: 80, name: 'Mass Casualty', accent: '#e0752f' },
  { count: 100, name: 'Full Disaster', accent: '#e0313a' },
]

interface LevelSelectProps {
  playerName: string
  onSelect: (count: number) => void
  onViewHistory: () => void
  onViewScoreboard: () => void
  onSwitchPlayer: () => void
}

export function LevelSelect({ playerName, onSelect, onViewHistory, onViewScoreboard, onSwitchPlayer }: LevelSelectProps) {
  return (
    <div className="level-select">
      <div className="title-eyebrow">EMERGENCY DEPARTMENT SIMULATOR</div>
      <h1>MCI Triage Shift</h1>

      <div className="nurse-greeting">
        On shift: <strong>Nurse {playerName}</strong>
        <button type="button" className="text-link" onClick={onSwitchPlayer}>
          Switch nurse
        </button>
      </div>

      <p>Choose how many patients come through the door tonight.</p>
      <div className="level-grid">
        {LEVELS.map((level) => (
          <button
            key={level.count}
            type="button"
            className="level-card"
            style={{ '--accent': level.accent } as CSSProperties}
            onClick={() => onSelect(level.count)}
          >
            <span className="level-count">{level.count}</span>
            <span className="level-name">{level.name}</span>
          </button>
        ))}
      </div>
      <p className="level-rule">4 wrong calls and the ER goes under. Arrivals speed up as the shift goes on.</p>

      <div className="title-nav">
        <button type="button" className="nav-btn" onClick={onViewScoreboard}>
          Scoreboard
        </button>
        <button type="button" className="nav-btn" onClick={onViewHistory}>
          Past Sessions
        </button>
      </div>
    </div>
  )
}
