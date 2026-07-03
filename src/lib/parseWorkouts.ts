import Papa from 'papaparse'

export interface CsvRow {
  workout: string
  start: string
  end: string
  exercise: string
  weight: string
  bodyweight: string
  reps: string
  warmup: string
  max: string
  fail: string
  [key: string]: string
}

export interface ParsedSet {
  exercise: string
  weight: number | null
  reps: number | null
  volume: number
  startTime: number
  endTime: number
  warmup: boolean
  max: boolean
  fail: boolean
  bodyweight: number | null
}

export interface WorkoutSession {
  name: string
  startTime: number
  endTime: number
  sets: ParsedSet[]
}

export interface Anomalies {
  highReps: { exercise: string; reps: number; weight: number | null; start: number }[]
  missingWeight: { exercise: string; reps: number; start: number }[]
  missingReps: { exercise: string; weight: number | null; start: number }[]
}

export interface ExerciseStats {
  name: string
  setCount: number
  totalVolume: number
  best1RM: number
}

export interface WeeklyVolume {
  weekStart: string
  totalVolume: number
}

export interface MonthlyFrequency {
  month: string
  count: number
}

export interface LiftProgressionPoint {
  date: number
  est1RM: number
  weight: number
  reps: number
}

export interface ParsedData {
  sessions: WorkoutSession[]
  totalWorkouts: number
  totalSets: number
  totalVolume: number
  avgSessionMinutes: number
  dateRange: { start: Date; end: Date }
  anomalies: Anomalies
  exerciseStats: ExerciseStats[]
  weeklyVolume: WeeklyVolume[]
  monthlyFrequency: MonthlyFrequency[]
  liftProgression: Record<string, LiftProgressionPoint[]>
}

function parseBool(val: string): boolean {
  return val === 'true'
}

export function parseCsv(raw: string): ParsedData {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  const rows = result.data as CsvRow[]

  const anomalies: Anomalies = { highReps: [], missingWeight: [], missingReps: [] }

  const parsedSets: ParsedSet[] = []
  const sessionMap = new Map<number, ParsedSet[]>()

  for (const row of rows) {
    const startTime = parseInt(row.start, 10)
    const endTime = parseInt(row.end, 10)
    const repsRaw = row.reps?.trim()
    const weightRaw = row.weight?.trim()
    const reps = repsRaw ? parseInt(repsRaw, 10) : null
    const weight = weightRaw ? parseFloat(weightRaw) : null

    if (reps !== null && reps > 50) {
      anomalies.highReps.push({ exercise: row.exercise, reps, weight, start: startTime })
    }
    if (reps === null) {
      anomalies.missingReps.push({ exercise: row.exercise, weight, start: startTime })
    }
    if (weight === null && reps !== null && reps > 0) {
      anomalies.missingWeight.push({ exercise: row.exercise, reps, start: startTime })
    }

    const set: ParsedSet = {
      exercise: row.exercise,
      weight,
      reps,
      volume: (weight ?? 0) * (reps ?? 0),
      startTime,
      endTime,
      warmup: parseBool(row.warmup),
      max: parseBool(row.max),
      fail: parseBool(row.fail),
      bodyweight: row.bodyweight?.trim() ? parseFloat(row.bodyweight) : null,
    }

    parsedSets.push(set)

    if (!sessionMap.has(startTime)) {
      sessionMap.set(startTime, [])
    }
    sessionMap.get(startTime)!.push(set)
  }

  const sessions: WorkoutSession[] = []
  for (const [startTime, sets] of sessionMap) {
    const endTime = Math.max(...sets.map((s) => s.endTime))
    sessions.push({
      name: sets[0].exercise === '' ? 'Unknown' : sets[0].exercise,
      startTime,
      endTime,
      sets,
    })
  }

  const sessionNames = new Map<number, string>()
  for (const row of rows) {
    const st = parseInt(row.start, 10)
    if (!sessionNames.has(st)) {
      sessionNames.set(st, row.workout || 'Unknown')
    }
  }
  for (const s of sessions) {
    s.name = sessionNames.get(s.startTime) || s.name
  }

  sessions.sort((a, b) => a.startTime - b.startTime)

  const totalSets = parsedSets.length
  const totalVolume = parsedSets.reduce((sum, s) => sum + s.volume, 0)
  const totalWorkouts = sessions.length

  const durations = sessions.map((s) => (s.endTime - s.startTime) / 60000)
  const avgSessionMinutes =
    durations.length > 0
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : 0

  const timestamps = sessions.map((s) => s.startTime)
  const dateRange = {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
  }

  const exerciseMap = new Map<string, { setCount: number; totalVolume: number; best1RM: number }>()
  const liftProgressionMap = new Map<string, LiftProgressionPoint[]>()

  for (const s of parsedSets) {
    if (!s.exercise) continue

    const existing = exerciseMap.get(s.exercise)
    const vol = s.volume
    let est1RM = 0
    if (s.weight !== null && s.reps !== null && s.reps <= 12 && s.reps > 0 && s.weight > 0) {
      est1RM = s.weight * (1 + s.reps / 30)
    }

    if (existing) {
      existing.setCount++
      existing.totalVolume += vol
      if (est1RM > existing.best1RM) existing.best1RM = est1RM
    } else {
      exerciseMap.set(s.exercise, { setCount: 1, totalVolume: vol, best1RM: est1RM })
    }

    if (est1RM > 0 && s.weight !== null && s.reps !== null) {
      const key = s.exercise
      if (!liftProgressionMap.has(key)) liftProgressionMap.set(key, [])
      liftProgressionMap.get(key)!.push({
        date: s.startTime,
        est1RM,
        weight: s.weight,
        reps: s.reps,
      })
    }
  }

  const exerciseStats: ExerciseStats[] = []
  for (const [name, stats] of exerciseMap) {
    exerciseStats.push({ name, ...stats })
  }
  exerciseStats.sort((a, b) => b.setCount - a.setCount)

  const liftProgression: Record<string, LiftProgressionPoint[]> = {}
  for (const [name, points] of liftProgressionMap) {
    const bySession = new Map<number, LiftProgressionPoint>()
    for (const p of points) {
      const existing = bySession.get(p.date)
      if (!existing || p.est1RM > existing.est1RM) {
        bySession.set(p.date, p)
      }
    }
    const sorted = Array.from(bySession.values()).sort((a, b) => a.date - b.date)
    liftProgression[name] = sorted
  }

  const weeklyMap = new Map<string, number>()
  for (const s of parsedSets) {
    const d = new Date(s.startTime)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const key = monday.toISOString().slice(0, 10)
    weeklyMap.set(key, (weeklyMap.get(key) || 0) + s.volume)
  }
  const weeklyVolume: WeeklyVolume[] = Array.from(weeklyMap.entries())
    .map(([weekStart, totalVolume]) => ({ weekStart, totalVolume }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))

  const monthlyMap = new Map<string, Set<number>>()
  for (const s of sessions) {
    const d = new Date(s.startTime)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyMap.has(key)) monthlyMap.set(key, new Set())
    monthlyMap.get(key)!.add(s.startTime)
  }
  const monthlyFrequency: MonthlyFrequency[] = Array.from(monthlyMap.entries())
    .map(([month, starts]) => ({ month, count: starts.size }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return {
    sessions,
    totalWorkouts,
    totalSets,
    totalVolume: Math.round(totalVolume * 10) / 10,
    avgSessionMinutes,
    dateRange,
    anomalies,
    exerciseStats,
    weeklyVolume,
    monthlyFrequency,
    liftProgression,
  }
}

export function isBarbellExercise(name: string): boolean {
  const barbellKeywords = [
    'bench press',
    'squat',
    'deadlift',
    'overhead press',
    'barbell row',
    'incline bench',
    'decline bench',
    'front squat',
    'barbell curl',
    'barbell',
  ]
  const lower = name.toLowerCase()
  return barbellKeywords.some((kw) => lower.includes(kw))
}
