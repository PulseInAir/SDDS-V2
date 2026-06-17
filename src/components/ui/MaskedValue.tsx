import React from 'react'

interface MaskedValueProps {
  value: string | null
  isPrivacyMode: boolean
  maskChar?: string
  visibleCount?: number
}

export function MaskedValue({ value, isPrivacyMode, maskChar = '•', visibleCount = 4 }: MaskedValueProps) {
  if (!value) return <span className="text-gray-400 italic">Not set</span>
  
  if (!isPrivacyMode) {
    return <span>{value}</span>
  }

  const length = value.length
  if (length <= visibleCount) return <span>{value}</span>

  const maskedPart = value.slice(0, length - visibleCount).replace(/./g, maskChar)
  const visiblePart = value.slice(-visibleCount)

  return (
    <span className="font-mono tracking-wider">
      {maskedPart}{visiblePart}
    </span>
  )
}
