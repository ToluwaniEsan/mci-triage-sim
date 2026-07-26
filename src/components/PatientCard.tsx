import type { PatientCase } from '../data/cases'
import { SPRITES } from '../data/sprites'

const BREATHING_LABEL: Record<PatientCase['breathing'], string> = {
  none: 'Not breathing',
  labored: 'Fast / labored breathing',
  normal: 'Breathing normally',
}

const BLEEDING_LABEL: Record<PatientCase['bleeding'], string> = {
  severe: 'Severe bleeding',
  moderate: 'Moderate bleeding',
  none: 'No significant bleeding',
}

interface PatientCardProps {
  patient: PatientCase
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <div className="patient-card">
      <img className="patient-portrait" src={SPRITES[patient.sprite]} alt={patient.label} />
      <div className="patient-card-body">
        <div className="patient-card-head">
          <span className="patient-label">{patient.label}</span>
          <span className="patient-age">{patient.age}y</span>
        </div>
        <p className="patient-note">{patient.note}</p>
        <ul className="patient-vitals">
          <li>{patient.canWalk ? 'Walking' : 'Not ambulatory'}</li>
          <li>{BREATHING_LABEL[patient.breathing]}</li>
          <li>{patient.consciousness === 'conscious' ? 'Conscious' : 'Unconscious'}</li>
          <li>{BLEEDING_LABEL[patient.bleeding]}</li>
        </ul>
      </div>
    </div>
  )
}
