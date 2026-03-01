'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import VideoBackground from '@/components/VideoBackground'
import { Activity, Lock01 } from '@untitled-ui/icons-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [escapeMode, setEscapeMode] = useState(false)
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const escapeModeRef = useRef(false)
  escapeModeRef.current = escapeMode

  // Use window mousemove to avoid stale closures and ensure events are captured
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!escapeModeRef.current || !buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const buttonCenterX = rect.left + rect.width / 2
      const buttonCenterY = rect.top + rect.height / 2
      const mouseX = e.clientX
      const mouseY = e.clientY
      const dx = buttonCenterX - mouseX
      const dy = buttonCenterY - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      // When mouse is within 160px of button center, button drifts away
      if (dist < 160 && dist > 5) {
        const strength = (160 - dist) / 160
        const moveX = (dx / dist) * 120 * strength
        const moveY = (dy / dist) * 120 * strength
        setButtonOffset({
          x: Math.max(-200, Math.min(200, moveX)),
          y: Math.max(-150, Math.min(150, moveY))
        })
      } else if (dist >= 160) {
        setButtonOffset({ x: 0, y: 0 })
      }
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  useEffect(() => {
    if (!escapeMode) {
      setButtonOffset({ x: 0, y: 0 })
    }
  }, [escapeMode])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setEscapeMode(true)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Login failed. Please try again.')
        setEscapeMode(true)
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setError('Profile not found. Contact administrator.')
        await supabase.auth.signOut()
        setEscapeMode(true)
        setLoading(false)
        return
      }

      if (profile.role !== 'admin') {
        setError('Access denied. Admin privileges required.')
        await supabase.auth.signOut()
        setEscapeMode(true)
        setLoading(false)
        return
      }

      setEscapeMode(false)
      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred.')
      setEscapeMode(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-visible">
      <VideoBackground />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Hero-style card - matches Subscriptions page exactly */}
        <div className="relative overflow-visible rounded-lg glass-card p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
          <div className="relative z-10">
            {/* Logo/Title - matches subscription hero layout */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 glass-subtle rounded-lg mb-4 border border-primary/30">
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">SweatBox Gym</h1>
              <p className="text-gray-400 mt-1 text-sm">Command Center</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && !escapeMode && (
                <div className="bg-accent-red/20 backdrop-blur-sm border border-accent-red/40 text-accent-red-light px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {error && escapeMode && (
                <div className="bg-accent-red/20 backdrop-blur-sm border border-accent-red/40 text-accent-red-light px-4 py-3 rounded-lg text-sm">
                  {error} — Try clicking the button!
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass-input rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="admin@sweatboxgym.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass-input rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
              </div>

              <div className="relative pt-2 overflow-visible" style={{ minHeight: 52 }}>
                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={loading}
                  style={{
                    transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)`,
                    transition: escapeMode ? 'none' : 'transform 0.2s ease-out',
                  }}
                  className="w-full glass-button text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-primary/40 hover:border-primary/60"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Lock01 className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              © 2024 SweatBox Gym. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
