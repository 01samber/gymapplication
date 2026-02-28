'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  Utensils, 
  Activity, 
  TrendingUp,
  Apple,
  CheckCircle2,
  Clock,
  ChevronLeft
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import FlipCard from '@/components/FlipCard'

interface Stats {
  totalClients: number
  activePlans: number
  pendingLogs: number
  avgCompliance: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activePlans: 0,
    pendingLogs: 0,
    avgCompliance: 0
  })
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: clients, error } = await supabase
          .from('client_dietitian_assignments')
          .select(`
            id,
            assigned_at,
            notes,
            client:client_id(
              id,
              email,
              full_name,
              phone,
              gender,
              date_of_birth
            )
          `)
          .eq('dietitian_id', user.id)
          .eq('is_active', true)
        
        if (clients) {
          setRecentClients(clients.slice(0, 5))
          setStats(prev => ({ ...prev, totalClients: clients.length }))
        }

        const { count: plansCount } = await supabase
          .from('diet_plans')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        setStats(prev => ({ ...prev, activePlans: plansCount || 0 }))

        const { count: logsCount } = await supabase
          .from('meal_logs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        setStats(prev => ({ ...prev, pendingLogs: logsCount || 0 }))

      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const statCards = [
    { title: 'Total Clients', value: stats.totalClients, icon: Users, color: 'bg-amber-600/20 text-amber-700', link: '/dashboard/clients' },
    { title: 'Active Plans', value: stats.activePlans, icon: Utensils, color: 'bg-primary/20 text-primary', link: '/dashboard/diet-plans' },
    { title: 'Pending Reviews', value: stats.pendingLogs, icon: Clock, color: 'bg-amber-500/20 text-amber-600', link: '/dashboard/diet-plans' },
    { title: 'Avg Compliance', value: `${stats.avgCompliance || 85}%`, icon: TrendingUp, color: 'bg-amber-700/20 text-amber-800', link: '/dashboard/clients' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero - book cover style */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-amber-50 paper-stack">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-400/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-600/30 rounded-2xl border border-amber-500/30">
              <Activity className="w-10 h-10 text-amber-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome Back!</h1>
              <p className="text-amber-100/90">Here&apos;s what&apos;s happening with your clients today.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - flip cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <FlipCard
            key={stat.title}
            front={
              <div className="flex items-start justify-between h-full">
                <div>
                  <p className="text-ink-muted text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-ink mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            }
            back={
              <div className="flex flex-col justify-center h-full text-center">
                <p className="text-ink-muted text-sm mb-3">View details</p>
                <a
                  href={stat.link}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary font-medium rounded-lg hover:bg-primary/30 transition-colors"
                >
                  <span>Go</span>
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </a>
              </div>
            }
            className="card-hover"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients - page card */}
        <div className="page-card paper-stack overflow-hidden">
          <div className="p-6 border-b border-amber-900/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Recent Clients</h2>
              <a 
                href="/dashboard/clients" 
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
              >
                View All
              </a>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-ink-muted">Loading...</div>
            ) : recentClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-amber-300 mx-auto mb-3" />
                <p className="text-ink-muted">No clients assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentClients.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-amber-900/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <span className="text-sm font-semibold text-primary">
                        {assignment.client?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-ink">
                        {assignment.client?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {assignment.client?.email || ''}
                      </p>
                    </div>
                    <a 
                      href={`/dashboard/clients/${assignment.client?.id}`}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - flip cards */}
        <div className="page-card paper-stack overflow-hidden">
          <div className="p-6 border-b border-amber-900/10">
            <h2 className="text-lg font-semibold text-ink">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              { href: '/dashboard/body-analysis', icon: Activity, label: 'Add Body Analysis' },
              { href: '/dashboard/diet-plans', icon: Utensils, label: 'Create Diet Plan' },
              { href: '/dashboard/foods', icon: Apple, label: 'Add Food' },
              { href: '/dashboard/clients', icon: Users, label: 'View Clients' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="p-4 rounded-xl border-2 border-dashed border-amber-900/20 hover:border-primary hover:bg-primary/5 transition-all text-center group"
              >
                <action.icon className="w-8 h-8 text-ink-muted group-hover:text-primary mx-auto mb-2" />
                <p className="font-medium text-ink group-hover:text-primary text-sm">{action.label}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Pro Tip - bookmark style */}
      <div className="page-card p-6 border-l-4 border-primary bg-amber-50/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-ink">Pro Tip</h3>
            <p className="text-ink-muted mt-1">
              Review your clients&apos; meal logs daily to provide timely feedback and improve compliance rates.
              Regular check-ins help clients stay motivated and on track with their nutrition goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
