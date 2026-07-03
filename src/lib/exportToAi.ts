import type { ParsedData, Period } from './parseWorkouts'
import { getPeriodWeeks } from './parseWorkouts'
import { classifyDetailedMuscle, classifyExerciseCategory, classifyEquipment, classifyRepRange } from './analytics/classify'
import { STRENGTH_STANDARDS, REFERENCE_BODYWEIGHT_KG } from './standards'

const PERIOD_LABELS: Record<Period, string> = {
  '4w': '4 tuần',
  '8w': '8 tuần',
  '12w': '12 tuần',
  'this-year': 'Năm nay',
  'last-year': '1 năm qua',
  all: 'Tất cả',
}

function tableRow(cells: string[]): string {
  return '| ' + cells.join(' | ') + ' |'
}

function tableSep(cols: number): string {
  return '| ' + Array(cols).fill('---').join(' | ') + ' |'
}

function useDaily(period: Period): boolean {
  return period === '4w' || period === '8w' || period === '12w'
}

function getPeriodLabel(period: Period): string {
  return PERIOD_LABELS[period]
}

export function exportToMarkdown(data: ParsedData, period: Period): string {
  const lines: string[] = []

  // Title
  lines.push(`# Gym Dashboard Export (${getPeriodLabel(period)})`)
  lines.push('')

  // Stats Overview
  lines.push('## 📊 Tổng quan')
  lines.push(tableRow(['Metric', 'Value']))
  lines.push(tableSep(2))
  lines.push(tableRow(['Total Workouts', String(data.totalWorkouts)]))
  lines.push(tableRow(['Total Sets', String(data.totalSets)]))
  lines.push(tableRow(['Total Volume (kg)', Math.round(data.totalVolume).toLocaleString()]))
  lines.push(tableRow(['Avg Session', `${data.avgSessionMinutes} min`]))
  lines.push(tableRow(['Date Range', `${data.dateRange.start.toLocaleDateString()} – ${data.dateRange.end.toLocaleDateString()}`]))
  lines.push('')

  // Training Frequency
  const isDaily = useDaily(period)
  const freqData = isDaily ? data.dailyFrequency : data.monthlyFrequency
  lines.push('## 📅 Training Frequency')
  if (freqData.length > 0) {
    lines.push(tableRow([isDaily ? 'Date' : 'Month', 'Count']))
    lines.push(tableSep(2))
    for (const entry of freqData) {
      lines.push(tableRow([isDaily ? (entry as any).date : (entry as any).month, String((entry as any).count)]))
    }
  } else {
    lines.push('*No data*')
  }
  lines.push('')

  // Volume Trend
  const volData = isDaily ? data.dailyVolume : data.weeklyVolume
  lines.push('## 📈 Volume Trend')
  if (volData.length > 0) {
    lines.push(tableRow([isDaily ? 'Date' : 'Week', 'Volume (kg)']))
    lines.push(tableSep(2))
    for (const entry of volData) {
      const label = isDaily ? (entry as any).date : (entry as any).weekStart
      lines.push(tableRow([label, Math.round((entry as any).totalVolume).toLocaleString()]))
    }
  } else {
    lines.push('*No data*')
  }
  lines.push('')

  // Exercise Rankings
  const ranked = [...data.exerciseStats].sort((a, b) => b.setCount - a.setCount)
  lines.push('## 🏋️ Exercise Rankings')
  if (ranked.length > 0) {
    lines.push(tableRow(['#', 'Exercise', 'Sets', 'Volume (kg)', 'Best 5RM']))
    lines.push(tableSep(5))
    ranked.forEach((ex, i) => {
      lines.push(tableRow([String(i + 1), ex.name, String(ex.setCount), Math.round(ex.totalVolume).toLocaleString(), ex.best5RM > 0 ? String(ex.best5RM) : '-']))
    })
  } else {
    lines.push('*No data*')
  }
  lines.push('')

  // Lift Progression
  const liftKeys = Object.keys(data.liftProgression)
  lines.push('## 📈 Lift Progression')
  if (liftKeys.length > 0) {
    for (const exName of liftKeys) {
      const points = data.liftProgression[exName]
      if (points.length === 0) continue
      lines.push(`### ${exName}`)
      lines.push(tableRow(['Date', 'Weight (kg)', 'Reps']))
      lines.push(tableSep(3))
      for (const p of points) {
        lines.push(tableRow([new Date(p.date).toLocaleDateString(), String(p.weight), String(p.reps)]))
      }
      lines.push('')
    }
  } else {
    lines.push('*No data*')
  }

  // Strength Levels
  lines.push('## 🏆 Strength Levels')
  const standards = STRENGTH_STANDARDS
  const bw = REFERENCE_BODYWEIGHT_KG
  const levelNames = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'] as const
  const levelLabels: Record<string, string> = { beginner: 'Beginner', novice: 'Novice', intermediate: 'Intermediate', advanced: 'Advanced', elite: 'Elite' }

  const strengthRows = data.exerciseStats
    .filter(ex => ex.best5RM > 0 && standards[ex.name])
    .map(ex => {
      const std = standards[ex.name]
      const adjusted: Record<string, number> = {}
      for (const lvl of levelNames) {
        adjusted[lvl] = (std[lvl] * 6 / 7) * (bw / 75)
      }
      let level = 'beginner'
      for (const lvl of levelNames) {
        if (ex.best5RM >= adjusted[lvl]) level = lvl
      }
      const levelIdx = levelNames.indexOf(level as any)
      const next = levelIdx < levelNames.length - 1 ? levelNames[levelIdx + 1] : null
      const nextVal = next ? Math.round(adjusted[next]) : null
      return { name: ex.name, best5RM: ex.best5RM, level, nextVal }
    })

  if (strengthRows.length > 0) {
    lines.push(tableRow(['Exercise', 'Best 5RM', 'Level', 'Next Threshold']))
    lines.push(tableSep(4))
    for (const row of strengthRows) {
      lines.push(tableRow([row.name, `${row.best5RM} kg`, levelLabels[row.level] || row.level, row.nextVal ? `${row.nextVal} kg` : 'Max']))
    }
  } else {
    lines.push('*No data*')
  }
  lines.push('')

  // Muscle Distribution + Balance (computed from sessions)
  const allSets = data.sessions.flatMap(s => s.sets)
  const numWeeks = getPeriodWeeks(period, 4)
  const muscleCounts: Record<string, number> = {}
  const catSets: Record<string, number> = { Push: 0, Pull: 0, Legs: 0 }
  const eqSets: Record<string, number> = { Freeweight: 0, Machine: 0, Bodyweight: 0 }
  const repSets: Record<string, number> = { Strength: 0, Hypertrophy: 0, Endurance: 0 }

  for (const set of allSets) {
    const { primary, synergists } = classifyDetailedMuscle(set.exercise)
    muscleCounts[primary] = (muscleCounts[primary] ?? 0) + 1
    for (const syn of synergists) {
      muscleCounts[syn.muscle] = (muscleCounts[syn.muscle] ?? 0) + syn.weight
    }
    const cat = classifyExerciseCategory(set.exercise)
    catSets[cat]++
    const eq = classifyEquipment(set.exercise, set.weight)
    eqSets[eq]++
    const range = set.reps !== null ? classifyRepRange(set.reps) : null
    if (range) repSets[range]++
  }

  // Muscle Distribution
  const muscleSorted = Object.entries(muscleCounts)
    .map(([name, count]) => ({ name, avg: Math.round((count / numWeeks) * 10) / 10, totalSets: count }))
    .sort((a, b) => b.avg - a.avg)

  lines.push('## 💪 Muscle Distribution')
  if (muscleSorted.length > 0) {
    lines.push(tableRow(['Muscle', 'Sets/Week', 'Total Sets']))
    lines.push(tableSep(3))
    for (const m of muscleSorted) {
      lines.push(tableRow([m.name, String(m.avg), String(m.totalSets)]))
    }
  } else {
    lines.push('*No data*')
  }
  lines.push('')

  // Balance sections
  const catTotal = Object.values(catSets).reduce((s, v) => s + v, 0)
  const eqTotal = Object.values(eqSets).reduce((s, v) => s + v, 0)
  const repTotal = Object.values(repSets).reduce((s, v) => s + v, 0)

  lines.push('## ⚖️ Balance')
  lines.push('')

  const CAT_LABELS: Record<string, string> = { Push: 'Đẩy', Pull: 'Kéo', Legs: 'Chân' }
  const EQ_LABELS: Record<string, string> = { Freeweight: 'Tự do', Machine: 'Máy/Cáp', Bodyweight: 'TLCT' }

  lines.push('### Chức Năng (Push/Pull/Legs)')
  lines.push(tableRow(['Category', '%', 'Sets']))
  lines.push(tableSep(3))
  for (const [key, count] of Object.entries(catSets)) {
    lines.push(tableRow([`${key} (${CAT_LABELS[key]})`, catTotal > 0 ? `${Math.round((count / catTotal) * 100)}%` : '0%', String(count)]))
  }
  lines.push('')

  lines.push('### Loại tạ')
  lines.push(tableRow(['Type', '%', 'Sets']))
  lines.push(tableSep(3))
  for (const [key, count] of Object.entries(eqSets)) {
    lines.push(tableRow([`${key} (${EQ_LABELS[key]})`, eqTotal > 0 ? `${Math.round((count / eqTotal) * 100)}%` : '0%', String(count)]))
  }
  lines.push('')

  lines.push('### Rep Range')
  lines.push(tableRow(['Range', '%', 'Sets']))
  lines.push(tableSep(3))
  for (const [key, count] of Object.entries(repSets)) {
    const rangeLabel = key === 'Strength' ? '1-5' : key === 'Hypertrophy' ? '6-12' : '13+'
    lines.push(tableRow([`${key} (${rangeLabel})`, repTotal > 0 ? `${Math.round((count / repTotal) * 100)}%` : '0%', String(count)]))
  }
  lines.push('')

  return lines.join('\n')
}
