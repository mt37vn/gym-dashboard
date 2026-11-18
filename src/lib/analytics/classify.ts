import type { ExerciseCategory, EquipmentType, RepRange } from './types'
import { MUSCLE_RULES, RAW_MAP } from './muscleConfig'
import { loadExerciseMuscleOverrides, loadExerciseSynergistOverrides, loadDefaultSynergistWeight, ensureVersion } from './muscleSettings'

type DetailedMuscleResult = {
  primary: string
  secondary: string | null
  tertiary: string | null
  synergists: { muscle: string; weight: number }[]
}

const CACHE_CAT = new Map<string, ExerciseCategory>()
const CACHE_EQ = new Map<string, EquipmentType>()
const CACHE_MUSCLE = new Map<string, DetailedMuscleResult>()

export function clearDetailedMuscleCache(): void {
  CACHE_MUSCLE.clear()
}

export function classifyExerciseCategory(name: string): ExerciseCategory {
  if (!name) return 'Legs'
  const cached = CACHE_CAT.get(name)
  if (cached) return cached

  const lower = name.toLowerCase()

  if (/\b(bench|press(?!.*leg|.*calf|.*pull|.*lat)|dip\b|push[-\s]?up|tricep|chest fly|shoulder press|arnold)\b/i.test(lower)) {
    CACHE_CAT.set(name, 'Push')
    return 'Push'
  }
  if (/(lat pulldown|row\b|curl\b|chin[-\s]?up|face pull|rear delt|upright row|pullover|good morning|pull[-\s]?up)/i.test(lower)) {
    CACHE_CAT.set(name, 'Pull')
    return 'Pull'
  }

  CACHE_CAT.set(name, 'Legs')
  return 'Legs'
}

export function classifyEquipment(name: string, weight: number | null): EquipmentType {
  if (!name) return 'Bodyweight'
  const cached = CACHE_EQ.get(name)
  if (cached) return cached

  const lower = name.toLowerCase()

  const hasWeight = weight !== null && weight > 0

  if (/\b(machine|cable|smith|leverage)\b/i.test(lower)) {
    CACHE_EQ.set(name, 'Machine')
    return 'Machine'
  }

  const bodyweightPatterns = /\b(bodyweight|hanging leg|plank|crunche?|pull[-\s]?up|chin[-\s]?up|push[-\s]?up|dip\b|bar hang|y rise|lying leg raise|ab bench|ab wheel)\b/i
  if (!hasWeight || bodyweightPatterns.test(lower)) {
    CACHE_EQ.set(name, 'Bodyweight')
    return 'Bodyweight'
  }

  CACHE_EQ.set(name, 'Freeweight')
  return 'Freeweight'
}

export function classifyDetailedMuscle(name: string): DetailedMuscleResult {
  if (!name) return { primary: 'Other', secondary: null, tertiary: null, synergists: [] }
  const cached = CACHE_MUSCLE.get(name)
  if (cached) return cached

  ensureVersion()

  const exerciseMuscleOverride = loadExerciseMuscleOverrides()
  const exerciseSynergistOverride = loadExerciseSynergistOverrides()
  const defaultWeight = loadDefaultSynergistWeight()

  const overriddenMuscles = exerciseMuscleOverride[name]
  const synergistOverride = exerciseSynergistOverride[name]

  if (overriddenMuscles && overriddenMuscles.length > 0) {
    const rawEntry = RAW_MAP[name]
    const extraPrimaries = overriddenMuscles.slice(1).map(m => ({ muscle: m, weight: 1 }))
    const secondaries = synergistOverride ?? (rawEntry ? rawEntry.secondaryMuscles.map(m => ({ muscle: m, weight: defaultWeight })) : [])
    const synergists = [...extraPrimaries, ...secondaries]
    const result = {
      primary: overriddenMuscles[0],
      secondary: synergists[0]?.muscle || null,
      tertiary: synergists[1]?.muscle || null,
      synergists,
    }
    CACHE_MUSCLE.set(name, result)
    return result
  }

  const rawEntry = RAW_MAP[name] || RAW_MAP[Object.keys(RAW_MAP).find(k => k.toLowerCase() === name.toLowerCase()) || '']
  if (rawEntry) {
    const primary = rawEntry.primaryMuscles[0] || 'Other'
    const extraPrimaries = rawEntry.primaryMuscles.slice(1).map(m => ({ muscle: m, weight: 1 }))
    const secondaries = synergistOverride ?? rawEntry.secondaryMuscles.map(m => ({ muscle: m, weight: defaultWeight }))
    const synergists = [...extraPrimaries, ...secondaries]
    const result = {
      primary,
      secondary: synergists[0]?.muscle || null,
      tertiary: synergists[1]?.muscle || null,
      synergists,
    }
    CACHE_MUSCLE.set(name, result)
    return result
  }

  for (const rule of MUSCLE_RULES) {
    if (rule.pattern.test(name)) {
      const synergists: { muscle: string; weight: number }[] = []
      if (rule.secondary) synergists.push({ muscle: rule.secondary, weight: defaultWeight })
      if (rule.tertiary) synergists.push({ muscle: rule.tertiary, weight: defaultWeight })
      const result = {
        primary: rule.primary,
        secondary: rule.secondary ?? null,
        tertiary: rule.tertiary ?? null,
        synergists,
      }
      CACHE_MUSCLE.set(name, result)
      return result
    }
  }

  const fallback = { primary: 'Other', secondary: null, tertiary: null, synergists: [] }
  CACHE_MUSCLE.set(name, fallback)
  return fallback
}

export function classifyRepRange(reps: number): RepRange {
  if (reps >= 1 && reps <= 5) return 'Strength'
  if (reps >= 6 && reps <= 12) return 'Hypertrophy'
  return 'Endurance'
}
