export type ExerciseCategory = 'Push' | 'Pull' | 'Legs'
export type EquipmentType = 'Freeweight' | 'Machine' | 'Bodyweight'
export type RepRange = 'Strength' | 'Hypertrophy' | 'Endurance'

export interface CategoryEntry {
  category: ExerciseCategory
  volume: number
  sets: number
}

export interface EquipmentEntry {
  type: EquipmentType
  volume: number
  sets: number
}

export interface RepRangeEntry {
  range: RepRange
  volume: number
  sets: number
}

export interface DetailedMuscleEntry {
  name: string
  volume: number
  sets: number
}

export interface BalanceResult {
  muscleGroups: CategoryEntry[]
  detailedMuscles: DetailedMuscleEntry[]
  equipment: EquipmentEntry[]
  repRanges: RepRangeEntry[]
}
