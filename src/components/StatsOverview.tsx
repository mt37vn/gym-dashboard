import type { ParsedData } from '../lib/parseWorkouts'

interface Props {
  data: ParsedData | null
}

export default function StatsOverview({ data }: Props) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-bg-card rounded-lg p-4 animate-pulse">
            <div className="h-3 bg-bg-card-hover rounded w-20 mb-3" />
            <div className="h-8 bg-bg-card-hover rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    { label: 'Total Workouts', value: data.totalWorkouts.toLocaleString() },
    { label: 'Total Sets', value: data.totalSets.toLocaleString() },
    { label: 'Total Volume (kg)', value: `${Math.round(data.totalVolume).toLocaleString()} kg` },
    { label: 'Avg Session', value: `${data.avgSessionMinutes} min` },
    { label: 'Date Range', value: `${data.dateRange.start.toLocaleDateString()} – ${data.dateRange.end.toLocaleDateString()}` },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-bg-card rounded-lg p-4 border border-border">
          <div className="text-text-muted text-xs uppercase tracking-wider font-medium mb-1">
            {stat.label}
          </div>
          <div className="font-display text-2xl text-text-primary leading-tight">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}
