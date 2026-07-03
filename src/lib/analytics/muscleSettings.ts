const EXERCISE_MUSCLE_OVERRIDE_KEY = 'exercise-muscle-overrides'
const EXERCISE_SYNERGIST_OVERRIDE_KEY = 'exercise-synergist-overrides'
const DEFAULT_SYNERGIST_WEIGHT_KEY = 'default-synergist-weight'
const VERSION_KEY = 'muscle-rules-version'
const VERSION = 5

function storageAvailable(): boolean {
  try {
    const k = '__test__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

function getSettingsVersion(): number {
  if (!storageAvailable()) return 0
  const v = localStorage.getItem(VERSION_KEY)
  return v ? parseInt(v, 10) : 0
}

export function ensureVersion(): void {
  if (!storageAvailable()) return
  if (getSettingsVersion() !== VERSION) {
    localStorage.clear()
    localStorage.setItem(VERSION_KEY, String(VERSION))
  }
}

export function loadExerciseMuscleOverrides(): Record<string, string[]> {
  if (!storageAvailable()) return {}
  const saved = localStorage.getItem(EXERCISE_MUSCLE_OVERRIDE_KEY)
  if (!saved) return {}
  try {
    return JSON.parse(saved)
  } catch {
    return {}
  }
}

export function saveExerciseMuscleOverrides(overrides: Record<string, string[]>): void {
  if (!storageAvailable()) return
  localStorage.setItem(EXERCISE_MUSCLE_OVERRIDE_KEY, JSON.stringify(overrides))
}

export function loadExerciseSynergistOverrides(): Record<string, { muscle: string; weight: number }[]> {
  if (!storageAvailable()) return {}
  const saved = localStorage.getItem(EXERCISE_SYNERGIST_OVERRIDE_KEY)
  if (!saved) return {}
  try {
    return JSON.parse(saved)
  } catch {
    return {}
  }
}

export function saveExerciseSynergistOverrides(overrides: Record<string, { muscle: string; weight: number }[]>): void {
  if (!storageAvailable()) return
  localStorage.setItem(EXERCISE_SYNERGIST_OVERRIDE_KEY, JSON.stringify(overrides))
}

export function loadDefaultSynergistWeight(): number {
  if (!storageAvailable()) return 0.5
  const saved = localStorage.getItem(DEFAULT_SYNERGIST_WEIGHT_KEY)
  if (saved === null) return 0.5
  const num = parseFloat(saved)
  return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num))
}

export function saveDefaultSynergistWeight(weight: number): void {
  if (!storageAvailable()) return
  localStorage.setItem(DEFAULT_SYNERGIST_WEIGHT_KEY, String(Math.max(0, Math.min(1, weight))))
}

