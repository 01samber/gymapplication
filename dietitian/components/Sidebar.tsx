'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Home01, Users01, Activity, Receipt, Package, LogOut01, ChevronRight } from '@untitled-ui/icons-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home01 },
  { name: 'My Clients', href: '/dashboard/clients', icon: Users01 },
  { name: 'Body Analysis', href: '/dashboard/body-analysis', icon: Activity },
  { name: 'Diet Plans', href: '/dashboard/diet-plans', icon: Receipt },
  { name: 'Food Database', href: '/dashboard/foods', icon: Package },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 glass-card min-h-screen flex flex-col border-r border-white/10">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl border border-primary/40">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SweatBox</h1>
            <p className="text-xs text-gray-400">Nutrition Portal</p>
          </div>
        </div>
      </div>

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
                      ? 'bg-primary/20 text-primary border-l-2 border-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
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

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-accent-red/10 hover:text-accent-red-light transition-colors"
        >
          <LogOut01 className="w-5 h-5" />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </div>
  )
}
