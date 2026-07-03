import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { LiftProgressionPoint } from '../lib/parseWorkouts'

interface Props {
  data: Record<string, LiftProgressionPoint[]> | null
}

function findBarbellLifts(data: Record<string, LiftProgressionPoint[]>): string[] {
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
  ]
  const names = Object.keys(data).filter((name) => {
    const lower = name.toLowerCase()
    return barbellKeywords.some((kw) => lower.includes(kw))
  })
  const withSets = names.filter((n) => (data[n]?.length ?? 0) >= 2)
  return withSets.length > 0 ? withSets : names.slice(0, 5)
}

export default function LiftProgression({ data }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Estimated 1RM Progression</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          No data
        </div>
      </div>
    )
  }

  const lifts = findBarbellLifts(data)
  const active = selected && data[selected] ? selected : lifts[0] || Object.keys(data)[0]
  const points = data[active] || []

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl text-text-primary">Estimated 1RM Progression</h2>
        <div className="flex flex-wrap gap-1">
          {lifts.slice(0, 6).map((name) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                active === name
                  ? 'bg-accent text-white'
                  : 'bg-bg-base text-text-muted hover:text-text-primary'
              }`}
            >
              {name}
            </button>
          ))}
          {Object.keys(data).length > 6 && (
            <select
              value={active}
              onChange={(e) => setSelected(e.target.value)}
              className="bg-bg-base text-text-primary text-xs rounded-md px-2 py-1 border border-border"
            >
              {Object.keys(data).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
            tickFormatter={(v: number) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              color: '#f4f4f5',
              fontSize: 13,
            }}
            labelFormatter={((v: number) => new Date(v).toLocaleDateString()) as any}
            formatter={((value: number, name: string) => [
              `${Math.round(value)} kg`,
              name === 'est1RM' ? 'Est. 1RM' : name,
            ]) as any}
          />
          <Line
            type="monotone"
            dataKey="est1RM"
            stroke="#d97706"
            strokeWidth={2}
            dot={{ r: 3, fill: '#d97706' }}
            activeDot={{ r: 5, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-text-muted">
        Using Epley formula: est. 1RM = weight × (1 + reps / 30), from sets with reps ≤ 12
      </div>
    </div>
  )
}
