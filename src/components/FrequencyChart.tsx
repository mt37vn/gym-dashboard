import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { MonthlyFrequency } from '../lib/parseWorkouts'

interface Props {
  data: MonthlyFrequency[] | null
}

export default function FrequencyChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Training Frequency</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          No data
        </div>
      </div>
    )
  }

  const counts = data.map((d) => d.count)
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <h2 className="font-display text-xl text-text-primary mb-4">Training Frequency</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              color: '#f4f4f5',
              fontSize: 13,
            }}
            cursor={{ fill: 'rgba(217,119,6,0.1)' }}
          />
          <ReferenceLine y={Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)} stroke="#71717a" strokeDasharray="4 4" />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.count === maxCount ? '#d97706' : entry.count === minCount ? '#ef4444' : '#d97706'}
                fillOpacity={entry.count === maxCount ? 1 : entry.count === minCount ? 0.7 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-accent" /> Peak: {maxCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-error" /> Lowest: {minCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-text-muted" /> Avg: {Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)}
        </span>
      </div>
    </div>
  )
}
