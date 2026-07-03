import { useState, useEffect } from 'react'
import { RAW_MAP, EXERCISE_MUSCLE_MAP } from '../../lib/analytics/muscleConfig'
import {
  loadExerciseMuscleOverrides, saveExerciseMuscleOverrides,
  loadExerciseSynergistOverrides, saveExerciseSynergistOverrides,
  loadDefaultSynergistWeight, saveDefaultSynergistWeight,
  ensureVersion,
} from '../../lib/analytics/muscleSettings'
import { clearDetailedMuscleCache } from '../../lib/analytics/classify'

const ALL_MUSCLES = [
  'pectoralis major', 'deltoid', 'latissimus dorsi', 'rhomboids', 'trapezius',
  'triceps brachii', 'biceps brachii', 'brachioradialis', 'forearm flexors',
  'quadriceps femoris', 'hamstrings', 'gastrocnemius', 'soleus',
  'rectus abdominis', 'external oblique', 'erector spinae',
  'gluteus medius', 'gluteus maximus', 'adductor magnus',
]

export default function MuscleSettings() {
  const [muscleOverrides, setMuscleOverrides] = useState<Record<string, string[]>>({})
  const [synergistOverrides, setSynergistOverrides] = useState<Record<string, { muscle: string; weight: number }[]>>({})
  const [defaultWeight, setDefaultWeight] = useState(0.5)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ensureVersion()
    setMuscleOverrides(loadExerciseMuscleOverrides())
    setSynergistOverrides(loadExerciseSynergistOverrides())
    setDefaultWeight(loadDefaultSynergistWeight())
  }, [])

  const allExercises = Object.keys(EXERCISE_MUSCLE_MAP)
  const filtered = search
    ? allExercises.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : allExercises

  const notifyChange = () => {
    clearDetailedMuscleCache()
  }

  const getDefaultMuscles = (exercise: string): string[] => {
    const entry = RAW_MAP[exercise]
    return entry ? entry.primaryMuscles : ['']
  }

  const currentMuscles = (exercise: string): string[] => {
    return muscleOverrides[exercise] ?? getDefaultMuscles(exercise)
  }

  const isOverridden = (exercise: string): boolean => {
    return muscleOverrides[exercise] !== undefined
  }

  const updateMuscles = (exercise: string, muscles: string[]) => {
    const next = { ...muscleOverrides }
    if (muscles.length === 0 || (muscles.length === 1 && muscles[0] === '')) {
      delete next[exercise]
    } else {
      next[exercise] = muscles.filter(m => m !== '')
    }
    setMuscleOverrides(next)
    saveExerciseMuscleOverrides(next)
    notifyChange()
  }

  const handleMuscleChange = (exercise: string, index: number, newMuscle: string) => {
    const muscles = [...currentMuscles(exercise)]
    muscles[index] = newMuscle
    updateMuscles(exercise, muscles)
  }

  const handleRemoveMuscle = (exercise: string, index: number) => {
    const muscles = currentMuscles(exercise).filter((_, i) => i !== index)
    updateMuscles(exercise, muscles)
  }

  const handleAddMuscle = (exercise: string) => {
    const muscles = [...currentMuscles(exercise), '']
    setMuscleOverrides(prev => ({ ...prev, [exercise]: muscles }))
  }

  const getDefaultSynergists = (exercise: string): { muscle: string; weight: number }[] => {
    const entry = RAW_MAP[exercise]
    return entry ? entry.secondaryMuscles.map(m => ({ muscle: m, weight: defaultWeight })) : []
  }

  const currentSynergists = (exercise: string): { muscle: string; weight: number }[] => {
    return synergistOverrides[exercise] ?? getDefaultSynergists(exercise)
  }

  const updateSynergists = (exercise: string, synergists: { muscle: string; weight: number }[]) => {
    const next = { ...synergistOverrides }
    const filtered = synergists.filter(s => s.muscle !== '')
    if (filtered.length === 0) {
      delete next[exercise]
    } else {
      next[exercise] = filtered
    }
    setSynergistOverrides(next)
    saveExerciseSynergistOverrides(next)
    notifyChange()
  }

  const handleSynergistChange = (exercise: string, index: number, field: 'muscle' | 'weight', value: string | number) => {
    const synergists = [...currentSynergists(exercise)]
    if (field === 'muscle') {
      synergists[index] = { ...synergists[index], muscle: value as string }
    } else {
      synergists[index] = { ...synergists[index], weight: Math.max(0, Math.min(1, value as number)) }
    }
    updateSynergists(exercise, synergists)
  }

  const handleRemoveSynergist = (exercise: string, index: number) => {
    const synergists = currentSynergists(exercise).filter((_, i) => i !== index)
    updateSynergists(exercise, synergists)
  }

  const handleAddSynergist = (exercise: string) => {
    const synergists = [...currentSynergists(exercise), { muscle: '', weight: defaultWeight }]
    setSynergistOverrides(prev => ({ ...prev, [exercise]: synergists }))
  }

  const handleDefaultWeightChange = (weight: number) => {
    const clamped = Math.max(0, Math.min(1, weight))
    setDefaultWeight(clamped)
    saveDefaultSynergistWeight(clamped)
    notifyChange()
  }

  const handleReset = () => {
    clearDetailedMuscleCache()
    setMuscleOverrides({})
    saveExerciseMuscleOverrides({})
    setSynergistOverrides({})
    saveExerciseSynergistOverrides({})
    setDefaultWeight(0.5)
    saveDefaultSynergistWeight(0.5)
  }

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl text-text-primary">Bài tập</h2>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs rounded-md font-medium bg-error/20 text-error hover:bg-error/30 transition-colors"
        >
          Khôi phục mặc định
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3 p-2 bg-bg-base rounded-md">
        <span className="text-xs text-text-muted">Tỷ lệ cơ phụ mặc định:</span>
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={defaultWeight}
          onChange={(e) => handleDefaultWeightChange(parseFloat(e.target.value) || 0)}
          className="w-20 bg-bg-card text-text-primary border border-border rounded px-2 py-1 text-xs text-center"
        />
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm bài tập..."
        className="w-full bg-bg-base text-text-primary border border-border rounded px-3 py-2 text-sm mb-3"
      />

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.map((exercise) => {
          const muscles = currentMuscles(exercise)
          const synergists = currentSynergists(exercise)
          const overridden = isOverridden(exercise)
          const exExpanded = expanded[exercise] ?? false
          const primaryMuscle = muscles[0] || ''

          return (
            <div
              key={exercise}
              className={`px-2 py-1.5 rounded-md text-xs ${overridden ? 'bg-accent/10' : 'bg-bg-base'}`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [exercise]: !exExpanded }))}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  {exExpanded ? '▾' : '▸'}
                </button>
                <span className="flex-1 text-text-primary truncate" title={exercise}>
                  {exercise}
                </span>
                <span className="text-text-muted text-[10px]">
                  {overridden ? '⚡ ' : ''}
                  {primaryMuscle}
                </span>
              </div>
              {exExpanded && (
                <div className="ml-6 mt-2 space-y-2">
                  <div>
                    <span className="text-text-muted text-[10px] uppercase tracking-wider">Cơ chính</span>
                    {muscles.map((muscle, idx) => (
                      <div key={idx} className="flex items-center gap-1 mt-1">
                        <select
                          value={muscle || ''}
                          onChange={(e) => handleMuscleChange(exercise, idx, e.target.value)}
                          className="flex-1 bg-bg-base text-text-primary border border-border rounded px-1 py-1 text-xs"
                        >
                          <option value="" disabled>Chọn cơ...</option>
                          {ALL_MUSCLES.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveMuscle(exercise, idx)}
                          className="text-xs text-text-muted hover:text-error transition-colors px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddMuscle(exercise)}
                      className="text-xs text-accent hover:text-accent-light transition-colors mt-1"
                    >
                      + Thêm cơ chính
                    </button>
                  </div>

                  <div>
                    <span className="text-text-muted text-[10px] uppercase tracking-wider">Cơ phụ</span>
                    {synergists.length === 0 && !synergistOverrides[exercise] && (
                      <p className="text-text-muted text-[10px] mt-1 italic">Không có cơ phụ mặc định</p>
                    )}
                    {synergists.map((syn, idx) => (
                      <div key={idx} className="flex items-center gap-1 mt-1">
                        <select
                          value={syn.muscle || ''}
                          onChange={(e) => handleSynergistChange(exercise, idx, 'muscle', e.target.value)}
                          className="flex-[2] bg-bg-base text-text-primary border border-border rounded px-1 py-1 text-xs"
                        >
                          <option value="" disabled>Chọn cơ...</option>
                          {ALL_MUSCLES.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={syn.weight}
                          onChange={(e) => handleSynergistChange(exercise, idx, 'weight', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-bg-base text-text-primary border border-border rounded px-1 py-1 text-xs text-center"
                        />
                        <button
                          onClick={() => handleRemoveSynergist(exercise, idx)}
                          className="text-xs text-text-muted hover:text-error transition-colors px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddSynergist(exercise)}
                      className="text-xs text-accent hover:text-accent-light transition-colors mt-1"
                    >
                      + Thêm cơ phụ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-text-muted text-center py-4">
          Không tìm thấy bài tập "{search}"
        </p>
      )}
    </div>
  )
}
