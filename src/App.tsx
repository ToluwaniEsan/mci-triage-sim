import { useEffect, useState } from 'react'
import { Scene } from './components/Scene'
import { Hud } from './components/Hud'
import { PatientCard } from './components/PatientCard'
import { Queue } from './components/Queue'
import { LevelSelect } from './components/LevelSelect'
import { History } from './components/History'
import { Scoreboard } from './components/Scoreboard'
import { PlayerGate } from './components/PlayerGate'
import { TIER_INFO } from './data/cases'
import { useGame } from './game/useGame'
import { loadHistory } from './game/history'
import { getCurrentPlayer, setCurrentPlayer, clearCurrentPlayer } from './game/player'
import { startMenuMusic, stopMenuMusic, startGameplayMusic, stopGameplayMusic } from './game/sound'
import hospitalExterior from './assets/scene/hospital-exterior.png'
import './App.css'

function App() {
  const [playerName, setPlayerName] = useState<string | null>(() => getCurrentPlayer())
  const [showHistory, setShowHistory] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const {
    phase,
    totalPatients,
    queue,
    current,
    timeLeft,
    timeLimit,
    correctCount,
    resolvedCount,
    mistakes,
    maxMistakes,
    feedback,
    answered,
    lossReason,
    maxQueueLength,
    queueDangerActive,
    stars,
    achievementsActive,
    paused,
    pauseGame,
    resumeGame,
    deterioration,
    selectTier,
    startLevel,
    restart,
  } = useGame()

  const onMenu = !playerName || phase === 'select'
  useEffect(() => {
    if (onMenu) {
      stopGameplayMusic()
      startMenuMusic()
    } else if (phase === 'playing' && !paused) {
      stopMenuMusic()
      startGameplayMusic()
    } else {
      // paused, or on the won/lost screen — no music fighting for attention
      stopMenuMusic()
      stopGameplayMusic()
    }
    return () => {
      stopMenuMusic()
      stopGameplayMusic()
    }
  }, [onMenu, phase, paused])

  if (!playerName) {
    return (
      <PlayerGate
        onSubmit={(name) => {
          setCurrentPlayer(name)
          setPlayerName(name)
        }}
      />
    )
  }

  if (phase === 'select') {
    if (showHistory) {
      return (
        <div className="app">
          <History records={loadHistory()} onClose={() => setShowHistory(false)} />
        </div>
      )
    }
    if (showScoreboard) {
      return (
        <div className="app">
          <Scoreboard records={loadHistory()} currentPlayer={playerName} onClose={() => setShowScoreboard(false)} />
        </div>
      )
    }
    return (
      <div className="menu-backdrop">
        <div className="menu-backdrop-bg" style={{ backgroundImage: `url(${hospitalExterior})` }} />
        <div className="menu-backdrop-overlay app">
          <LevelSelect
            playerName={playerName}
            onSelect={startLevel}
            onViewHistory={() => setShowHistory(true)}
            onViewScoreboard={() => setShowScoreboard(true)}
            onSwitchPlayer={() => {
              clearCurrentPlayer()
              setPlayerName(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <button type="button" className="pause-btn" onClick={pauseGame} aria-label="Pause">
        ⏸
      </button>

      <Hud
        resolvedCount={resolvedCount}
        totalPatients={totalPatients}
        correctCount={correctCount}
        mistakes={mistakes}
        maxMistakes={maxMistakes}
        timeLeft={timeLeft}
        timeLimit={timeLimit}
        stars={stars}
        achievementsActive={achievementsActive}
      />

      <Queue queue={queue} maxQueueLength={queueDangerActive ? maxQueueLength : null} />

      <Scene
        activeZone={feedback ? feedback.chosen ?? feedback.correct : null}
        locked={feedback !== null || paused}
        patientSprite={current?.sprite ?? null}
        onZoneClick={selectTier}
      />

      {current && <PatientCard patient={current} />}

      {deterioration && (
        <div className="deterioration-banner">
          ⚠️ {deterioration.label}'s condition just got worse — {TIER_INFO[deterioration.fromTier].title} to{' '}
          {TIER_INFO[deterioration.toTier].title}. Reassess now!
        </div>
      )}

      {feedback && (
        <div className={`feedback-banner ${feedback.wasCorrect ? 'feedback-good' : 'feedback-bad'}`}>
          <div className="feedback-headline">
            {feedback.wasCorrect
              ? 'Correct tier'
              : feedback.chosen
                ? `Wrong — should have been ${TIER_INFO[feedback.correct].title}`
                : `Too slow — should have been ${TIER_INFO[feedback.correct].title}`}
          </div>
          <div className="feedback-reason">{feedback.reason}</div>
        </div>
      )}

      {(phase === 'lost' || phase === 'won') && (
        <div className="game-over">
          <div className="game-over-card">
            <h1>
              {phase === 'won'
                ? 'Shift Complete'
                : lossReason === 'overcrowding'
                  ? 'Waiting Room Overwhelmed'
                  : 'ER Overwhelmed'}
            </h1>
            <p>
              {correctCount} / {resolvedCount} triaged correctly
              {phase === 'lost' && lossReason === 'mistakes' ? ' before the 4th mistake' : ''}
              {phase === 'lost' && lossReason === 'overcrowding'
                ? ` — ${maxQueueLength} patients were left waiting too long`
                : ''}
            </p>
            {achievementsActive && <p className="stars-earned">⭐ {stars} star{stars === 1 ? '' : 's'} earned this shift</p>}

            {answered.some((a) => !a.wasCorrect) && (
              <div className="debrief">
                <div className="debrief-title">Missed cases</div>
                <ul className="debrief-list">
                  {answered
                    .filter((a) => !a.wasCorrect)
                    .map((a, i) => (
                      <li key={i}>
                        <span className="debrief-case">{a.label}</span>
                        <span className="debrief-verdict">
                          {a.chosen ? `You called ${TIER_INFO[a.chosen].title}` : 'Timed out'} — should have been{' '}
                          {TIER_INFO[a.correct].title}
                        </span>
                        <span className="debrief-reason">{a.reason}</span>
                      </li>
                    ))}
                </ul>
                <p className="debrief-hint">Full case-by-case review of this shift is saved under Past Sessions.</p>
              </div>
            )}

            <button type="button" onClick={restart}>
              Choose another shift
            </button>
          </div>
        </div>
      )}

      {paused && phase === 'playing' && (
        <div className="game-over">
          <div className="game-over-card">
            <h1>Paused</h1>
            <p>The waiting room doesn't stop, but your clock does.</p>
            <button type="button" onClick={resumeGame}>
              Resume shift
            </button>
            <button type="button" className="exit-btn" onClick={restart}>
              Exit to menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
