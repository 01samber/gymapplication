'use client'

import { useState } from 'react'

interface FlipCardProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
  flipOnHover?: boolean
}

export default function FlipCard({ front, back, className = '', flipOnHover = true }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`flip-card ${flipOnHover ? '' : 'cursor-pointer'} ${className}`}
      onClick={() => !flipOnHover && setFlipped(!flipped)}
    >
      <div className={`flip-card-inner ${flipped ? 'flipped' : ''}`}>
        <div className="flip-card-front page-card p-6 h-full">
          {front}
        </div>
        <div className="flip-card-back page-card p-6 h-full">
          {back}
        </div>
      </div>
    </div>
  )
}
