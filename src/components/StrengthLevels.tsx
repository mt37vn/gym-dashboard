import { useState } from 'react'
import {
  getStrengthLevel,
  getLevelBadgeClass,
  STRENGTH_STANDARDS,
  REFERENCE_BODYWEIGHT_KG,
  type StrengthLevelName,
} from '../lib/standards'
import type { ExerciseStats } from '../lib/parseWorkouts'

interface Props {
  exerciseStats: ExerciseStats[] | null
}

const LEVEL_ORDER: StrengthLevelName[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']

export default function StrengthLevels({ exerciseStats }: Props) {
  const [bodyweight, setBodyweight] = useState(REFERENCE_BODYWEIGHT_KG)

  if (!exerciseStats || exerciseStats.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Strength Levels</h2>
        <div className="h-64 bg-bg-card-hover rounded animate-pulse flex items-center justify-center text-text-muted text-sm">
          No data
        </div>
      </div>
    )
  }

  const matched = exerciseStats
    .filter((e) => STRENGTH_STANDARDS[e.name] && e.best1RM > 0)
    .sort((a, b) => b.best1RM - a.best1RM)

  const unmatched = exerciseStats
    .filter((e) => !STRENGTH_STANDARDS[e.name] && e.best1RM > 0)
    .sort((a, b) => (b.best1RM / (bodyweight || 75)) - (a.best1RM / (bodyweight || 75)))

  const ref = STRENGTH_STANDARDS
  const ratio = bodyweight / REFERENCE_BODYWEIGHT_KG

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl text-text-primary">Strength Levels</h2>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="bw-input" className="text-text-muted">
            Bodyweight (kg):
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
        </div>
      </div>

      {matched.length > 0 && (
        <div className="mb-6">
          <h3 className="text-text-muted text-xs uppercase tracking-wider font-medium mb-3">
            Strength Standards
          </h3>
          <div className="space-y-4">
            {matched.map((ex) => {
              const info = getStrengthLevel(ex.best1RM, bodyweight, ex.name)
              if (!info) return null
              const standards = ref[ex.name]
              const maxThreshold = standards.elite * ratio
              const progressPct = Math.min((ex.best1RM / maxThreshold) * 100, 100)

              return (
                <div key={ex.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-primary text-sm font-medium">{ex.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-accent text-base">
                        {Math.round(ex.best1RM)} kg
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelBadgeClass(info.level)}`}
                      >
                        {info.level}
                      </span>
                    </div>
                  </div>
                  {info.nextThreshold !== null && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {info.kgToNext!.toFixed(1)} kg to {info.nextThreshold.toFixed(0)} ({nextLevelName(info.level)})
                      </span>
                    </div>
                  )}
                  {info.nextThreshold === null && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-xs text-accent">Elite ✓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {unmatched.length > 0 && (
        <div>
          <h3 className="text-text-muted text-xs uppercase tracking-wider font-medium mb-3">
            PR / Bodyweight Ratio
          </h3>
          <div className="space-y-1.5">
            {unmatched.slice(0, 15).map((ex) => {
              const ratioVal = ex.best1RM / bodyweight
              return (
                <div key={ex.name} className="flex items-center justify-between py-1">
                  <span className="text-text-primary text-sm">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-xs">
                      {Math.round(ex.best1RM)} kg
                    </span>
                    <span className="text-accent font-display text-sm w-16 text-right">
                      {ratioVal.toFixed(2)}× BW
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {unmatched.length > 15 && (
            <p className="text-xs text-text-muted mt-2">
              + {unmatched.length - 15} more exercises
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function nextLevelName(level: StrengthLevelName): string {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx >= LEVEL_ORDER.length - 1) return ''
  return LEVEL_ORDER[idx + 1]
}
