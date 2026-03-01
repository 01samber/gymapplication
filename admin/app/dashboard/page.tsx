'use client'

import { useEffect, useState } from 'react'
import { 
  Users01, 
  User01, 
  Calendar, 
  CurrencyDollar, 
  ArrowUp,
  ArrowDown,
  Activity,
  Target01,
  Zap,
  Award01,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle
} from '@untitled-ui/icons-react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Stats = {
  totalMembers: number
  activeMembers: number
  totalTrainers: number
  todayBookings: number
  monthlyRevenue: number
  todayCheckIns: number
  loyaltyRewards: number
}

type RecentActivity = {
  id: string
  type: 'check_in' | 'booking' | 'subscription' | 'request'
  title: string
  description: string
  time: string
  status: 'success' | 'warning' | 'info'
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    totalTrainers: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    todayCheckIns: 0,
    loyaltyRewards: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      // Fetch all stats in parallel
      const today = new Date().toISOString().split('T')[0]
      
      const [
        membersRes,
        trainersRes,
        bookingsRes,
        subscriptionsRes,
        attendanceRes,
        loyaltyRes
      ] = await Promise.all([
        supabase.from('client_profiles').select('id, user_id', { count: 'exact' }),
        supabase.from('trainer_profiles').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('bookings').select('id', { count: 'exact' }).eq('scheduled_date', today),
        supabase.from('subscriptions').select('price_usd').eq('status', 'active'),
        supabase.from('attendance').select('id', { count: 'exact' }).gte('check_in', `${today}T00:00:00`).lt('check_in', `${today}T23:59:59`),
        supabase.from('loyalty_rewards').select('id', { count: 'exact' }).eq('status', 'pending')
      ])

      const monthlyRevenue = subscriptionsRes.data?.reduce((sum, s) => sum + (s.price_usd || 0), 0) || 0

      setStats({
        totalMembers: membersRes.count || 0,
        activeMembers: membersRes.count || 0,
        totalTrainers: trainersRes.count || 0,
        todayBookings: bookingsRes.count || 0,
        monthlyRevenue,
        todayCheckIns: attendanceRes.count || 0,
        loyaltyRewards: loyaltyRes.count || 0
      })

      // Fetch recent activity
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5)

      const activities: RecentActivity[] = (recentBookings || []).map(b => ({
        id: b.id,
        type: 'booking' as const,
        title: 'New Booking',
        description: `Session ${b.status}`,
        time: new Date(b.created_at).toLocaleTimeString(),
        status: b.status === 'confirmed' ? 'success' as const : 'info' as const
      }))

      setRecentActivity(activities)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - glass */}
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-white tracking-wide mb-2">Welcome to SweatBox</h1>
              <p className="text-gray-400 text-lg">Here's what's happening at your gym today</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-500 text-sm">Today's Date</p>
                <p className="text-xl font-bold text-primary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users01}
          trend={12}
          color="blue"
        />
        <StatCard
          title="Active Trainers"
          value={stats.totalTrainers}
          icon={User01}
          trend={5}
          color="purple"
        />
        <StatCard
          title="Today's Bookings"
          value={stats.todayBookings}
          icon={Calendar}
          trend={-3}
          color="green"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={CurrencyDollar}
          trend={18}
          color="orange"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          icon={Activity}
        />
        <MiniStatCard
          title="Loyalty Rewards"
          value={stats.loyaltyRewards}
          icon={Award01}
        />
        <MiniStatCard
          title="Active Sessions"
          value={stats.todayBookings}
          icon={Zap}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-display text-xl font-bold text-white">Recent Activity</h2>
            <p className="text-gray-500 text-sm">Latest updates from your gym</p>
          </div>
          <div className="divide-y divide-white/10">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-primary/20 border border-primary/40' : 
                    activity.status === 'warning' ? 'bg-accent-red/20 border border-accent-red/40' : 'bg-slate-600/30 border border-slate-500/50'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : activity.status === 'warning' ? (
                      <AlertCircle className="w-5 h-5 text-accent-red" />
                    ) : (
                      <Activity className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-200">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-display text-xl font-bold text-white">Quick Actions</h2>
            <p className="text-gray-500 text-sm">Common tasks</p>
          </div>
          <div className="p-4 space-y-3">
            <QuickActionButton
              icon={Users01}
              title="Add New Member"
              description="Register a new gym member"
              href="/dashboard/members"
            />
            <QuickActionButton
              icon={Calendar}
              title="Create Booking"
              description="Schedule a new session"
              href="/dashboard/bookings"
            />
            <QuickActionButton
              icon={User01}
              title="Manage Trainers"
              description="View and edit trainers"
              href="/dashboard/trainers"
            />
            <QuickActionButton
              icon={Target01}
              title="View Reports"
              description="Analytics and insights"
              href="/dashboard/reports"
            />
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="font-display text-xl font-bold text-white">Performance Overview</h2>
          <p className="text-gray-500 text-sm">Key metrics at a glance</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <PerformanceMetric
              label="Member Retention"
              value="94%"
              change={2.5}
              positive
            />
            <PerformanceMetric
              label="Avg. Sessions/Week"
              value="3.2"
              change={0.4}
              positive
            />
            <PerformanceMetric
              label="PT Utilization"
              value="78%"
              change={5}
              positive
            />
            <PerformanceMetric
              label="Revenue Growth"
              value="18%"
              change={3}
              positive
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color }: {
  title: string
  value: string | number
  icon: any
  trend: number
  color: 'blue' | 'purple' | 'green' | 'orange'
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  }

  const bgColors = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50'
  }

  return (
    <div className="glass-card rounded-lg p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded bg-primary/20 border border-primary/40`}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
          trend >= 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'
        }`}>
          {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-gray-500 text-sm mt-1">{title}</p>
      </div>
    </div>
  )
}

function MiniStatCard({ title, value, icon: Icon }: {
  title: string
  value: number
  icon: any
}) {
  return (
    <div className="glass-card rounded-lg p-5 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-gray-400 text-sm mt-1">{title}</p>
        </div>
        <div className="p-3 bg-primary/20 rounded border border-primary/40">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ icon: Icon, title, description, href }: {
  icon: any
  title: string
  description: string
  href: string
}) {

  return (
    <a href={href} className="group flex items-center gap-4 p-4 rounded hover:bg-white/10 transition-colors">
      <div className="p-3 rounded bg-primary/20 border border-primary/40 transition-colors group-hover:bg-primary/30">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-200 group-hover:text-primary transition-colors">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
    </a>
  )
}

function PerformanceMetric({ label, value, change, positive }: {
  label: string
  value: string
  change: number
  positive: boolean
}) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
      <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-medium ${
        positive ? 'text-primary' : 'text-red-400'
      }`}>
        {positive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        {change}%
      </div>
    </div>
  )
}
