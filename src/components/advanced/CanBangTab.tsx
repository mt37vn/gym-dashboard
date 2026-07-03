import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PieChart, Pie } from 'recharts'
import type { WorkoutSession, Period } from '../../lib/parseWorkouts'
import { getPeriodCutoff, getPeriodWeeks } from '../../lib/parseWorkouts'
import { classifyDetailedMuscle, classifyExerciseCategory, classifyEquipment, classifyRepRange } from '../../lib/analytics/classify'
import { MUSCLE_COLORS } from '../../lib/analytics/muscleConfig'
import MuscleSettings from './MuscleSettings'

interface Props {
  sessions: WorkoutSession[]
  dateRange: { start: Date; end: Date }
  period: Period
}

type Mode = 'volume' | 'sets'
type BalanceType = 'cat' | 'eq' | 'rep'

const CAT_COLORS: Record<string, string> = { Push: '#d97706', Pull: '#22c55e', Legs: '#3b82f6' }
const CAT_LABELS: Record<string, string> = { Push: 'Đẩy', Pull: 'Kéo', Legs: 'Chân' }
const EQ_COLORS: Record<string, string> = { Freeweight: '#d97706', Machine: '#a855f7', Bodyweight: '#22c55e' }
const EQ_LABELS: Record<string, string> = { Freeweight: 'Tự do', Machine: 'Máy/Cáp', Bodyweight: 'TLCT' }
const REP_COLORS: Record<string, string> = { Strength: '#ef4444', Hypertrophy: '#d97706', Endurance: '#0ea5e9' }
const REP_LABELS: Record<string, string> = { Strength: 'Sức mạnh', Hypertrophy: 'Phì đại', Endurance: 'Bền' }

const BALANCE_CONFIG: Record<BalanceType, { title: string; labels: Record<string, string>; colors: Record<string, string>; keys: string[] }> = {
  cat: { title: 'Chức Năng', labels: CAT_LABELS, colors: CAT_COLORS, keys: ['Push', 'Pull', 'Legs'] },
  eq: { title: 'Loại tạ', labels: EQ_LABELS, colors: EQ_COLORS, keys: ['Freeweight', 'Machine', 'Bodyweight'] },
  rep: { title: 'Rep range', labels: REP_LABELS, colors: REP_COLORS, keys: ['Strength', 'Hypertrophy', 'Endurance'] },
}

export default function CanBangTab({ sessions, dateRange, period }: Props) {
  const [mode, setMode] = useState<Mode>('sets')
  const [balanceType, setBalanceType] = useState<BalanceType>('cat')
  const [muscleMode, setMuscleMode] = useState<'primary-only' | 'primary+secondary'>('primary+secondary')
  const [showSettings, setShowSettings] = useState(false)

  const allSets = sessions.flatMap((s) => s.sets)
  if (allSets.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Cân bằng</h2>
        <div className="h-20 bg-bg-card-hover rounded flex items-center justify-center text-text-muted text-sm">Không có dữ liệu</div>
      </div>
    )
  }

  const totalDataWeeks = Math.max(1, Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 86400000)))
  const cutoff = getPeriodCutoff(period)
  const numWeeks = getPeriodWeeks(period, totalDataWeeks)
  const filteredSets = cutoff > 0 ? allSets.filter((s) => s.startTime >= cutoff) : allSets

  const muscleCounts: Record<string, number> = {}
  const catVol: Record<string, number> = { Push: 0, Pull: 0, Legs: 0 }
  const catSets: Record<string, number> = { Push: 0, Pull: 0, Legs: 0 }
  const eqVol: Record<string, number> = { Freeweight: 0, Machine: 0, Bodyweight: 0 }
  const eqSets: Record<string, number> = { Freeweight: 0, Machine: 0, Bodyweight: 0 }
  const repVol: Record<string, number> = { Strength: 0, Hypertrophy: 0, Endurance: 0 }
  const repSets: Record<string, number> = { Strength: 0, Hypertrophy: 0, Endurance: 0 }

  for (const set of filteredSets) {
    const { primary, synergists } = classifyDetailedMuscle(set.exercise)
    muscleCounts[primary] = (muscleCounts[primary] ?? 0) + 1
    if (muscleMode === 'primary+secondary') {
      for (const syn of synergists) {
        muscleCounts[syn.muscle] = (muscleCounts[syn.muscle] ?? 0) + syn.weight
      }
    }

    const cat = classifyExerciseCategory(set.exercise)
    catSets[cat]++
    const eq = classifyEquipment(set.exercise, set.weight)
    eqSets[eq]++
    const range = set.reps !== null ? classifyRepRange(set.reps) : null
    if (range) repSets[range]++
    if (set.weight !== null && set.reps !== null) {
      const vol = set.weight * set.reps
      catVol[cat] += vol
      eqVol[eq] += vol
      if (range) repVol[range] += vol
    }
  }

  const round = (v: number) => Math.round(v * 10) / 10

  const muscleEntries = Object.entries(muscleCounts)
    .map(([name, count]) => ({
      name,
      avg: Math.round((count / numWeeks) * 10) / 10,
      totalSets: count,
    }))
    .sort((a, b) => b.avg - a.avg)

  const volMap: Record<BalanceType, Record<string, number>> = { cat: catVol, eq: eqVol, rep: repVol }
  const setMap: Record<BalanceType, Record<string, number>> = { cat: catSets, eq: eqSets, rep: repSets }
  const source = mode === 'volume' ? volMap[balanceType] : setMap[balanceType]
  const config = BALANCE_CONFIG[balanceType]
  const donutEntries = config.keys.map(name => ({ name, value: round(source[name]) }))
  const donutTotal = donutEntries.reduce((s, d) => s + d.value, 0)
  const donutUnit = mode === 'volume' ? 'kg' : 'set'

  return (
    <div className="space-y-4">
      <div className="bg-bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-display text-xl text-text-primary">Cơ</h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
                <button onClick={() => setMuscleMode('primary-only')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${muscleMode === 'primary-only' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Chính</button>
                <button onClick={() => setMuscleMode('primary+secondary')}
                  className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${muscleMode === 'primary+secondary' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Chính + Phụ</button>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${showSettings ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}
                title={showSettings ? 'Xem biểu đồ' : 'Cài đặt'}
              >
                ⚙
              </button>
            </div>
          </div>
          {showSettings ? (
            <MuscleSettings />
          ) : muscleEntries.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-text-muted text-sm">Không có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={muscleEntries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5', fontSize: 12 }}
                formatter={((_value: number, _name: string, props: { payload: { avg: number; totalSets: number } }) => [
                  `${props.payload.avg} set/tuần (${props.payload.totalSets} set)`,
                ]) as any}
              />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {muscleEntries.map((entry) => (
                  <Cell key={entry.name} fill={MUSCLE_COLORS[entry.name] || '#71717a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display text-xl text-text-primary">{config.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
              <button onClick={() => setMode('volume')}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${mode === 'volume' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Volume</button>
              <button onClick={() => setMode('sets')}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${mode === 'sets' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Set</button>
            </div>
            <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
              <button onClick={() => setBalanceType('cat')}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${balanceType === 'cat' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Chức Năng</button>
              <button onClick={() => setBalanceType('eq')}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${balanceType === 'eq' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Loại tạ</button>
              <button onClick={() => setBalanceType('rep')}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors ${balanceType === 'rep' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>Rep range</button>
            </div>
          </div>
        </div>

        {donutTotal === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-muted text-sm">Không có dữ liệu</div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={donutEntries} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {donutEntries.map((entry, i) => <Cell key={i} fill={config.colors[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#f4f4f5', fontSize: 12 }}
                  formatter={((value: number) => [`${Math.round((value / donutTotal) * 100)}% (${Math.round(value).toLocaleString()} ${donutUnit})`]) as any} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              {donutEntries.map((d) => {
                const pct = Math.round((d.value / donutTotal) * 100)
                return (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: config.colors[d.name] }} />
                    <span className="text-text-muted">{config.labels[d.name]}</span>
                    <span className="text-text-primary font-medium font-display">{pct}%</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
