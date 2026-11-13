import React from 'react'
import { BookOpen } from 'lucide-react'

export interface SourceCitationProps {
  sources: string
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ sources }) => {
  const cleaned = sources
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (cleaned.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-gray">
        <BookOpen className="h-3.5 w-3.5 text-steel-blue" />
        Sumber
      </span>
      {cleaned.map((src, idx) => (
        <span
          key={`${src}-${idx}`}
          className="inline-flex items-center rounded-full border border-steel-blue/25 bg-steel-blue/10 px-2.5 py-0.5 text-xs font-medium text-steel-blue"
        >
          {src}
        </span>
      ))}
    </div>
  )
}
