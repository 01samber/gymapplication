'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Calendar, 
  CreditCard,
  BarChart3,
  Settings,
  Dumbbell,
  LogOut,
  ClipboardCheck,
  MessageSquare,
  Gift,
  Dumbbell as ExerciseIcon,
  UserPlus,
  Apple,
  Salad,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation: { name: string; href: string; icon: any; highlight?: boolean }[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Registrations', href: '/dashboard/registrations', icon: UserPlus, highlight: true },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Trainers', href: '/dashboard/trainers', icon: UserCog },
  { name: 'Nutritionists', href: '/dashboard/nutritionists', icon: Salad },
  { name: 'Specializations', href: '/dashboard/specializations', icon: Tag },
  { name: 'Client Nutrition', href: '/dashboard/clients', icon: Apple },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { name: 'Exercises', href: '/dashboard/exercises', icon: ExerciseIcon },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: CreditCard },
  { name: 'Requests', href: '/dashboard/requests', icon: MessageSquare },
  { name: 'Loyalty', href: '/dashboard/loyalty', icon: Gift },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchPendingCount()
    
    // Set up real-time subscription for new registrations
    const channel = supabase
      .channel('registration_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'registration_requests' 
      }, () => {
        fetchPendingCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    setPendingCount(count || 0)
  }

  return (
    <aside className="w-64 glass border-r border-white/10 flex flex-col min-h-0">
      {/* Logo */}
      <div className="h-16 flex-shrink-0 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-white font-bold text-lg tracking-wide">SweatBox</h1>
          <p className="text-gray-500 text-xs">Command Center</p>
        </div>
      </div>

      {/* Navigation - scrollable */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto min-h-0">
        {navigation.map((item) => {
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard'
            : pathname === item.href || pathname?.startsWith(item.href + '/')
          const showBadge = item.name === 'Registrations' && pendingCount > 0
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors relative border-l-2 border-transparent',
                isActive
                  ? 'bg-primary/30 text-primary border-l-primary'
                  : item.highlight && pendingCount > 0
                    ? 'text-accent-red hover:bg-white/10 hover:text-accent-red-light'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
              {showBadge && (
                <span className="ml-auto px-2 py-0.5 bg-accent-red/30 text-accent-red-light text-xs font-bold rounded animate-pulse border border-accent-red/50">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded glass-subtle flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">EB</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Elias Boustany</p>
            <p className="text-gray-500 text-xs truncate">Admin</p>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
