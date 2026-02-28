'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, BookOpen, Lock, Mail } from 'lucide-react'
import VideoBackground from '@/components/VideoBackground'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (signInError) throw signInError

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

      if (profileError) throw profileError

      if (profile.role !== 'dietitian' && profile.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Access denied. This portal is for dietitians only.')
      }

      const needsPasswordChange = data.user?.user_metadata?.needs_password_change === true
      if (needsPasswordChange) {
        router.push('/set-password')
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0">
        <VideoBackground />
      </div>

      {/* Left side - Branding (flipbook style) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">SweatBox Nutrition</h1>
              <p className="text-ink-muted text-sm">Dietitian Portal</p>
            </div>
          </div>
        </div>

        <div className="text-ink">
          <h2 className="text-4xl font-bold mb-4">
            Empower Your Clients<br />With Better Nutrition
          </h2>
          <p className="text-ink-muted text-lg max-w-md">
            Professional nutrition management platform integrated with SweatBox Gym. 
            Track body composition, create meal plans, and monitor client progress.
          </p>
        </div>

        <div className="flex gap-8 text-ink">
          <div>
            <p className="text-3xl font-bold text-primary">500+</p>
            <p className="text-ink-muted text-sm">Active Clients</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">1000+</p>
            <p className="text-ink-muted text-sm">Meal Plans</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">85%</p>
            <p className="text-ink-muted text-sm">Compliance Rate</p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md bg-paper-light border border-amber-900/20 rounded-2xl shadow-xl p-8 paper-stack">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">SweatBox Nutrition</h1>
              <p className="text-ink-muted text-sm">Dietitian Portal</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-ink">Welcome Back</h2>
            <p className="text-ink-muted mt-2">Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dietitian@sweatboxgym.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-paper border border-amber-900/15 rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-paper border border-amber-900/15 rounded-xl text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-amber-50 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
