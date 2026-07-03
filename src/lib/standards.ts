export interface StrengthLevels {
  beginner: number
  novice: number
  intermediate: number
  advanced: number
  elite: number
}

export type StrengthLevelName = keyof StrengthLevels

export const REFERENCE_BODYWEIGHT_KG = 75

export const STRENGTH_STANDARDS: Record<string, StrengthLevels> = {
  'Bench Press': { beginner: 49, novice: 68, intermediate: 92, advanced: 119, elite: 149 },
  Squat: { beginner: 66, novice: 91, intermediate: 122, advanced: 157, elite: 195 },
  Deadlift: { beginner: 79, novice: 108, intermediate: 142, advanced: 182, elite: 224 },
  'Incline Bench Press': { beginner: 44, novice: 62, intermediate: 89, advanced: 116, elite: 146 },
  'Overhead Press': { beginner: 31, novice: 45, intermediate: 64, advanced: 85, elite: 108 },
  'Barbell Row': { beginner: 41, novice: 60, intermediate: 85, advanced: 110, elite: 138 },
  'Front Squat': { beginner: 55, novice: 78, intermediate: 105, advanced: 135, elite: 170 },
  'Barbell Curl': { beginner: 17, novice: 30, intermediate: 47, advanced: 62, elite: 78 },
  'Decline Bench Press': { beginner: 50, novice: 72, intermediate: 106, advanced: 137, elite: 172 },
  'Dumbbell Row': { beginner: 16, novice: 27, intermediate: 43, advanced: 56, elite: 70 },
  'Dumbbell Curl': { beginner: 6.5, novice: 12, intermediate: 24, advanced: 31, elite: 39 },
}

const LEVEL_ORDER: StrengthLevelName[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']

export function getStrengthLevel(
  est1RM: number,
  bodyweightKg: number,
  exercise: string,
): { level: StrengthLevelName; nextThreshold: number | null; kgToNext: number | null } | null {
  const raw = STRENGTH_STANDARDS[exercise]
  if (!raw) return null

  const ratio = bodyweightKg / REFERENCE_BODYWEIGHT_KG
  const adjusted: StrengthLevels = {} as StrengthLevels
  for (const key of LEVEL_ORDER) {
    adjusted[key] = raw[key] * ratio
  }

  let currentLevel: StrengthLevelName = 'beginner'
  for (const key of LEVEL_ORDER) {
    if (est1RM >= adjusted[key]) {
      currentLevel = key
    }
  }

  const currentIdx = LEVEL_ORDER.indexOf(currentLevel)
  const nextIdx = currentIdx + 1
  if (nextIdx >= LEVEL_ORDER.length) {
    return { level: currentLevel, nextThreshold: null, kgToNext: null }
  }

  const nextLevel = LEVEL_ORDER[nextIdx]
  const nextThreshold = adjusted[nextLevel]
  return { level: currentLevel, nextThreshold, kgToNext: Math.round((nextThreshold - est1RM) * 10) / 10 }
}

export function getLevelColor(level: StrengthLevelName): string {
  switch (level) {
    case 'beginner':
      return 'text-zinc-400'
    case 'novice':
      return 'text-emerald-400'
    case 'intermediate':
      return 'text-sky-400'
    case 'advanced':
      return 'text-violet-400'
    case 'elite':
      return 'text-amber-400'
  }
}

export function getLevelBadgeClass(level: StrengthLevelName): string {
  switch (level) {
    case 'beginner':
      return 'bg-zinc-500/20 text-zinc-300'
    case 'novice':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'intermediate':
      return 'bg-sky-500/20 text-sky-300'
    case 'advanced':
      return 'bg-violet-500/20 text-violet-300'
    case 'elite':
      return 'bg-amber-500/20 text-amber-300'
  }
}
