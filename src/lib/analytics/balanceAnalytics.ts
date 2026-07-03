import type { ParsedData } from '../parseWorkouts'
import type { BalanceResult, ExerciseCategory, EquipmentType, RepRange, DetailedMuscleEntry } from './types'
import { classifyExerciseCategory, classifyEquipment, classifyDetailedMuscle, classifyRepRange } from './classify'

const CATEGORIES: ExerciseCategory[] = ['Push', 'Pull', 'Legs']
const EQUIPMENT_TYPES: EquipmentType[] = ['Freeweight', 'Machine', 'Bodyweight']
const REP_RANGES: RepRange[] = ['Strength', 'Hypertrophy', 'Endurance']

export function computeBalances(data: ParsedData): BalanceResult {
  const catVol = { Push: 0, Pull: 0, Legs: 0 }
  const catSets = { Push: 0, Pull: 0, Legs: 0 }
  const eqVol = { Freeweight: 0, Machine: 0, Bodyweight: 0 }
  const eqSets = { Freeweight: 0, Machine: 0, Bodyweight: 0 }
  const repVol = { Strength: 0, Hypertrophy: 0, Endurance: 0 }
  const repSets = { Strength: 0, Hypertrophy: 0, Endurance: 0 }
  const detailedVol: Record<string, number> = {}
  const detailedSets: Record<string, number> = {}

  for (const set of data.sessions.flatMap((s) => s.sets)) {
    const cat = classifyExerciseCategory(set.exercise)
    const eq = classifyEquipment(set.exercise, set.weight)
    const range = set.reps !== null ? classifyRepRange(set.reps) : null
    const { primary, synergists } = classifyDetailedMuscle(set.exercise)

    catSets[cat]++
    eqSets[eq]++
    detailedSets[primary] = (detailedSets[primary] ?? 0) + 1
    for (const syn of synergists) {
      detailedSets[syn.muscle] = (detailedSets[syn.muscle] ?? 0) + syn.weight
    }

    if (set.weight !== null && set.reps !== null) {
      const volume = set.weight * set.reps
      catVol[cat] += volume
      eqVol[eq] += volume
      if (range) repVol[range] += volume
      detailedVol[primary] = (detailedVol[primary] ?? 0) + volume
      for (const syn of synergists) {
        detailedVol[syn.muscle] = (detailedVol[syn.muscle] ?? 0) + volume * syn.weight
      }
    }
    if (range) repSets[range]++
  }

  const round = (v: number) => Math.round(v * 10) / 10

  const detailedMuscles: DetailedMuscleEntry[] = Object.entries(detailedVol)
    .map(([name, volume]) => ({ name, volume: round(volume), sets: detailedSets[name] ?? 0 }))
    .sort((a, b) => b.volume - a.volume)

  return {
    muscleGroups: CATEGORIES.map((category) => ({
      category,
      volume: round(catVol[category]),
      sets: catSets[category],
    })),
    detailedMuscles,
    equipment: EQUIPMENT_TYPES.map((type) => ({
      type,
      volume: round(eqVol[type]),
      sets: eqSets[type],
    })),
    repRanges: REP_RANGES.map((range) => ({
      range,
      volume: round(repVol[range]),
      sets: repSets[range],
    })),
  }
}
