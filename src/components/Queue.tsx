import type { QueuedPatient } from '../game/useGame'
import { SPRITES } from '../data/sprites'

interface QueueProps {
  queue: QueuedPatient[]
  maxQueueLength: number | null
}

export function Queue({ queue, maxQueueLength }: QueueProps) {
  const ratio = maxQueueLength ? queue.length / maxQueueLength : 0
  const dangerClass = !maxQueueLength ? '' : ratio >= 0.85 ? 'queue-danger-high' : ratio >= 0.55 ? 'queue-danger-mid' : ''

  return (
    <div className={`queue-strip ${dangerClass}`}>
      <span className="queue-label">
        WAITING{maxQueueLength ? ` ${queue.length}/${maxQueueLength}` : ''}
      </span>
      <div className="queue-track">
        {queue.map((patient, i) => (
          <img
            key={patient.instanceId}
            className={`queue-avatar ${i === 0 ? 'queue-avatar-active' : ''}`}
            src={SPRITES[patient.sprite]}
            alt={patient.label}
          />
        ))}
      </div>
    </div>
  )
}
