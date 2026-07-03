import { useState, useCallback } from 'react'
import { parseCsv } from './lib/parseWorkouts'
import type { ParsedData } from './lib/parseWorkouts'
import FileUpload from './components/FileUpload'
import StatsOverview from './components/StatsOverview'
import FrequencyChart from './components/FrequencyChart'
import VolumeChart from './components/VolumeChart'
import ExerciseRankings from './components/ExerciseRankings'
import LiftProgression from './components/LiftProgression'
import StrengthLevels from './components/StrengthLevels'
import DataQualityPanel from './components/DataQualityPanel'

function App() {
  const [data, setData] = useState<ParsedData | null>(null)

  const handleFile = useCallback((text: string) => {
    try {
      const parsed = parseCsv(text)
      setData(parsed)
    } catch (err) {
      console.error('Failed to parse CSV:', err)
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl text-accent tracking-wide">
            GYM DASHBOARD
          </h1>
          {data && (
            <span className="text-xs text-text-muted">
              {data.totalWorkouts} workouts · {data.totalSets} sets
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <FileUpload onFile={handleFile} />

        {data && (
          <>
            <StatsOverview data={data} />
            <FrequencyChart data={data.monthlyFrequency} />
            <VolumeChart data={data.weeklyVolume} anomalies={data.anomalies} />
            <ExerciseRankings data={data.exerciseStats} />
            <LiftProgression data={data.liftProgression} />
            <StrengthLevels exerciseStats={data.exerciseStats} />
            <DataQualityPanel anomalies={data.anomalies} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
