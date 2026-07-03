import { useState, useCallback, useMemo } from 'react'
import { parseCsv, filterParsedData } from './lib/parseWorkouts'
import type { ParsedData, Period } from './lib/parseWorkouts'
import { exportToMarkdown } from './lib/exportToAi'
import FileUpload from './components/FileUpload'
import StatsOverview from './components/StatsOverview'
import FrequencyChart from './components/FrequencyChart'
import VolumeChart from './components/VolumeChart'
import ExerciseRankings from './components/ExerciseRankings'
import LiftProgression from './components/LiftProgression'
import StrengthLevels from './components/StrengthLevels'
import DataQualityPanel from './components/DataQualityPanel'
import CanBangTab from './components/advanced/CanBangTab'

const PERIODS: { key: Period; label: string }[] = [
  { key: '4w', label: '4 tuần' },
  { key: '8w', label: '8 tuần' },
  { key: '12w', label: '12 tuần' },
  { key: 'this-year', label: 'Năm nay' },
  { key: 'last-year', label: '1 năm qua' },
  { key: 'all', label: 'Tất cả' },
]

function App() {
  const [data, setData] = useState<ParsedData | null>(null)
  const [period, setPeriod] = useState<Period>('4w')
  const [copied, setCopied] = useState(false)

  const filteredData = useMemo(() =>
    data ? filterParsedData(data, period) : null,
    [data, period],
  )

  const handleFile = useCallback((text: string) => {
    try {
      const parsed = parseCsv(text)
      setData(parsed)
    } catch (err) {
      console.error('Failed to parse CSV:', err)
    }
  }, [])

  const handleExport = useCallback(() => {
    if (!filteredData) return
    const md = exportToMarkdown(filteredData, period)
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = md
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [filteredData, period])

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl text-accent tracking-wide">
            GYM DASHBOARD
          </h1>
          {filteredData && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">
                {filteredData.totalWorkouts} workouts · {filteredData.totalSets} sets
              </span>
              <button onClick={handleExport}
                className="px-2.5 py-1 text-xs rounded-md font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
              >
                {copied ? 'Đã copy!' : 'Export to AI'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <FileUpload onFile={handleFile} />

        {data && filteredData && (
          <>
            <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5 w-fit flex-wrap">
              {PERIODS.map(({ key, label }) => (
                <button key={key} onClick={() => setPeriod(key)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    period === key ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <StatsOverview data={filteredData} />
            <FrequencyChart
              data={filteredData.monthlyFrequency}
              dailyData={filteredData.dailyFrequency}
              period={period}
            />
            <VolumeChart
              data={filteredData.weeklyVolume}
              dailyData={filteredData.dailyVolume}
              anomalies={filteredData.anomalies}
              period={period}
            />
            <ExerciseRankings data={filteredData.exerciseStats} />
            <LiftProgression data={filteredData.liftProgression} />
            <StrengthLevels exerciseStats={filteredData.exerciseStats} />
            <CanBangTab sessions={filteredData.sessions} dateRange={filteredData.dateRange} period={period} />
            <DataQualityPanel anomalies={filteredData.anomalies} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
