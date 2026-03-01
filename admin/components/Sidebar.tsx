'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home01,
  Users01,
  User01,
  Calendar,
  CreditCard01,
  BarChartSquare02,
  Settings01,
  LogOut01,
  ClipboardCheck,
  Gift01,
  Package,
  Receipt,
  Activity
} from '@untitled-ui/icons-react'
import { cn } from '@/lib/utils'

const navigation: { name: string; href: string; icon: any }[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home01 },
  { name: 'Members', href: '/dashboard/members', icon: Users01 },
  { name: 'Trainers', href: '/dashboard/trainers', icon: User01 },
  { name: 'Nutritionists', href: '/dashboard/nutritionists', icon: Receipt },
  { name: 'Client Nutrition', href: '/dashboard/clients', icon: Package },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { name: 'Exercises', href: '/dashboard/exercises', icon: Activity },
  { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: CreditCard01 },
  { name: 'Loyalty', href: '/dashboard/loyalty', icon: Gift01 },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChartSquare02 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings01 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 glass border-r border-white/10 flex flex-col min-h-0">
      {/* Logo */}
      <div className="h-16 flex-shrink-0 flex items-center gap-3 px-6 border-b border-white/10">
        <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
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
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors relative border-l-2 border-transparent',
                isActive
                  ? 'bg-primary/30 text-primary border-l-primary'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
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
            <LogOut01 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
