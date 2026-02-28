'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Bell, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)
  const [headerSearch, setHeaderSearch] = useState('')

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          setUser(profile)
        }
      }
    }
    fetchUser()
  }, [])

  return (
    <header className="h-16 bg-paper-light/95 backdrop-blur-sm border-b border-amber-900/10 px-6 flex items-center justify-between shadow-sm">
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
        <input
          type="text"
          placeholder="Search clients, foods..."
          value={headerSearch}
          onChange={(e) => setHeaderSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && headerSearch.trim()) {
              router.push(`/dashboard/clients?q=${encodeURIComponent(headerSearch.trim())}`)
            }
          }}
          className="w-full pl-10 pr-4 py-2 bg-paper border border-amber-900/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-ink text-sm placeholder-ink-muted"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-ink-muted text-sm">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>

        <button className="relative p-2 text-ink-muted hover:text-ink hover:bg-amber-900/5 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-amber-900/15">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="text-sm font-semibold text-primary">
              {user?.full_name?.charAt(0) || 'D'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-ink">{user?.full_name || 'Dietitian'}</p>
            <p className="text-xs text-ink-muted">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
