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
  best5RM: number
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
  est5RM: number
  weight: number
  reps: number
}

export interface DailyFrequency {
  date: string
  count: number
}

export interface DailyVolume {
  date: string
  totalVolume: number
}

export type Period = '4w' | '8w' | '12w' | 'this-year' | 'last-year' | 'all'

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
  dailyFrequency: DailyFrequency[]
  dailyVolume: DailyVolume[]
  liftProgression: Record<string, LiftProgressionPoint[]>
}

function parseBool(val: string): boolean {
  return val === 'true'
}

const REP_PRIORITY: Record<number, number> = { 5: 3, 10: 2, 15: 1 }

function repScore(reps: number): number {
  return REP_PRIORITY[reps] ?? 0
}

function compareStrength(a: LiftProgressionPoint, b: LiftProgressionPoint): number {
  const pa = repScore(a.reps)
  const pb = repScore(b.reps)
  if (pa !== pb) return pb - pa
  return b.est5RM - a.est5RM
}

function computeStats(sessions: WorkoutSession[], allSets: ParsedSet[]) {
  const totalSets = allSets.length
  const totalVolume = allSets.reduce((sum, s) => sum + s.volume, 0)
  const totalWorkouts = sessions.length

  const durations = sessions.map((s) => (s.endTime - s.startTime) / 60000)
  const avgSessionMinutes = durations.length > 0
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0

  const timestamps = sessions.map((s) => s.startTime)
  const dateRange = {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
  }

  const bestPerExercise = new Map<string, { setCount: number; totalVolume: number; bestWeight: number; bestPriority: number }>()
  const liftMap = new Map<string, LiftProgressionPoint[]>()

  for (const s of allSets) {
    if (!s.exercise) continue
    const vol = s.volume
    const prio = s.reps !== null ? REP_PRIORITY[s.reps] ?? 0 : 0
    const realWeight = prio > 0 && s.weight !== null && s.weight > 0 ? s.weight : 0

    const existing = bestPerExercise.get(s.exercise)
    if (existing) {
      existing.setCount++
      existing.totalVolume += vol
      if (realWeight > 0) {
        if (prio > existing.bestPriority || (prio === existing.bestPriority && realWeight > existing.bestWeight)) {
          existing.bestWeight = realWeight
          existing.bestPriority = prio
        }
      }
    } else {
      bestPerExercise.set(s.exercise, { setCount: 1, totalVolume: vol, bestWeight: realWeight, bestPriority: prio })
    }

    if (realWeight > 0) {
      const key = s.exercise
      if (!liftMap.has(key)) liftMap.set(key, [])
      liftMap.get(key)!.push({ date: s.startTime, est5RM: realWeight, weight: s.weight!, reps: s.reps! })
    }
  }

  const exerciseStats: ExerciseStats[] = []
  for (const [name, { setCount, totalVolume, bestWeight }] of bestPerExercise) {
    exerciseStats.push({ name, setCount, totalVolume, best5RM: bestWeight })
  }
  exerciseStats.sort((a, b) => b.setCount - a.setCount)

  const liftProgression: Record<string, LiftProgressionPoint[]> = {}
  for (const [name, points] of liftMap) {
    const bySession = new Map<number, LiftProgressionPoint>()
    for (const p of points) {
      const existing = bySession.get(p.date)
      if (!existing || compareStrength(p, existing) < 0) bySession.set(p.date, p)
    }
    liftProgression[name] = Array.from(bySession.values()).sort((a, b) => a.date - b.date)
  }

  const weeklyMap = new Map<string, number>()
  for (const s of allSets) {
    const d = new Date(s.startTime)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    weeklyMap.set(monday.toISOString().slice(0, 10), (weeklyMap.get(monday.toISOString().slice(0, 10)) || 0) + s.volume)
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

  const dailyFreqMap = new Map<string, number>()
  for (const s of sessions) {
    const key = new Date(s.startTime).toISOString().slice(0, 10)
    dailyFreqMap.set(key, (dailyFreqMap.get(key) || 0) + 1)
  }
  const dailyFrequency: DailyFrequency[] = Array.from(dailyFreqMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const dailyVolMap = new Map<string, number>()
  for (const s of allSets) {
    const key = new Date(s.startTime).toISOString().slice(0, 10)
    dailyVolMap.set(key, (dailyVolMap.get(key) || 0) + s.volume)
  }
  const dailyVolume: DailyVolume[] = Array.from(dailyVolMap.entries())
    .map(([date, totalVolume]) => ({ date, totalVolume }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { totalWorkouts, totalSets, totalVolume: Math.round(totalVolume * 10) / 10, avgSessionMinutes, dateRange, exerciseStats, weeklyVolume, monthlyFrequency, dailyFrequency, dailyVolume, liftProgression }
}

export function getPeriodCutoff(period: Period): number {
  switch (period) {
    case '4w': return Date.now() - 4 * 7 * 86400000
    case '8w': return Date.now() - 8 * 7 * 86400000
    case '12w': return Date.now() - 12 * 7 * 86400000
    case 'this-year': return new Date(new Date().getFullYear(), 0, 1).getTime()
    case 'last-year': return Date.now() - 365 * 86400000
    default: return 0
  }
}

export function getPeriodWeeks(period: Period, totalDataWeeks: number): number {
  switch (period) {
    case '4w': return 4
    case '8w': return 8
    case '12w': return 12
    case 'this-year': return Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 86400000))
    case 'last-year': return 52
    default: return totalDataWeeks
  }
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

  const stats = computeStats(sessions, parsedSets)

  return {
    sessions,
    ...stats,
    anomalies,
  }
}

export function filterParsedData(data: ParsedData, period: Period): ParsedData {
  if (period === 'all') return data

  const cutoff = getPeriodCutoff(period)

  const filteredSessions = data.sessions
    .map(s => ({ ...s, sets: s.sets.filter(set => set.startTime >= cutoff) }))
    .filter(s => s.sets.length > 0)

  const filteredSets = filteredSessions.flatMap(s => s.sets)
  const stats = computeStats(filteredSessions, filteredSets)

  return {
    sessions: filteredSessions,
    ...stats,
    anomalies: data.anomalies,
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
