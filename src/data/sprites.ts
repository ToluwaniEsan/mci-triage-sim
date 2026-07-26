import walking from '../assets/patients/walking.png'
import gurneyAlert from '../assets/patients/gurney-alert.png'
import gurneyBleeding from '../assets/patients/gurney-bleeding.png'
import gurneyUnconscious from '../assets/patients/gurney-unconscious.png'
import gurneyDeceased from '../assets/patients/gurney-deceased.png'

export type Sprite = 'walking' | 'gurney-alert' | 'gurney-bleeding' | 'gurney-unconscious' | 'gurney-deceased'

export const SPRITES: Record<Sprite, string> = {
  walking: walking,
  'gurney-alert': gurneyAlert,
  'gurney-bleeding': gurneyBleeding,
  'gurney-unconscious': gurneyUnconscious,
  'gurney-deceased': gurneyDeceased,
}
