'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CopyableRefProps {
  value: string
  label?: string
  className?: string
}

export function CopyableRef({ value, label, className }: CopyableRefProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      toast.success(`${label ?? 'Reference'} copied`)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-sm text-gray-800 hover:text-[#08163d] transition-colors group',
        className
      )}
      title="Copy to clipboard"
    >
      <span>{value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  )
}
