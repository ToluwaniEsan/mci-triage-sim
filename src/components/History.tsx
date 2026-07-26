import { useMemo } from 'react'
import type { SessionRecord } from '../game/history'
import { TIER_INFO } from '../data/cases'

interface HistoryProps {
  records: SessionRecord[]
  onClose: () => void
}

function accuracyOf(r: SessionRecord): number {
  return r.resolvedCount === 0 ? 0 : Math.round((r.correctCount / r.resolvedCount) * 100)
}

function trendLabel(records: SessionRecord[]): { label: string; className: string } {
  if (records.length < 2) return { label: 'Not enough sessions yet to spot a trend.', className: 'trend-flat' }

  const chron = [...records].reverse() // oldest first
  const half = Math.max(1, Math.floor(chron.length / 2))
  const older = chron.slice(0, half)
  const recent = chron.slice(chron.length - half)
  const avg = (arr: SessionRecord[]) => arr.reduce((s, r) => s + accuracyOf(r), 0) / arr.length
  const diff = avg(recent) - avg(older)

  if (diff > 5) return { label: `Improving — accuracy up ${Math.round(diff)} pts recently`, className: 'trend-up' }
  if (diff < -5) return { label: `Slipping — accuracy down ${Math.round(-diff)} pts recently`, className: 'trend-down' }
  return { label: 'Holding steady', className: 'trend-flat' }
}

export function History({ records, onClose }: HistoryProps) {
  const trend = useMemo(() => trendLabel(records), [records])
  const chron = useMemo(() => [...records].reverse(), [records])

  const points = useMemo(
    () =>
      chron
        .map((r, i) => {
          const x = chron.length <= 1 ? 50 : (i / (chron.length - 1)) * 100
          const y = 100 - accuracyOf(r)
          return `${x},${y}`
        })
        .join(' '),
    [chron],
  )

  return (
    <div className="history-panel">
      <div className="history-head">
        <h1>Session History</h1>
        <button type="button" onClick={onClose}>
          Back
        </button>
      </div>

      {records.length === 0 ? (
        <p className="history-empty">No completed shifts yet — finish a shift to start tracking progress.</p>
      ) : (
        <>
          <div className={`trend-banner ${trend.className}`}>{trend.label}</div>

          {chron.length > 1 && (
            <svg className="trend-sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={points} fill="none" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
          )}

          <ul className="history-list">
            {records.map((r) => (
              <li key={r.id} className="history-item">
                <div className="history-item-head">
                  <span className={`history-outcome history-outcome-${r.outcome}`}>
                    {r.outcome === 'won' ? 'Completed' : 'Overwhelmed'}
                  </span>
                  <span className="history-date">{new Date(r.timestamp).toLocaleString()}</span>
                </div>
                <div className="history-stats">
                  Level {r.totalPatients} · {r.correctCount}/{r.resolvedCount} correct ({accuracyOf(r)}%) · {r.mistakes}{' '}
                  mistake{r.mistakes === 1 ? '' : 's'}
                  {r.starsEarned > 0 ? ` · ⭐ ${r.starsEarned}` : ''}
                </div>
                {r.answered.length > 0 && (
                  <details className="history-details">
                    <summary>
                      Review all {r.answered.length} case{r.answered.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="debrief-list">
                      {r.answered.map((a, i) => (
                        <li key={i} className={a.wasCorrect ? 'debrief-item-correct' : 'debrief-item-wrong'}>
                          <span className="debrief-case">
                            {a.wasCorrect ? '✓' : '✗'} {a.label}
                          </span>
                          <span className="debrief-verdict">
                            {a.wasCorrect
                              ? `Correctly called ${TIER_INFO[a.correct].title}`
                              : `${a.chosen ? `Called ${TIER_INFO[a.chosen].title}` : 'Timed out'} — should have been ${TIER_INFO[a.correct].title}`}
                          </span>
                          <span className="debrief-reason">{a.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
