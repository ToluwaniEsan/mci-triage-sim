import { TIER_INFO, type Tier } from '../data/cases'
import { SPRITES, type Sprite } from '../data/sprites'
import erFloor from '../assets/scene/er-floor-doors.png'

const ENTRANCE = { x: 50, y: 47 }

const ZONES: Record<Tier, { x: number; y: number }> = {
  red: { x: 20, y: 45 },
  yellow: { x: 34, y: 43 },
  green: { x: 66, y: 43 },
  black: { x: 80, y: 45 },
}

interface SceneProps {
  activeZone: Tier | null
  locked: boolean
  patientSprite: Sprite | null
  onZoneClick: (tier: Tier) => void
}

export function Scene({ activeZone, onZoneClick, locked, patientSprite }: SceneProps) {
  const tokenPos = activeZone ? ZONES[activeZone] : ENTRANCE

  return (
    <div className="scene" style={{ backgroundImage: `url(${erFloor})` }}>
      {(Object.keys(ZONES) as Tier[]).map((tier) => (
        <button
          key={tier}
          type="button"
          aria-label={`Route to ${TIER_INFO[tier].title}`}
          className={`door-hit door-hit-${tier}`}
          style={{ left: `${ZONES[tier].x}%` }}
          onClick={() => onZoneClick(tier)}
          disabled={locked}
        />
      ))}

      {patientSprite && (
        <img
          className="token"
          src={SPRITES[patientSprite]}
          style={{ left: `${tokenPos.x}%`, top: `${tokenPos.y}%` }}
          alt=""
        />
      )}
    </div>
  )
}
