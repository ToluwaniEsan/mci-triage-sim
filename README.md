# MCI Triage Shift

A mass-casualty ER triage training simulator built on the real **START** (Simple
Triage And Rapid Treatment) protocol. Patients arrive under time pressure and
you route each one to the correct door — Immediate (red), Delayed (yellow),
Minor (green), or Deceased/Expectant (black) — as fast and accurately as you
can.

Repo: https://github.com/ToluwaniEsan/mci-triage-sim

## Features

- Real START triage logic, with an explanation of the rule behind every call
- 30 diverse ER cases (trauma, asthma, burns, chemical exposure, cardiac,
  stroke, overdose, and more)
- Adaptive difficulty: five shift lengths (20–100 patients), a decision timer
  that tightens as your streak grows, and an arrival queue that speeds up
  as the shift goes on
- A waiting-room overcrowding loss condition (40+ patient shifts) alongside
  the mistake-based one
- A mid-shift "sudden deterioration" mechanic: leave a patient too long and
  their case can genuinely worsen, forcing a hard 4-second re-check
- Streak-based star achievements (40+ shifts)
- Local nurse profile, session history with a full case-by-case review
  (including the "why" for every call), and a per-device scoreboard
- Synthesized sound effects and music — no external audio files
- Pause/resume/exit controls

## Running it

```bash
npm install
npm run dev
```

Open the printed localhost URL in a browser.

## Playing it on a phone or in a VR headset

This is a normal web app, so it already works anywhere a browser does:

- **Phone**: open the deployed URL in Chrome/Safari, then "Add to Home
  Screen" — it installs like a native app (via the PWA manifest + service
  worker configured in `vite.config.ts`) and works offline after first load.
- **VR headset**: open the deployed URL in the headset's built-in browser
  (Quest Browser, Vision Pro Safari, etc.) — it runs as a flat window in VR,
  same as any website. A true immersive 3D rebuild (walkable room, hand
  tracking) is a separate future project, not this codebase.

## Building a desktop app (Windows/macOS/Linux)

This project is also wrapped in Electron:

```bash
npm run electron:start   # build + launch it locally as a desktop window
npm run electron:build   # build + package a distributable
```

`electron:build` runs on whichever OS you're on and produces that platform's
target (see the `build` field in `package.json`): a portable `.exe` on
Windows, a `.dmg` on macOS, an `AppImage` on Linux. Cross-compiling for
macOS from Windows/Linux isn't supported by electron-builder — build the
mac version on an actual Mac (or via CI).

## Tech

Vite + React + TypeScript, no external game engine or audio library. All
patient/environment art was generated for this project; all sound is
synthesized at runtime with the Web Audio API.
