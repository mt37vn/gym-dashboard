import { useState } from 'react'
import {
  convert1RMto5RM,
  STRENGTH_STANDARDS,
  REFERENCE_BODYWEIGHT_KG,
  type StrengthLevelName,
} from '../lib/standards'
import type { ExerciseStats } from '../lib/parseWorkouts'

interface Props {
  exerciseStats: ExerciseStats[] | null
}

const LEVEL_ORDER: StrengthLevelName[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Mới tập',
  novice: 'Tập luyện',
  intermediate: 'Trung cấp',
  advanced: 'Cao cấp',
  elite: 'Elite',
}

function getThresholds(exercise: string, bodyweight: number): Record<string, number> {
  const raw = STRENGTH_STANDARDS[exercise]
  if (!raw) return {}
  const ratio = bodyweight / REFERENCE_BODYWEIGHT_KG
  const result: Record<string, number> = {}
  for (const key of LEVEL_ORDER) {
    result[key] = Math.round(convert1RMto5RM(raw[key] * ratio) * 10) / 10
  }
  return result
}

export default function StrengthLevels({ exerciseStats }: Props) {
  const [bodyweight, setBodyweight] = useState(REFERENCE_BODYWEIGHT_KG)
  const [goalLevel, setGoalLevel] = useState<StrengthLevelName>('intermediate')
  const [sortMode, setSortMode] = useState<'best' | 'worst' | 'weight'>('best')
  const [showAll, setShowAll] = useState(false)

  if (!exerciseStats || exerciseStats.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Mức sức mạnh</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          Không có dữ liệu
        </div>
      </div>
    )
  }

  const matched = exerciseStats.filter(
    (e) => STRENGTH_STANDARDS[e.name] && e.best5RM > 0,
  )

  const withProgress = matched.map((ex) => {
    const thresholds = getThresholds(ex.name, bodyweight)
    const goalThreshold = thresholds[goalLevel] ?? 0
    const progress = goalThreshold > 0 ? Math.min((ex.best5RM / goalThreshold) * 100, 100) : 0
    return { ...ex, _progress: progress }
  })

  const sorted = [...withProgress].sort((a, b) =>
    sortMode === 'best' ? b._progress - a._progress
      : sortMode === 'worst' ? a._progress - b._progress
      : b.best5RM - a.best5RM,
  )
  const display = showAll ? sorted : sorted.slice(0, 15)
  const maxProgress = Math.max(...display.map((e) => e._progress), 1)

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl text-text-primary">Mức sức mạnh</h2>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <label htmlFor="bw-input" className="text-text-muted">
            Cân nặng (kg):
          </label>
          <input
            id="bw-input"
            type="number"
            min={30}
            max={200}
            value={bodyweight}
            onChange={(e) => setBodyweight(Math.max(30, Math.min(200, parseFloat(e.target.value) || 75)))}
            className="w-16 bg-bg-base text-text-primary border border-border rounded px-2 py-1 text-sm text-center"
          />
          <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
            {LEVEL_ORDER.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setGoalLevel(lvl)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  goalLevel === lvl
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
          <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setSortMode('best')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                sortMode === 'best'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Tốt nhất
            </button>
            <button
              onClick={() => setSortMode('worst')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                sortMode === 'worst'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Tệ nhất
            </button>
            <button
              onClick={() => setSortMode('weight')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                sortMode === 'weight'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Nặng nhất
            </button>
          </div>
        </div>
      </div>

      {display.length > 0 && (
        <>
          <div className="space-y-1.5">
            {display.map((ex, i) => {
              const rank = i + 1
              const pct = Math.max((ex._progress / maxProgress) * 100, 2)
              const thresholds = getThresholds(ex.name, bodyweight)
              const goalThreshold = thresholds[goalLevel] ?? 0
              const remaining = Math.max(goalThreshold - ex.best5RM, 0)
              const achieved = ex.best5RM >= goalThreshold

              return (
                <div key={ex.name} className="flex items-center gap-3">
                  <span className="text-text-muted text-xs w-5 text-right font-mono">{rank}</span>
                  <span className="text-text-primary text-sm flex-1 truncate">{ex.name}</span>
                  <span className={`font-display text-sm w-12 text-right ${achieved ? 'text-success' : 'text-accent'}`}>
                    {Math.round(ex._progress)}%
                  </span>
                  <div className="w-20 h-2 bg-bg-base rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-24 text-right hidden sm:block">
                    {achieved ? '✓ Đạt' : `còn ${remaining.toFixed(1)} kg`}
                  </span>
                </div>
              )
            })}
          </div>
          {sorted.length > 15 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 text-xs text-accent hover:text-accent-light transition-colors"
            >
              {showAll ? 'Thu gọn' : `Hiện tất cả (${sorted.length} bài)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
