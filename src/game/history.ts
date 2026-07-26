import type { Tier } from '../data/cases'

// One entry per patient the nurse actually answered (or timed out on) during
// a shift — correct calls included, not just the misses — so the full case
// log can be reviewed later at reading pace, not just in-game where the
// explanation flashes by fast.
export interface AnsweredCase {
  label: string
  chosen: Tier | null
  correct: Tier
  wasCorrect: boolean
  reason: string
}

export interface SessionRecord {
  id: string
  timestamp: number
  playerName: string
  totalPatients: number
  correctCount: number
  resolvedCount: number
  mistakes: number
  outcome: 'won' | 'lost'
  answered: AnsweredCase[]
  starsEarned: number
}

const STORAGE_KEY = 'mci-triage-history'
const MAX_RECORDS = 50

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : []
  } catch {
    return []
  }
}

export function saveSession(record: Omit<SessionRecord, 'id' | 'timestamp'>): SessionRecord {
  const full: SessionRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  }
  const next = [full, ...loadHistory()].slice(0, MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable/full — the session still played out fine, just isn't persisted
  }
  return full
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export interface PlayerStats {
  name: string
  shifts: number
  totalCorrect: number
  totalResolved: number
  accuracy: number
  bestLevel: number
  bestStars: number
  lastPlayed: number
}

// Ranked by total correct triages (rewards both volume and accuracy), tie-broken by accuracy.
export function computeScoreboard(records: SessionRecord[]): PlayerStats[] {
  const byName = new Map<string, SessionRecord[]>()
  for (const r of records) {
    const list = byName.get(r.playerName) ?? []
    list.push(r)
    byName.set(r.playerName, list)
  }

  const stats: PlayerStats[] = []
  for (const [name, recs] of byName) {
    const totalCorrect = recs.reduce((s, r) => s + r.correctCount, 0)
    const totalResolved = recs.reduce((s, r) => s + r.resolvedCount, 0)
    const bestLevel = recs.filter((r) => r.outcome === 'won').reduce((m, r) => Math.max(m, r.totalPatients), 0)
    const bestStars = recs.reduce((m, r) => Math.max(m, r.starsEarned ?? 0), 0)
    const lastPlayed = recs.reduce((m, r) => Math.max(m, r.timestamp), 0)
    stats.push({
      name,
      shifts: recs.length,
      totalCorrect,
      totalResolved,
      accuracy: totalResolved === 0 ? 0 : Math.round((totalCorrect / totalResolved) * 100),
      bestLevel,
      bestStars,
      lastPlayed,
    })
  }

  return stats.sort((a, b) => b.totalCorrect - a.totalCorrect || b.accuracy - a.accuracy)
}
