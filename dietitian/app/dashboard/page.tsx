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
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Get clients directly from database
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

        // Get active diet plans count
        const { count: plansCount } = await supabase
          .from('diet_plans')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        setStats(prev => ({ ...prev, activePlans: plansCount || 0 }))

        // Get pending meal logs
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
    { 
      title: 'Total Clients', 
      value: stats.totalClients, 
      icon: Users, 
      color: 'bg-blue-500',
      trend: '+3 this week'
    },
    { 
      title: 'Active Plans', 
      value: stats.activePlans, 
      icon: Utensils, 
      color: 'bg-green-500',
      trend: 'Updated today'
    },
    { 
      title: 'Pending Reviews', 
      value: stats.pendingLogs, 
      icon: Clock, 
      color: 'bg-amber-500',
      trend: 'Needs attention'
    },
    { 
      title: 'Avg Compliance', 
      value: `${stats.avgCompliance || 85}%`, 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      trend: '+5% this month'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Activity className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome Back!</h1>
              <p className="text-white/80">Here's what's happening with your clients today.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div 
            key={stat.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-2">{stat.trend}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Clients</h2>
              <a 
                href="/dashboard/clients" 
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                View All
              </a>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No clients assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentClients.map((assignment) => (
                  <div 
                    key={assignment.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {assignment.client?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {assignment.client?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
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

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <a
              href="/dashboard/body-analysis"
              className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-center group"
            >
              <Activity className="w-8 h-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="font-medium text-gray-700 group-hover:text-primary">Add Body Analysis</p>
            </a>
            <a
              href="/dashboard/diet-plans"
              className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-center group"
            >
              <Utensils className="w-8 h-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="font-medium text-gray-700 group-hover:text-primary">Create Diet Plan</p>
            </a>
            <a
              href="/dashboard/foods"
              className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-center group"
            >
              <Apple className="w-8 h-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="font-medium text-gray-700 group-hover:text-primary">Add Food</p>
            </a>
            <a
              href="/dashboard/clients"
              className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-center group"
            >
              <Users className="w-8 h-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="font-medium text-gray-700 group-hover:text-primary">View Clients</p>
            </a>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Pro Tip</h3>
            <p className="text-gray-600 mt-1">
              Review your clients' meal logs daily to provide timely feedback and improve compliance rates.
              Regular check-ins help clients stay motivated and on track with their nutrition goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
