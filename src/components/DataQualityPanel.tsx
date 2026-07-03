import { useState } from 'react'
import type { Anomalies } from '../lib/parseWorkouts'

interface Props {
  anomalies: Anomalies | null
}

export default function DataQualityPanel({ anomalies }: Props) {
  const [open, setOpen] = useState(false)

  if (!anomalies) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">Data Quality</h2>
        <div className="h-12 bg-bg-card-hover rounded animate-pulse" />
      </div>
    )
  }

  const totalIssues =
    anomalies.highReps.length + anomalies.missingWeight.length + anomalies.missingReps.length

  if (totalIssues === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-2">Data Quality</h2>
        <p className="text-success text-sm">No anomalies detected — data looks clean.</p>
      </div>
    )
  }

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="font-display text-xl text-text-primary">Data Quality</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
            {totalIssues} issue{totalIssues > 1 ? 's' : ''}
          </span>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm">
          {anomalies.highReps.length > 0 && (
            <div>
              <h4 className="text-warning font-medium mb-1">
                Reps &gt; 50 ({anomalies.highReps.length})
              </h4>
              <ul className="space-y-0.5 text-text-muted text-xs">
                {anomalies.highReps.slice(0, 10).map((a, i) => (
                  <li key={i}>
                    {a.exercise}: {a.reps} reps
                    {a.weight !== null ? ` @ ${a.weight} kg` : ''} —{' '}
                    {new Date(a.start).toLocaleDateString()}
                  </li>
                ))}
                {anomalies.highReps.length > 10 && (
                  <li className="text-text-muted italic">
                    ...and {anomalies.highReps.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {anomalies.missingWeight.length > 0 && (
            <div>
              <h4 className="text-warning font-medium mb-1">
                Missing Weight ({anomalies.missingWeight.length})
              </h4>
              <ul className="space-y-0.5 text-text-muted text-xs">
                {anomalies.missingWeight.slice(0, 10).map((a, i) => (
                  <li key={i}>
                    {a.exercise}: {a.reps} reps — {new Date(a.start).toLocaleDateString()}
                  </li>
                ))}
                {anomalies.missingWeight.length > 10 && (
                  <li className="text-text-muted italic">
                    ...and {anomalies.missingWeight.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {anomalies.missingReps.length > 0 && (
            <div>
              <h4 className="text-warning font-medium mb-1">
                Missing Reps ({anomalies.missingReps.length})
              </h4>
              <ul className="space-y-0.5 text-text-muted text-xs">
                {anomalies.missingReps.slice(0, 10).map((a, i) => (
                  <li key={i}>
                    {a.exercise}
                    {a.weight !== null ? ` @ ${a.weight} kg` : ''} —{' '}
                    {new Date(a.start).toLocaleDateString()}
                  </li>
                ))}
                {anomalies.missingReps.length > 10 && (
                  <li className="text-text-muted italic">
                    ...and {anomalies.missingReps.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
