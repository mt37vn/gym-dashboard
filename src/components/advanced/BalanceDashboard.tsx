import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { BalanceResult } from '../../lib/analytics/types'

interface Props {
  data: BalanceResult | null
}

type Mode = 'volume' | 'sets'

const CAT_COLORS: Record<string, string> = {
  Push: '#d97706',
  Pull: '#22c55e',
  Legs: '#3b82f6',
}
const CAT_LABELS: Record<string, string> = {
  Push: 'Đẩy',
  Pull: 'Kéo',
  Chân: 'Chân',
}

const EQ_COLORS: Record<string, string> = {
  Freeweight: '#d97706',
  Machine: '#a855f7',
  Bodyweight: '#22c55e',
}
const EQ_LABELS: Record<string, string> = {
  Freeweight: 'Tự do',
  Machine: 'Máy/Cáp',
  Bodyweight: 'TLCT',
}

const REP_COLORS: Record<string, string> = {
  Strength: '#ef4444',
  Hypertrophy: '#d97706',
  Endurance: '#0ea5e9',
}
const REP_LABELS: Record<string, string> = {
  Strength: 'Sức mạnh',
  Hypertrophy: 'Phì đại',
  Endurance: 'Bền',
}

function DonutCard({
  title,
  entries,
  colorMap,
  labelMap,
  mode,
  nameKey,
}: {
  title: string
  entries: { name: string; value: number }[]
  colorMap: Record<string, string>
  labelMap: Record<string, string>
  mode: Mode
  nameKey: string
}) {
  const total = entries.reduce((s, d) => s + d.value, 0)
  const unit = mode === 'volume' ? 'kg' : 'set'

  if (total === 0) {
    return (
      <div className="bg-bg-card rounded-lg p-4 border border-border">
        <h2 className="font-display text-xl text-text-primary mb-4">{title}</h2>
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">
          Không có dữ liệu
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-card rounded-lg p-4 border border-border">
      <h2 className="font-display text-xl text-text-primary mb-2">{title}</h2>
      <div className="flex flex-col items-center gap-3">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
            >
              {entries.map((entry, i) => (
                <Cell key={i} fill={colorMap[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                color: '#f4f4f5',
                fontSize: 12,
              }}
              formatter={((value: number) => [
                `${Math.round((value / total) * 100)}% (${Math.round(value).toLocaleString()} ${unit})`,
              ]) as any}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          {entries.map((d) => {
            const pct = Math.round((d.value / total) * 100)
            return (
              <span key={d.name} className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: colorMap[d.name] }}
                />
                <span className="text-text-muted">{labelMap[d.name]}</span>
                <span className="text-text-primary font-medium font-display">{pct}%</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function BalanceDashboard({ data }: Props) {
  const [mode, setMode] = useState<Mode>('volume')

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-lg p-4 border border-border animate-pulse">
              <div className="h-4 bg-bg-card-hover rounded w-24 mb-4" />
              <div className="h-48 bg-bg-card-hover rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const muscleData = data.muscleGroups.map((g) => ({ name: g.category, category: g.category, volume: g.volume, sets: g.sets }))
  const equipData = data.equipment.map((e) => ({ name: e.type, type: e.type, volume: e.volume, sets: e.sets }))
  const repData = data.repRanges.map((r) => ({ name: r.range, range: r.range, volume: r.volume, sets: r.sets }))

  return (
    <div className="space-y-4">
      <div className="flex bg-bg-base rounded-lg p-0.5 gap-0.5 w-fit">
        <button
          onClick={() => setMode('volume')}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            mode === 'volume'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Theo khối lượng
        </button>
        <button
          onClick={() => setMode('sets')}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            mode === 'sets'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Theo set
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutCard
          title="Chức Năng"
          entries={muscleData.map((d) => ({ name: d.name, value: mode === 'volume' ? d.volume : d.sets }))}
          colorMap={CAT_COLORS}
          labelMap={CAT_LABELS}
          mode={mode}
          nameKey="name"
        />
        <DonutCard
          title="Loại tạ"
          entries={equipData.map((d) => ({ name: d.name, value: mode === 'volume' ? d.volume : d.sets }))}
          colorMap={EQ_COLORS}
          labelMap={EQ_LABELS}
          mode={mode}
          nameKey="name"
        />
        <DonutCard
          title="Rep range"
          entries={repData.map((d) => ({ name: d.name, value: mode === 'volume' ? d.volume : d.sets }))}
          colorMap={REP_COLORS}
          labelMap={REP_LABELS}
          mode={mode}
          nameKey="name"
        />
      </div>
    </div>
  )
}
