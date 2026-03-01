'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, Calendar, Loader2, Download, Apple, Utensils, CheckCircle2, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'business' | 'nutrition'>('business')
  const [stats, setStats] = useState({
    totalRevenue: 0,
    newMembers: 0,
    totalSessions: 0,
    retention: 0,
    revenueByMonth: [] as { month: string, amount: number }[],
    membersByMonth: [] as { month: string, count: number }[],
  })
  const [nutritionStats, setNutritionStats] = useState({
    totalDietPlans: 0,
    activeDietPlans: 0,
    totalClients: 0,
    clientsWithPlans: 0,
    avgCompletionRate: 0,
    plansByType: { weekly: 0, monthly: 0 },
    mealLogsThisWeek: 0,
    popularMealTypes: [] as { type: string, count: number }[],
  })

  useEffect(() => {
    fetchReportData()
    fetchNutritionData()
  }, [])

  async function fetchReportData() {
    setLoading(true)
    try {
      // Get active subscriptions for revenue
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('price_usd, created_at, status')
      
      // Get members
      const { data: members } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('role', 'client')
      
      // Get completed bookings
      const { count: sessions } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      
      // Calculate stats
      const totalRevenue = subs?.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price_usd || 0), 0) || 0
      
      // New members this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const newMembers = members?.filter(m => new Date(m.created_at) >= thisMonth).length || 0
      
      // Active vs total for retention
      const activeCount = subs?.filter(s => s.status === 'active').length || 0
      const totalSubs = subs?.length || 1
      const retention = Math.round((activeCount / totalSubs) * 100)

      // Revenue by month (last 6 months)
      const revenueByMonth: { month: string, amount: number }[] = []
      const membersByMonth: { month: string, count: number }[] = []
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = date.toLocaleDateString('en-US', { month: 'short' })
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthRevenue = subs?.filter(s => {
          const created = new Date(s.created_at)
          return created >= monthStart && created <= monthEnd
        }).reduce((sum, s) => sum + (s.price_usd || 0), 0) || 0
        
        const monthMembers = members?.filter(m => {
          const created = new Date(m.created_at)
          return created >= monthStart && created <= monthEnd
        }).length || 0
        
        revenueByMonth.push({ month: monthStr, amount: monthRevenue })
        membersByMonth.push({ month: monthStr, count: monthMembers })
      }

      setStats({
        totalRevenue,
        newMembers,
        totalSessions: sessions || 0,
        retention,
        revenueByMonth,
        membersByMonth,
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNutritionData() {
    try {
      // Get all diet plans
      const { data: dietPlans } = await supabase
        .from('diet_plans')
        .select('id, status, plan_type, client_id')
      
      // Get all clients
      const { data: clients } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'client')
      
      // Get meal commitments
      const { data: commitments } = await supabase
        .from('meal_commitments')
        .select('is_committed')
      
      // Get meal logs from this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: mealLogs } = await supabase
        .from('meal_logs')
        .select('meal_type')
        .gte('meal_date', weekAgo.toISOString().split('T')[0])
      
      // Get diet plan meals for popular meal types
      const { data: planMeals } = await supabase
        .from('diet_plan_meals')
        .select('meal_type')
      
      // Calculate stats
      const totalDietPlans = dietPlans?.length || 0
      const activeDietPlans = dietPlans?.filter(p => p.status === 'active').length || 0
      const totalClients = clients?.length || 0
      const uniqueClientsWithPlans = new Set(dietPlans?.map(p => p.client_id) || []).size
      
      // Commitment rate
      const totalCommitments = commitments?.length || 0
      const completedCommitments = commitments?.filter(c => c.is_committed).length || 0
      const avgCompletionRate = totalCommitments > 0 
        ? Math.round((completedCommitments / totalCommitments) * 100) 
        : 0
      
      // Plan types
      const weekly = dietPlans?.filter(p => p.plan_type === 'weekly').length || 0
      const monthly = dietPlans?.filter(p => p.plan_type === 'monthly').length || 0
      
      // Meal type distribution
      const mealTypeCounts: Record<string, number> = {}
      planMeals?.forEach(m => {
        mealTypeCounts[m.meal_type] = (mealTypeCounts[m.meal_type] || 0) + 1
      })
      const popularMealTypes = Object.entries(mealTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      setNutritionStats({
        totalDietPlans,
        activeDietPlans,
        totalClients,
        clientsWithPlans: uniqueClientsWithPlans,
        avgCompletionRate,
        plansByType: { weekly, monthly },
        mealLogsThisWeek: mealLogs?.length || 0,
        popularMealTypes,
      })
    } catch (error) {
      console.error('Error fetching nutrition data:', error)
    }
  }

  function exportReport() {
    const data = {
      generatedAt: new Date().toISOString(),
      stats: {
        totalMonthlyRevenue: stats.totalRevenue,
        newMembersThisMonth: stats.newMembers,
        completedSessions: stats.totalSessions,
        retentionRate: stats.retention + '%',
      },
      revenueByMonth: stats.revenueByMonth,
      membersByMonth: stats.membersByMonth,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sweatbox-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading reports...</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...stats.revenueByMonth.map(r => r.amount), 1)
  const maxMembers = Math.max(...stats.membersByMonth.map(m => m.count), 1)
  const maxMealType = Math.max(...nutritionStats.popularMealTypes.map(m => m.count), 1)

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: 'Breakfast',
      morning_snack: 'Morning Snack',
      lunch: 'Lunch',
      afternoon_snack: 'Afternoon Snack',
      dinner: 'Dinner',
      evening_snack: 'Evening Snack',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - matches Subscriptions */}
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">Reports</h1>
            <p className="text-gray-400">Analytics and insights for your gym</p>
          </div>
          <button 
            onClick={exportReport}
            className="flex items-center gap-2 px-6 py-3 glass-button text-white rounded-xl font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="glass-card rounded-lg p-4 shadow-sm">
        <div className="flex glass-subtle rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('business')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'business' ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Business Analytics
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'nutrition' ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            Nutrition Analytics
          </button>
        </div>
      </div>

      {activeTab === 'business' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">New Members</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.newMembers}</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed Sessions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalSessions}</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Retention Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.retention}%</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-white mb-4">Revenue (Last 6 Months)</h3>
              <div className="h-64 flex items-end justify-between gap-2 pt-8">
                {stats.revenueByMonth.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-500 font-medium">${item.amount}</div>
                    <div 
                      className="w-full bg-primary rounded-t-lg transition-all"
                      style={{ height: `${(item.amount / maxRevenue) * 180}px`, minHeight: item.amount > 0 ? '20px' : '4px' }}
                    />
                    <div className="text-xs text-gray-500">{item.month}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-white mb-4">New Members (Last 6 Months)</h3>
              <div className="h-64 flex items-end justify-between gap-2 pt-8">
                {stats.membersByMonth.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-500 font-medium">{item.count}</div>
                    <div 
                      className="w-full bg-primary rounded-t-lg transition-all"
                      style={{ height: `${(item.count / maxMembers) * 180}px`, minHeight: item.count > 0 ? '20px' : '4px' }}
                    />
                    <div className="text-xs text-gray-500">{item.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Nutrition Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Diet Plans</p>
                  <p className="text-2xl font-bold text-white mt-1">{nutritionStats.activeDietPlans}</p>
                  <p className="text-xs text-gray-400 mt-1">of {nutritionStats.totalDietPlans} total</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <Apple className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Clients with Plans</p>
                  <p className="text-2xl font-bold text-white mt-1">{nutritionStats.clientsWithPlans}</p>
                  <p className="text-xs text-gray-400 mt-1">of {nutritionStats.totalClients} clients</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Completion Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{nutritionStats.avgCompletionRate}%</p>
                  <p className="text-xs text-gray-400 mt-1">meal commitments</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Meal Logs This Week</p>
                  <p className="text-2xl font-bold text-white mt-1">{nutritionStats.mealLogsThisWeek}</p>
                  <p className="text-xs text-gray-400 mt-1">entries logged</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-white mb-4">Plan Types Distribution</h3>
              <div className="flex items-center justify-center gap-8 h-48">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">{nutritionStats.plansByType.weekly}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400 font-medium">Weekly Plans</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">{nutritionStats.plansByType.monthly}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400 font-medium">Monthly Plans</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-white mb-4">Popular Meal Types</h3>
              <div className="space-y-3">
                {nutritionStats.popularMealTypes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No meal data available</p>
                ) : (
                  nutritionStats.popularMealTypes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-400">{getMealTypeLabel(item.type)}</div>
                      <div className="flex-1 glass-subtle rounded-full h-6 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-end px-2"
                          style={{ width: `${(item.count / maxMealType) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="glass-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-white mb-4">Nutrition Program Insights</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 glass-subtle rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  <span className="font-medium text-white">Coverage</span>
                </div>
                <p className="text-sm text-gray-400">
                  {nutritionStats.totalClients > 0 
                    ? Math.round((nutritionStats.clientsWithPlans / nutritionStats.totalClients) * 100)
                    : 0}% of clients have diet plans assigned
                </p>
              </div>
              <div className="p-4 glass-subtle rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium text-white">Plan Duration</span>
                </div>
                <p className="text-sm text-gray-400">
                  {nutritionStats.plansByType.weekly > nutritionStats.plansByType.monthly 
                    ? 'Weekly plans are more popular'
                    : nutritionStats.plansByType.monthly > nutritionStats.plansByType.weekly
                      ? 'Monthly plans are more popular'
                      : 'Equal distribution of plan types'}
                </p>
              </div>
              <div className="p-4 glass-subtle rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium text-white">Commitment</span>
                </div>
                <p className="text-sm text-gray-400">
                  {nutritionStats.avgCompletionRate >= 80 
                    ? 'Excellent commitment rate!'
                    : nutritionStats.avgCompletionRate >= 50
                      ? 'Good commitment, room to improve'
                      : 'Focus on improving client adherence'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
