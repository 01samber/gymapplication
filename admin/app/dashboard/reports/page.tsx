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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and insights for your gym</p>
        </div>
        <button 
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-red-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-slate-600/50 pb-4">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'business'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Business Analytics
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'nutrition'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Apple className="w-4 h-4" />
          Nutrition Analytics
        </button>
      </div>

      {activeTab === 'business' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-6">
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">New Members</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.newMembers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSessions}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Retention Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.retention}%</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <h3 className="font-semibold text-gray-900 mb-4">Revenue (Last 6 Months)</h3>
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
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <h3 className="font-semibold text-gray-900 mb-4">New Members (Last 6 Months)</h3>
              <div className="h-64 flex items-end justify-between gap-2 pt-8">
                {stats.membersByMonth.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-500 font-medium">{item.count}</div>
                    <div 
                      className="w-full bg-blue-500 rounded-t-lg transition-all"
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
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Diet Plans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{nutritionStats.activeDietPlans}</p>
                  <p className="text-xs text-gray-400 mt-1">of {nutritionStats.totalDietPlans} total</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Apple className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Clients with Plans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{nutritionStats.clientsWithPlans}</p>
                  <p className="text-xs text-gray-400 mt-1">of {nutritionStats.totalClients} clients</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{nutritionStats.avgCompletionRate}%</p>
                  <p className="text-xs text-gray-400 mt-1">meal commitments</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meal Logs This Week</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{nutritionStats.mealLogsThisWeek}</p>
                  <p className="text-xs text-gray-400 mt-1">entries logged</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <h3 className="font-semibold text-gray-900 mb-4">Plan Types Distribution</h3>
              <div className="flex items-center justify-center gap-8 h-48">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">{nutritionStats.plansByType.weekly}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 font-medium">Weekly Plans</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">{nutritionStats.plansByType.monthly}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 font-medium">Monthly Plans</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
              <h3 className="font-semibold text-gray-900 mb-4">Popular Meal Types</h3>
              <div className="space-y-3">
                {nutritionStats.popularMealTypes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No meal data available</p>
                ) : (
                  nutritionStats.popularMealTypes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-600">{getMealTypeLabel(item.type)}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
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
          <div className="glass-card rounded-lg border border-white/10 p-6 border border-white/10">
            <h3 className="font-semibold text-gray-900 mb-4">Nutrition Program Insights</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Coverage</span>
                </div>
                <p className="text-sm text-green-700">
                  {nutritionStats.totalClients > 0 
                    ? Math.round((nutritionStats.clientsWithPlans / nutritionStats.totalClients) * 100)
                    : 0}% of clients have diet plans assigned
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Plan Duration</span>
                </div>
                <p className="text-sm text-blue-700">
                  {nutritionStats.plansByType.weekly > nutritionStats.plansByType.monthly 
                    ? 'Weekly plans are more popular'
                    : nutritionStats.plansByType.monthly > nutritionStats.plansByType.weekly
                      ? 'Monthly plans are more popular'
                      : 'Equal distribution of plan types'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Commitment</span>
                </div>
                <p className="text-sm text-purple-700">
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
