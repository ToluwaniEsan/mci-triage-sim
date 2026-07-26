import { useCallback, useEffect, useRef, useState } from 'react'
import { CASES, correctTier, tierReason, escalateTier, type PatientCase, type Tier } from '../data/cases'
import { saveSession, type AnsweredCase } from './history'
import { getCurrentPlayer } from './player'
import { playCorrect, playWrong, playStar, playWin, playLose, playDeteriorate } from './sound'

const DECISION_BASE_TIME = 10
const DECISION_MIN_TIME = 4
const MAX_MISTAKES = 4
const MAX_ARRIVAL_INTERVAL = 3
const MIN_ARRIVAL_INTERVAL = 1
const FEEDBACK_PAUSE_MS = 900
// Both the overcrowding loss condition and the star achievements only apply
// once a shift is "advanced" (40+ patients) — this is that shared gate.
const ADVANCED_LEVEL_THRESHOLD = 40
const MAX_QUEUE_LENGTH = 15
const STAR_STREAK_LENGTH = 5
const STAR_PENALTY = 2
// How many patients per shift are allowed to suddenly deteriorate, by level.
// Beginner never gets it; it scales up from there.
const DETERIORATION_CAPS: Record<number, number> = { 20: 0, 40: 3, 60: 4, 80: 5, 100: 6 }
const DETERIORATION_CHECK_FRACTION = 0.6
const DETERIORATION_CHANCE = 0.35
const DETERIORATION_TIME_LIMIT = 4

export type Phase = 'select' | 'playing' | 'won' | 'lost'
export type LossReason = 'mistakes' | 'overcrowding' | null

export interface QueuedPatient extends PatientCase {
  instanceId: number
  hasDeteriorated?: boolean
}

export interface Deterioration {
  label: string
  fromTier: Tier
  toTier: Tier
}

export interface Feedback {
  chosen: Tier | null
  correct: Tier
  wasCorrect: boolean
  reason: string
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function useGame() {
  const [phase, setPhase] = useState<Phase>('select')
  const [totalPatients, setTotalPatients] = useState(20)
  const [queue, setQueue] = useState<QueuedPatient[]>([])
  const [spawnedCount, setSpawnedCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [locked, setLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DECISION_BASE_TIME)
  const [answered, setAnswered] = useState<AnsweredCase[]>([])
  const [lossReason, setLossReason] = useState<LossReason>(null)
  const [stars, setStars] = useState(0)
  const [paused, setPaused] = useState(false)
  const [deterioration, setDeterioration] = useState<Deterioration | null>(null)
  // The duration of whatever countdown is ACTUALLY running right now — normally
  // equal to the adaptive limit below, but overridden to a short window during
  // a deterioration re-check. The HUD ring needs this (not the adaptive value)
  // to show the correct fullness at the start of an urgent countdown.
  const [activeTimeLimit, setActiveTimeLimit] = useState(DECISION_BASE_TIME)

  const bagRef = useRef<PatientCase[]>([])
  const instanceCounterRef = useRef(0)
  const decisionIntervalRef = useRef<number | null>(null)
  const arrivalTimeoutRef = useRef<number | null>(null)
  const resolvedRef = useRef(false)
  const savedRef = useRef(false)
  const remainingRef = useRef(DECISION_BASE_TIME)
  const deteriorationCheckedRef = useRef<Set<number>>(new Set())
  const deteriorationsUsedRef = useRef(0)
  const deteriorationAlertTimeoutRef = useRef<number | null>(null)

  const adaptiveTimeLimit = Math.max(DECISION_MIN_TIME, DECISION_BASE_TIME - Math.floor(streak / 3))
  const current = queue[0] ?? null
  const deteriorationCap = DETERIORATION_CAPS[totalPatients] ?? 0

  const nextFromBag = useCallback((): PatientCase => {
    if (bagRef.current.length === 0) {
      bagRef.current = shuffled(CASES)
    }
    return bagRef.current.pop()!
  }, [])

  const spawnOne = useCallback(() => {
    const patient: QueuedPatient = { ...nextFromBag(), instanceId: instanceCounterRef.current++ }
    setQueue((q) => [...q, patient])
    setSpawnedCount((c) => c + 1)
  }, [nextFromBag])

  // Escalates the active patient's real vitals mid-decision and forces a hard
  // 4s re-check. Only ever applies to whoever is currently on screen.
  const triggerDeterioration = useCallback((patient: QueuedPatient) => {
    const fromTier = correctTier(patient)
    const worsened: QueuedPatient = {
      ...escalateTier(patient),
      instanceId: patient.instanceId,
      hasDeteriorated: true,
    }
    const toTier = correctTier(worsened)

    setQueue((q) => (q.length > 0 && q[0].instanceId === patient.instanceId ? [worsened, ...q.slice(1)] : q))

    remainingRef.current = DETERIORATION_TIME_LIMIT
    setTimeLeft(DETERIORATION_TIME_LIMIT)
    setActiveTimeLimit(DETERIORATION_TIME_LIMIT)
    playDeteriorate()

    if (deteriorationAlertTimeoutRef.current) window.clearTimeout(deteriorationAlertTimeoutRef.current)
    setDeterioration({ label: patient.label, fromTier, toTier })
    deteriorationAlertTimeoutRef.current = window.setTimeout(() => setDeterioration(null), 2500)
  }, [])

  const resolve = useCallback(
    (chosen: Tier | null) => {
      if (resolvedRef.current || phase !== 'playing' || !current) return
      resolvedRef.current = true
      if (decisionIntervalRef.current) window.clearInterval(decisionIntervalRef.current)

      const correct = correctTier(current)
      const wasCorrect = chosen === correct
      const reason = tierReason(current)
      setFeedback({ chosen, correct, wasCorrect, reason })

      const achievementsActive = totalPatients >= ADVANCED_LEVEL_THRESHOLD
      setAnswered((a) => [...a, { label: current.label, chosen, correct, wasCorrect, reason }])

      if (wasCorrect) {
        playCorrect()
        setCorrectCount((c) => c + 1)
        const newStreak = streak + 1
        setStreak(newStreak)
        if (achievementsActive && newStreak % STAR_STREAK_LENGTH === 0) {
          setStars((s) => s + 1)
          playStar()
        }
      } else {
        playWrong()
        setStreak(0)
        setMistakes((m) => m + 1)
        if (achievementsActive) {
          setStars((s) => Math.max(0, s - STAR_PENALTY))
        }
      }

      window.setTimeout(() => {
        setFeedback(null)
        setLocked(false)
        resolvedRef.current = false
        setQueue((q) => q.slice(1))
        setResolvedCount((r) => r + 1)
      }, FEEDBACK_PAUSE_MS)
      setLocked(true)
    },
    [current, phase, totalPatients, streak],
  )

  const selectTier = useCallback(
    (tier: Tier) => {
      if (locked || paused || phase !== 'playing') return
      resolve(tier)
    },
    [locked, paused, phase, resolve],
  )

  // Arrivals: add a new patient to the back of the queue on a variable timer.
  // Faster levels (higher totalPatients) and later progress both shrink the interval.
  useEffect(() => {
    if (phase !== 'playing' || paused || spawnedCount >= totalPatients) return

    const levelFactor = totalPatients / 100
    const progress = spawnedCount / totalPatients
    const base = MAX_ARRIVAL_INTERVAL - levelFactor * (MAX_ARRIVAL_INTERVAL - MIN_ARRIVAL_INTERVAL) * 0.6
    const target = base - progress * (base - MIN_ARRIVAL_INTERVAL)
    const jittered = target * (0.75 + Math.random() * 0.5)
    const delayMs = Math.min(MAX_ARRIVAL_INTERVAL, Math.max(MIN_ARRIVAL_INTERVAL, jittered)) * 1000

    arrivalTimeoutRef.current = window.setTimeout(spawnOne, delayMs)
    return () => {
      if (arrivalTimeoutRef.current) window.clearTimeout(arrivalTimeoutRef.current)
    }
  }, [phase, paused, spawnedCount, totalPatients, spawnOne])

  // Reset the countdown only when a genuinely new patient reaches the front —
  // pausing/resuming must NOT reset it, just freeze it in place.
  useEffect(() => {
    if (!current) return
    remainingRef.current = adaptiveTimeLimit
    setTimeLeft(adaptiveTimeLimit)
    setActiveTimeLimit(adaptiveTimeLimit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.instanceId])

  // Decision countdown for the patient at the front of the queue.
  useEffect(() => {
    if (phase !== 'playing' || paused || locked || !current) return
    const start = Date.now()
    const startingRemaining = remainingRef.current
    decisionIntervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const left = Math.max(0, startingRemaining - elapsed)
      remainingRef.current = left
      setTimeLeft(left)

      const eligible =
        !current.hasDeteriorated &&
        !deteriorationCheckedRef.current.has(current.instanceId) &&
        deteriorationsUsedRef.current < deteriorationCap &&
        correctTier(current) !== 'black' &&
        elapsed >= startingRemaining * DETERIORATION_CHECK_FRACTION &&
        left > 0.5

      if (eligible) {
        deteriorationCheckedRef.current.add(current.instanceId)
        if (Math.random() < DETERIORATION_CHANCE) {
          deteriorationsUsedRef.current += 1
          triggerDeterioration(current)
          return
        }
      }

      if (left <= 0) resolve(null)
    }, 100)
    return () => {
      if (decisionIntervalRef.current) window.clearInterval(decisionIntervalRef.current)
    }
  }, [phase, paused, locked, current, resolve, deteriorationCap, triggerDeterioration])

  useEffect(() => {
    if (phase !== 'playing') return
    if (mistakes >= MAX_MISTAKES) {
      setLossReason('mistakes')
      setPhase('lost')
    } else if (totalPatients >= ADVANCED_LEVEL_THRESHOLD && queue.length >= MAX_QUEUE_LENGTH) {
      setLossReason('overcrowding')
      setPhase('lost')
    } else if (resolvedCount >= totalPatients && totalPatients > 0) {
      setPhase('won')
    }
  }, [mistakes, resolvedCount, totalPatients, phase, queue.length])

  // Persist a record of the shift the moment it ends, so history survives a refresh.
  useEffect(() => {
    if (phase !== 'won' && phase !== 'lost') return
    if (savedRef.current) return
    savedRef.current = true
    if (phase === 'won') playWin()
    else playLose()
    saveSession({
      playerName: getCurrentPlayer() ?? 'Unknown',
      totalPatients,
      correctCount,
      resolvedCount,
      mistakes,
      outcome: phase,
      answered,
      starsEarned: stars,
    })
  }, [phase, totalPatients, correctCount, resolvedCount, mistakes, answered, stars])

  const startLevel = useCallback((n: number) => {
    // instanceCounterRef is intentionally NOT reset here — instance ids stay
    // unique for the life of the page. Reusing ids across shifts (e.g. if a
    // shift is exited before its first patient resolves) would make the
    // "did this patient's id already run its timer-reset effect" check below
    // see no change and skip resetting the clock for the next shift's patient.
    bagRef.current = shuffled(CASES)
    const first: QueuedPatient = { ...bagRef.current.pop()!, instanceId: instanceCounterRef.current++ }
    setTotalPatients(n)
    setQueue([first])
    setSpawnedCount(1)
    setResolvedCount(0)
    setCorrectCount(0)
    setMistakes(0)
    setStreak(0)
    setFeedback(null)
    setLocked(false)
    setAnswered([])
    setLossReason(null)
    setStars(0)
    setPaused(false)
    setDeterioration(null)
    setTimeLeft(DECISION_BASE_TIME)
    setActiveTimeLimit(DECISION_BASE_TIME)
    remainingRef.current = DECISION_BASE_TIME
    deteriorationCheckedRef.current = new Set()
    deteriorationsUsedRef.current = 0
    resolvedRef.current = false
    savedRef.current = false
    setPhase('playing')
  }, [])

  const restart = useCallback(() => {
    setPaused(false)
    setPhase('select')
  }, [])

  const pauseGame = useCallback(() => setPaused(true), [])
  const resumeGame = useCallback(() => setPaused(false), [])

  return {
    phase,
    totalPatients,
    queue,
    current,
    timeLeft,
    timeLimit: activeTimeLimit,
    correctCount,
    resolvedCount,
    mistakes,
    maxMistakes: MAX_MISTAKES,
    feedback,
    answered,
    lossReason,
    maxQueueLength: MAX_QUEUE_LENGTH,
    queueDangerActive: totalPatients >= ADVANCED_LEVEL_THRESHOLD,
    stars,
    achievementsActive: totalPatients >= ADVANCED_LEVEL_THRESHOLD,
    paused,
    pauseGame,
    resumeGame,
    deterioration,
    selectTier,
    startLevel,
    restart,
  }
}
