const PLAYER_KEY = 'mci-triage-player'

export function getCurrentPlayer(): string | null {
  try {
    return localStorage.getItem(PLAYER_KEY)
  } catch {
    return null
  }
}

export function setCurrentPlayer(name: string): void {
  try {
    localStorage.setItem(PLAYER_KEY, name)
  } catch {
    // storage unavailable — name just won't persist across reloads this session
  }
}

export function clearCurrentPlayer(): void {
  try {
    localStorage.removeItem(PLAYER_KEY)
  } catch {
    // ignore
  }
}
