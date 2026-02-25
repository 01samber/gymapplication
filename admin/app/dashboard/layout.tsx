'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import VideoBackground from '@/components/VideoBackground'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

const AUTH_TIMEOUT_MS = 8000

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const loadingRef = useRef(true)

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (loadingRef.current) {
        setTimedOut(true)
        setLoading(false)
      }
    }, AUTH_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Auth session error:', sessionError)
        setLoading(false)
        router.replace('/')
        return
      }

      if (!session) {
        router.replace('/')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        if (profileError.code === 'PGRST116' || profileError.message?.includes('relation') || profileError.message?.includes('JWT')) {
          await supabase.auth.signOut()
        }
        setLoading(false)
        router.replace('/')
        return
      }

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        router.replace('/')
        return
      }

      setAuthorized(true)
    } catch (err: any) {
      console.error('Auth check error:', err)
      setLoading(false)
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (timedOut) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-dark">
        <div className="text-center max-w-md px-6">
          <p className="text-gray-300 mb-2">Taking too long to connect.</p>
          <p className="text-gray-500 text-sm mb-4">
            Check that Supabase is configured in .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-light transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-dark">
        <div className="text-center">
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen relative overflow-hidden">
      <VideoBackground />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex flex-1 w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
