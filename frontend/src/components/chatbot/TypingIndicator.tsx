import React from 'react'
import { motion } from 'framer-motion'
import { AssistantOrb } from './AssistantOrb'

export const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-3" role="status" aria-label="Asisten sedang menyusun jawaban">
    <AssistantOrb size={32} thinking className="shrink-0" />
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-steel-blue"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
      <span className="ml-2 text-xs text-muted-gray">Membaca SOP</span>
    </div>
  </div>
)
