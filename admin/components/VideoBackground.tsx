'use client'

import { useEffect, useRef, useState } from 'react'

// Local MP4 in public/videos/ - add gym.mp4 to admin/public/videos/
const VIDEO_SRC = '/videos/gym.mp4'

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || error) return
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.play().catch(() => setError(true))
  }, [error])

  // Gradient fallback when video fails or missing - matches dark theme
  if (error) {
    return (
      <div
        className="absolute inset-0 w-full h-full bg-[#0a0a0a]"
        style={{
          background: 'linear-gradient(135deg, rgba(0,166,81,0.08) 0%, rgba(10,10,10,0.95) 40%, rgba(193,39,45,0.06) 100%)',
        }}
      />
    )
  }

  return (
    <>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-black/20" />
    </>
  )
}
