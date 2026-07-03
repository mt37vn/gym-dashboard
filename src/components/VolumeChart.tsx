import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WeeklyVolume, Anomalies } from '../lib/parseWorkouts'

interface Props {
  data: WeeklyVolume[] | null
  anomalies: Anomalies | null
}

export default function VolumeChart({ data, anomalies }: Props) {
  const hasFiltered = anomalies && anomalies.highReps.length > 0

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Volume Trend</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          No data
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-text-primary">Volume Trend</h2>
        {hasFiltered && (
          <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
            {anomalies!.highReps.length} high-rep row{anomalies!.highReps.length > 1 ? 's' : ''} filtered
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis
            dataKey="weekStart"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
            tickFormatter={(v: string) => {
              const d = new Date(v)
              return `${d.getMonth() + 1}/${d.getDate()}`
            }}
          />
          <YAxis
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              color: '#f4f4f5',
              fontSize: 13,
            }}
            labelFormatter={((v: string) => `Week of ${v}`) as any}
            formatter={((value: number) => [`${Math.round(value).toLocaleString()} kg`, 'Volume']) as any}
          />
          <Line
            type="monotone"
            dataKey="totalVolume"
            stroke="#d97706"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
      {hasFiltered && (
        <p className="text-xs text-text-muted mt-2">
          Data quality note: {anomalies!.highReps.length} set{anomalies!.highReps.length > 1 ? 's' : ''} with reps &gt; 50 excluded from volume calculation (likely data entry errors).
        </p>
      )}
    </div>
  )
}
