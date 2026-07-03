import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WorkoutSession } from '../../lib/parseWorkouts'
import { classifyDetailedMuscle } from '../../lib/analytics/classify'
import { MUSCLE_COLORS } from '../../lib/analytics/muscleConfig'

interface Props {
  sessions: WorkoutSession[]
  dateRange: { start: Date; end: Date }
}

export default function MuscleTab({ sessions, dateRange }: Props) {
  const [rangeWeeks, setRangeWeeks] = useState<number>(4)

  const allSets = sessions.flatMap((s) => s.sets)

  if (allSets.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Cơ</h2>
        <div className="h-20 bg-bg-card-hover rounded flex items-center justify-center text-text-muted text-sm">
          Không có dữ liệu
        </div>
      </div>
    )
  }

  const totalDataWeeks = Math.max(1,
    Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 86400000)))
  const cutoff = rangeWeeks > 0
    ? Date.now() - rangeWeeks * 7 * 86400000
    : 0

  const setCounts: Record<string, number> = {}
  for (const set of allSets) {
    if (rangeWeeks > 0 && set.startTime < cutoff) continue
    const { primary, synergists } = classifyDetailedMuscle(set.exercise)
    setCounts[primary] = (setCounts[primary] ?? 0) + 1
    for (const syn of synergists) {
      setCounts[syn.muscle] = (setCounts[syn.muscle] ?? 0) + syn.weight
    }
  }

  const numWeeks = rangeWeeks > 0 ? rangeWeeks : totalDataWeeks
  const entries = Object.entries(setCounts)
    .map(([name, count]) => ({
      name,
      avg: Math.round((count / numWeeks) * 10) / 10,
      totalSets: count,
    }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl text-text-primary">Cơ</h2>
        <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
          {[4, 8, 12, 0].map((w) => (
            <button
              key={w}
              onClick={() => setRangeWeeks(w)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                rangeWeeks === w
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {w === 0 ? 'Tất cả' : `${w} tuần`}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="h-20 bg-bg-card-hover rounded flex items-center justify-center text-text-muted text-sm">
          Không có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(250, entries.length * 36)}>
          <BarChart data={entries} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#3f3f46' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#a1a1aa', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={85}
            />
            <Tooltip
              contentStyle={{
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                color: '#f4f4f5',
                fontSize: 12,
              }}
              formatter={((_value: number, _name: string, props: { payload: { avg: number; totalSets: number } }) => [
                `${props.payload.avg} set/tuần (${props.payload.totalSets} set)`,
              ]) as any}
            />
            <Bar dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {entries.map((entry) => (
                <Cell key={entry.name} fill={MUSCLE_COLORS[entry.name] || '#71717a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
