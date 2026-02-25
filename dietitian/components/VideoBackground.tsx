'use client'

import { useEffect, useRef, useState } from 'react'

// Same LA Fitness video as admin (local copy in public/videos/)
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

  if (error) return null

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
