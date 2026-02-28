'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  Users,
  Activity,
  Utensils,
  Apple,
  LogOut,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Body Analysis', href: '/dashboard/body-analysis', icon: Activity },
  { name: 'Diet Plans', href: '/dashboard/diet-plans', icon: Utensils },
  { name: 'Food Database', href: '/dashboard/foods', icon: Apple },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 flipbook-binding min-h-screen flex flex-col paper-stack">
      {/* Logo - book spine style */}
      <div className="p-6 border-b border-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-700/30 rounded-xl border border-amber-600/30">
            <BookOpen className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-50">SweatBox</h1>
            <p className="text-xs text-amber-200/70">Nutrition Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation - page tabs style */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-amber-700/40 text-amber-50 border-l-2 border-amber-400'
                      : 'text-amber-100/80 hover:bg-amber-800/30 hover:text-amber-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-amber-900/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-amber-100/80 hover:text-amber-50 hover:bg-amber-800/30 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
