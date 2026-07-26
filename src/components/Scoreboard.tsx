import { computeScoreboard, type SessionRecord } from '../game/history'

interface ScoreboardProps {
  records: SessionRecord[]
  currentPlayer: string
  onClose: () => void
}

export function Scoreboard({ records, currentPlayer, onClose }: ScoreboardProps) {
  const stats = computeScoreboard(records)

  return (
    <div className="scoreboard-panel">
      <div className="history-head">
        <h1>Scoreboard</h1>
        <button type="button" onClick={onClose}>
          Back
        </button>
      </div>

      {stats.length === 0 ? (
        <p className="history-empty">No shifts logged on this device yet.</p>
      ) : (
        <ul className="scoreboard-list">
          {stats.map((s, i) => (
            <li key={s.name} className={`scoreboard-row ${s.name === currentPlayer ? 'scoreboard-row-me' : ''}`}>
              <span className="scoreboard-rank">#{i + 1}</span>
              <span className="scoreboard-name">Nurse {s.name}</span>
              <span className="scoreboard-stat">{s.totalCorrect} correct</span>
              <span className="scoreboard-stat">{s.accuracy}% accuracy</span>
              <span className="scoreboard-stat">{s.shifts} shift{s.shifts === 1 ? '' : 's'}</span>
              <span className="scoreboard-stat">best level {s.bestLevel || '—'}</span>
              {s.bestStars > 0 && <span className="scoreboard-stat">⭐ {s.bestStars}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="scoreboard-note">Tracked on this device only — nurses who play elsewhere won't appear here.</p>
    </div>
  )
}
