import type { Sprite } from './sprites'

export type Tier = 'red' | 'yellow' | 'green' | 'black'

export interface PatientCase {
  id: string
  label: string
  age: number
  note: string
  canWalk: boolean
  breathing: 'none' | 'labored' | 'normal'
  consciousness: 'unconscious' | 'conscious'
  bleeding: 'severe' | 'moderate' | 'none'
  sprite: Sprite
}

export const TIER_INFO: Record<Tier, { title: string; short: string }> = {
  red: { title: 'Immediate', short: 'RED' },
  yellow: { title: 'Delayed', short: 'YELLOW' },
  green: { title: 'Minor', short: 'GREEN' },
  black: { title: 'Deceased / Expectant', short: 'BLACK' },
}

// Simplified START (Simple Triage And Rapid Treatment) algorithm:
// 1. Walking wounded -> GREEN
// 2. Not breathing -> BLACK
// 3. Labored/fast breathing, severe bleeding, or unconscious -> RED
// 4. Everything else -> YELLOW
export function correctTier(p: PatientCase): Tier {
  if (p.canWalk) return 'green'
  if (p.breathing === 'none') return 'black'
  if (p.breathing === 'labored' || p.bleeding === 'severe' || p.consciousness === 'unconscious') {
    return 'red'
  }
  return 'yellow'
}

// Mirrors the branching in correctTier() so the explanation always matches
// the specific rule that decided the tier.
export function tierReason(p: PatientCase): string {
  if (p.canWalk) {
    return 'Ambulatory patients are triaged Green — Minor — regardless of other injuries.'
  }
  if (p.breathing === 'none') {
    return 'No breathing, even after repositioning the airway, means Black — Expectant.'
  }
  if (p.breathing === 'labored') {
    return 'Labored or rapid breathing in a non-ambulatory patient means Red — Immediate.'
  }
  if (p.bleeding === 'severe') {
    return 'Severe bleeding signals poor perfusion — Red — Immediate.'
  }
  if (p.consciousness === 'unconscious') {
    return "Can't follow commands means Red — Immediate."
  }
  return "Breathing fine, conscious, no severe bleeding, but can't walk — Yellow — Delayed."
}

function spriteFor(p: PatientCase): Sprite {
  if (p.canWalk) return 'walking'
  if (p.breathing === 'none') return 'gurney-deceased'
  if (p.consciousness === 'unconscious') return 'gurney-unconscious'
  if (p.bleeding !== 'none') return 'gurney-bleeding'
  return 'gurney-alert'
}

const DETERIORATION_NOTES = [
  "Their condition just took a sudden turn for the worse.",
  'Vitals just crashed — this changes everything.',
  "They're going downhill fast — reassess now.",
]

// Pushes a patient one real severity step worse by mutating the underlying
// vitals (not just relabeling the tier), so the correct answer genuinely
// changes. Which field flips is randomized, so e.g. green can jump straight
// to red rather than always stepping through yellow.
export function escalateTier(p: PatientCase): PatientCase {
  const tier = correctTier(p)
  let next: PatientCase

  if (tier === 'green') {
    next = Math.random() < 0.5 ? { ...p, canWalk: false } : { ...p, canWalk: false, breathing: 'labored' }
  } else if (tier === 'yellow') {
    const flips: Array<Partial<PatientCase>> = [
      { breathing: 'labored' },
      { bleeding: 'severe' },
      { consciousness: 'unconscious' },
    ]
    next = { ...p, ...flips[Math.floor(Math.random() * flips.length)] }
  } else if (tier === 'red') {
    next = { ...p, breathing: 'none' }
  } else {
    next = p
  }

  return {
    ...next,
    sprite: spriteFor(next),
    note: DETERIORATION_NOTES[Math.floor(Math.random() * DETERIORATION_NOTES.length)],
  }
}

export const CASES: PatientCase[] = [
  {
    id: 'c1',
    label: 'Ankle injury',
    age: 27,
    note: 'Walking on their own, wincing, small scrape on the shin.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c2',
    label: 'Cardiac arrest',
    age: 61,
    note: 'On the ground, no chest movement, no response to voice.',
    canWalk: false,
    breathing: 'none',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-deceased',
  },
  {
    id: 'c3',
    label: 'Crush injury',
    age: 34,
    note: 'Pinned leg freed, gasping for air, heavy bleeding from thigh.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'severe',
    sprite: 'gurney-bleeding',
  },
  {
    id: 'c4',
    label: 'Broken arm',
    age: 45,
    note: 'Sitting up, breathing steady, arm at a wrong angle, alert.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c5',
    label: 'Minor laceration',
    age: 19,
    note: 'Walked in holding a bandaged hand, talking normally.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'moderate',
    sprite: 'walking',
  },
  {
    id: 'c6',
    label: 'Head injury',
    age: 52,
    note: 'Breathing fine on their own, but not responding to questions.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-unconscious',
  },
  {
    id: 'c7',
    label: 'Deep laceration',
    age: 39,
    note: 'Alert, breathing normal, blood soaking through the wrap fast.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'severe',
    sprite: 'gurney-bleeding',
  },
  {
    id: 'c8',
    label: 'No pulse, no breath',
    age: 70,
    note: 'Found unresponsive, chest still, airway repositioned already.',
    canWalk: false,
    breathing: 'none',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-deceased',
  },
  {
    id: 'c9',
    label: 'Sprained knee',
    age: 22,
    note: 'Limping in under their own power, otherwise unremarkable.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c10',
    label: 'Chest trauma',
    age: 48,
    note: 'Can’t stand, breathing fast and shallow, alert and scared.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c11',
    label: 'Severe asthma attack',
    age: 16,
    note: 'Wheezing badly, inhaler giving no relief, hunched forward gasping for air.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c12',
    label: 'Mild asthma flare',
    age: 24,
    note: 'Walked in clutching an inhaler, light wheeze, speaking in full sentences.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c13',
    label: 'Grease burn',
    age: 31,
    note: 'Walked in after a grease splash, blistered burn on the forearm, alert and upset.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c14',
    label: 'House fire burns',
    age: 29,
    note: 'Pulled from a house fire, extensive burns on the torso, coughing, breathing raspy.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c15',
    label: 'Chemical eye splash',
    age: 26,
    note: 'Walked in with eyes streaming after a lab chemical splash, in pain but mobile.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c16',
    label: 'Chemical gas exposure',
    age: 44,
    note: 'Found collapsed near a chemical leak, breathing shallow and fast, unresponsive to voice.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-unconscious',
  },
  {
    id: 'c17',
    label: 'Post-seizure',
    age: 37,
    note: 'Just finished seizing, drowsy and confused but breathing steadily on the stretcher.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c18',
    label: 'Severe hypoglycemia',
    age: 58,
    note: 'Found unresponsive at home, suspected low blood sugar, breathing on their own.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-unconscious',
  },
  {
    id: 'c19',
    label: 'Mild hypoglycemia',
    age: 63,
    note: 'Walked in shaky and sweating, says they forgot to eat, alert and talking.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c20',
    label: 'Suspected stroke',
    age: 67,
    note: 'Sudden facial drooping and slurred speech, alert but can’t move one arm.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c21',
    label: 'Suspected heart attack',
    age: 54,
    note: 'Clutching chest, sweating, short of breath, alert and frightened.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c22',
    label: 'Anaphylaxis',
    age: 20,
    note: 'Face and throat swelling fast after a bee sting, wheezing with every breath.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c23',
    label: 'Mild allergic reaction',
    age: 33,
    note: 'Walked in covered in hives after eating shellfish, breathing fine, itchy.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c24',
    label: 'Gunshot wound',
    age: 25,
    note: 'Gunshot to the abdomen, conscious and terrified, soaking through the dressing fast.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'severe',
    sprite: 'gurney-bleeding',
  },
  {
    id: 'c25',
    label: 'Stab wound',
    age: 30,
    note: 'Stabbed in the thigh during a fight, alert, bleeding controlled with pressure.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'moderate',
    sprite: 'gurney-bleeding',
  },
  {
    id: 'c26',
    label: 'Fall from height',
    age: 41,
    note: 'Fell two stories, breathing on their own but won’t wake up.',
    canWalk: false,
    breathing: 'normal',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-unconscious',
  },
  {
    id: 'c27',
    label: 'Twisted ankle',
    age: 18,
    note: 'Tripped on the stairs, walked in limping slightly, otherwise fine.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
  {
    id: 'c28',
    label: 'Opioid overdose',
    age: 36,
    note: 'Found down, not breathing, needle nearby, naloxone already tried once.',
    canWalk: false,
    breathing: 'none',
    consciousness: 'unconscious',
    bleeding: 'none',
    sprite: 'gurney-deceased',
  },
  {
    id: 'c29',
    label: 'Stimulant overdose',
    age: 28,
    note: 'Agitated and sweating after taking an unknown pill, heart racing, breathing fast.',
    canWalk: false,
    breathing: 'labored',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'gurney-alert',
  },
  {
    id: 'c30',
    label: 'Smoke inhalation',
    age: 21,
    note: 'Walked out of a smoky building coughing, breathing okay now, alert.',
    canWalk: true,
    breathing: 'normal',
    consciousness: 'conscious',
    bleeding: 'none',
    sprite: 'walking',
  },
]
