let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + startTime)
  g.gain.setValueAtTime(gain, c.currentTime + startTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(c.currentTime + startTime)
  osc.stop(c.currentTime + startTime + duration)
}

export function playCorrect() {
  tone(660, 0, 0.12)
  tone(880, 0.09, 0.16)
}

export function playWrong() {
  tone(220, 0, 0.22, 'sawtooth', 0.12)
}

export function playStar() {
  tone(523, 0, 0.1)
  tone(659, 0.09, 0.1)
  tone(784, 0.18, 0.22)
}

export function playWin() {
  tone(523, 0, 0.15)
  tone(659, 0.15, 0.15)
  tone(784, 0.3, 0.35)
}

export function playLose() {
  tone(300, 0, 0.3, 'sawtooth', 0.12)
  tone(200, 0.25, 0.4, 'sawtooth', 0.12)
}

// --- Menu music: a slow, synthesized ambient chord loop (no external audio files) ---

const MENU_CHORDS: number[][] = [
  [220, 261.63, 329.63], // A minor
  [174.61, 220, 261.63], // F major
  [130.81, 164.81, 196], // C major (low)
  [196, 246.94, 293.66], // G major
]
const CHORD_DURATION = 8

let musicTimer: number | null = null
let musicOn = false

function playChord(notes: number[], duration: number) {
  const c = getCtx()
  if (!c) return
  notes.forEach((freq) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, c.currentTime)
    g.gain.linearRampToValueAtTime(0.035, c.currentTime + 1.5)
    g.gain.linearRampToValueAtTime(0, c.currentTime + duration)
    osc.connect(g)
    g.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration + 0.1)
  })
}

export function startMenuMusic() {
  if (musicOn) return
  musicOn = true
  let i = 0
  const cycle = () => {
    if (!musicOn) return
    playChord(MENU_CHORDS[i % MENU_CHORDS.length], CHORD_DURATION)
    i++
  }
  cycle()
  musicTimer = window.setInterval(cycle, CHORD_DURATION * 1000)
}

export function stopMenuMusic() {
  musicOn = false
  if (musicTimer) {
    window.clearInterval(musicTimer)
    musicTimer = null
  }
}

// --- Gameplay music: a quicker, driving arpeggio loop for the active shift ---

const GAME_ARPEGGIO = [392, 466.16, 523.25, 587.33, 523.25, 466.16, 392, 349.23]
const GAME_STEP_MS = 220

let gameMusicTimer: number | null = null
let gameMusicOn = false

function playBlip(freq: number, duration: number, gain: number) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + duration + 0.02)
}

export function startGameplayMusic() {
  if (gameMusicOn) return
  gameMusicOn = true
  let i = 0
  const step = () => {
    if (!gameMusicOn) return
    playBlip(GAME_ARPEGGIO[i % GAME_ARPEGGIO.length], 0.18, 0.045)
    if (i % 2 === 0) playBlip(GAME_ARPEGGIO[i % GAME_ARPEGGIO.length] / 2, 0.14, 0.03)
    i++
  }
  step()
  gameMusicTimer = window.setInterval(step, GAME_STEP_MS)
}

export function stopGameplayMusic() {
  gameMusicOn = false
  if (gameMusicTimer) {
    window.clearInterval(gameMusicTimer)
    gameMusicTimer = null
  }
}

// --- Deterioration sting: a sharp descending alarm ---

export function playDeteriorate() {
  tone(180, 0, 0.15, 'square', 0.14)
  tone(140, 0.12, 0.2, 'square', 0.14)
  tone(100, 0.28, 0.32, 'sawtooth', 0.12)
}
