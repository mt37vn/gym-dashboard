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
import { STRENGTH_STANDARDS } from '../lib/standards'

interface Props {
  data: Record<string, LiftProgressionPoint[]> | null
}

const BIG_3 = ['Bench Press', 'Squat', 'Deadlift']

export default function LiftProgression({ data }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Tiến trình 5RM</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          Không có dữ liệu
        </div>
      </div>
    )
  }

  const allStandards = Object.entries(data)
    .filter(([, points]) => points.length >= 2)
    .filter(([name]) => STRENGTH_STANDARDS[name])
    .map(([name]) => name)

  const big3 = BIG_3.filter((name) => allStandards.includes(name))
  const others = allStandards.filter((name) => !BIG_3.includes(name))
  const active = selected && data[selected] ? selected : big3[0] || others[0] || ''
  const points = data[active] || []

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl text-text-primary">Tiến trình 5RM</h2>
        <div className="flex flex-wrap gap-1">
          {big3.map((name) => (
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
          {others.length > 0 && (
            <select
              value={active}
              onChange={(e) => setSelected(e.target.value)}
              className="bg-bg-base text-text-primary text-xs rounded-md px-2 py-1 border border-border"
            >
              {others.map((name) => (
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
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
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
              name === 'est5RM' ? '5RM' : name,
            ]) as any}
          />
          <Line
            type="monotone"
            dataKey="est5RM"
            stroke="#d97706"
            strokeWidth={2}
            dot={{ r: 3, fill: '#d97706' }}
            activeDot={{ r: 5, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-text-muted">
        Giá trị thực tế: ưu tiên PR 5 rep → 10 rep → 15 rep theo thứ tự
      </div>
    </div>
  )
}
