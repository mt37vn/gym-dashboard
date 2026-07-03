import { useState } from 'react'
import type { ExerciseStats } from '../lib/parseWorkouts'

interface Props {
  data: ExerciseStats[] | null
}

type SortMode = 'sets' | 'volume'

export default function ExerciseRankings({ data }: Props) {
  const [mode, setMode] = useState<SortMode>('sets')
  const [showAll, setShowAll] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Exercise Rankings</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          No data
        </div>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) =>
    mode === 'sets' ? b.setCount - a.setCount : b.totalVolume - a.totalVolume,
  )
  const display = showAll ? sorted : sorted.slice(0, 15)
  const maxVal = mode === 'sets' ? sorted[0]?.setCount || 1 : sorted[0]?.totalVolume || 1

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-text-primary">Exercise Rankings</h2>
        <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setMode('sets')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              mode === 'sets'
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            By Sets
          </button>
          <button
            onClick={() => setMode('volume')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              mode === 'volume'
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            By Volume
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {display.map((ex, i) => {
          const val = mode === 'sets' ? ex.setCount : ex.totalVolume
          const pct = Math.max((val / maxVal) * 100, 2)
          const rank = i + 1
          return (
            <div key={ex.name} className="flex items-center gap-3">
              <span className="text-text-muted text-xs w-5 text-right font-mono">{rank}</span>
              <span className="text-text-primary text-sm flex-1 truncate">{ex.name}</span>
              <span className="text-accent font-display text-sm w-20 text-right">
                {mode === 'sets' ? `${ex.setCount} sets` : `${Math.round(ex.totalVolume).toLocaleString()} kg`}
              </span>
              <div className="w-24 h-2 bg-bg-base rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {sorted.length > 15 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-accent hover:text-accent-light transition-colors"
        >
          {showAll ? 'Show top 15' : `Show all ${sorted.length} exercises`}
        </button>
      )}
    </div>
  )
}
