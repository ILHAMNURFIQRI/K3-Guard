import React from 'react'
import { BarChart3 } from 'lucide-react'
import { EmptyState } from './EmptyState'

export interface ChartPoint {
  label: string
  value: number
  color?: string
}

const DEFAULT_COLORS = [
  '#24546A',
  '#F28C28',
  '#3B7894',
  '#2E7D32',
  '#D99A00',
  '#C62828',
]

export const LineChartCard: React.FC<{
  title: string
  subtitle?: string
  data: ChartPoint[]
  emptyMessage?: string
}> = ({ title, subtitle, data, emptyMessage }) => {
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="font-heading text-base font-bold text-charcoal">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted-gray">{subtitle}</p>}
        </div>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="Belum ada data grafik"
          description={
            emptyMessage || 'Grafik tren harian akan tampil saat ada kejadian.'
          }
          className="py-8"
        />
      </div>
    )
  }

  const width = 560
  const height = 220
  const padLeft = 36
  const padRight = 18
  const padTop = 18
  const padBottom = 34
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padLeft + chartW / 2
        : padLeft + (i / (data.length - 1)) * chartW
    const y = padTop + chartH - (d.value / maxVal) * chartH
    return { x, y, ...d }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(
    padTop + chartH
  ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
      <div className="mb-4">
        <h3 className="font-heading text-base font-bold text-charcoal">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-gray">{subtitle}</p>}
      </div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full min-w-[360px]"
          role="img"
          aria-label={title}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + chartH * (1 - t)
            const tickVal = Math.round(maxVal * t)
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--color-charcoal)"
                  strokeOpacity={0.08}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-muted-gray)"
                >
                  {tickVal}
                </text>
              </g>
            )
          })}
          <path d={areaD} fill="#24546A" fillOpacity={0.08} />
          <path
            d={pathD}
            fill="none"
            stroke="#24546A"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill="var(--color-surface)"
                stroke="#F28C28"
                strokeWidth={2.5}
              />
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-muted-gray)"
              >
                {p.label}
              </text>
              <title>{`${p.label}: ${p.value}`}</title>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

export const BarChartCard: React.FC<{
  title: string
  subtitle?: string
  data: ChartPoint[]
  emptyMessage?: string
}> = ({ title, subtitle, data, emptyMessage }) => {
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="font-heading text-base font-bold text-charcoal">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted-gray">{subtitle}</p>}
        </div>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="Belum ada data kategori"
          description={
            emptyMessage || 'Distribusi pelanggaran akan tampil saat ada data.'
          }
          className="py-8"
        />
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
      <div className="mb-4">
        <h3 className="font-heading text-base font-bold text-charcoal">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-gray">{subtitle}</p>}
      </div>
      <div className="space-y-3.5">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / maxVal) * 100)
          const color =
            item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-charcoal truncate pr-2">
                  {item.label}
                </span>
                <span className="font-semibold text-charcoal">
                  {item.value}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-off-white">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const PieChartCard: React.FC<{
  title: string
  subtitle?: string
  data: ChartPoint[]
  emptyMessage?: string
}> = ({ title, subtitle, data, emptyMessage }) => {
  const filtered = data.filter((d) => d.value > 0)
  const total = filtered.reduce((acc, d) => acc + d.value, 0)

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="font-heading text-base font-bold text-charcoal">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted-gray">{subtitle}</p>}
        </div>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="Belum ada data area"
          description={
            emptyMessage || 'Proporsi kejadian per area belum tersedia.'
          }
          className="py-8"
        />
      </div>
    )
  }

  let currentAngle = 0
  const slices = filtered.map((d, idx) => {
    const ratio = d.value / total
    const angle = ratio * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle
    return {
      ...d,
      ratio,
      startAngle,
      endAngle,
      color: d.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    }
  })

  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  const arcPath = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    if (endAngle - startAngle >= 359.99) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
    }
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
  }

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-surface p-5 shadow-xs">
      <div className="mb-4">
        <h3 className="font-heading text-base font-bold text-charcoal">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-gray">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
          {slices.map((s) => (
            <path
              key={s.label}
              d={arcPath(80, 80, 68, s.startAngle, s.endAngle)}
              fill={s.color}
              stroke="var(--color-surface)"
              strokeWidth={2}
            >
              <title>{`${s.label}: ${s.value} (${Math.round(
                s.ratio * 100
              )}%)`}</title>
            </path>
          ))}
          <circle cx="80" cy="80" r="36" fill="var(--color-surface)" />
          <text
            x="80"
            y="77"
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            fill="var(--color-charcoal)"
          >
            {total}
          </text>
          <text
            x="80"
            y="93"
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-muted-gray)"
          >
            Total
          </text>
        </svg>

        <div className="w-full space-y-2">
          {slices.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate font-medium text-charcoal">
                  {s.label}
                </span>
              </div>
              <span className="font-semibold text-muted-gray">
                {s.value} ({Math.round(s.ratio * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
