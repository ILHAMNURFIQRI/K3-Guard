import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { AssistantOrb } from './AssistantOrb'
import { SourceCitation } from './SourceCitation'
import { cn } from '@/utils/cn'

export interface ChatBubbleItem {
  id: string
  sender: 'user' | 'ai'
  text: string
  sources?: string
  timestamp: string
  isError?: boolean
}

export interface ChatMessageProps {
  message: ChatBubbleItem
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user'

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#24546A] px-4 py-3 text-[15px] leading-6 text-pure-white sm:max-w-[70%]">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <span className="mt-1 block text-right text-[11px] text-pure-white/65">{message.timestamp}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AssistantOrb size={32} animated={false} className="mt-0.5 shrink-0" />
      <div className="min-w-0 max-w-[92%] flex-1">
        {message.isError ? (
          <div className="flex items-start gap-2 rounded-2xl border border-critical/30 bg-critical/10 px-4 py-3 text-sm font-medium text-critical">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        ) : (
          <p className={cn('whitespace-pre-wrap break-words text-[15px] leading-7 text-charcoal')}>
            {message.text}
          </p>
        )}
        {message.sources && <SourceCitation sources={message.sources} />}
        <span className="mt-1.5 block text-[11px] text-muted-gray">{message.timestamp}</span>
      </div>
    </motion.div>
  )
}
