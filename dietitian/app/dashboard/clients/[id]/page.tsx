'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  User,
  Activity,
  Utensils,
  ClipboardList,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  BarChart3,
  Target
} from 'lucide-react'
import { getClientSummary, getClientBodyHistory, getClientDietPlans, getClientMealLogs } from '@/lib/edge-functions'
import { formatDate, getBMICategory } from '@/lib/utils'
import type { BodyComposition, DietPlan, MealLog } from '@/lib/supabase'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [bodyCompositions, setBodyCompositions] = useState<BodyComposition[]>([])
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [compliance, setCompliance] = useState<{
    followed: number
    modified: number
    skipped: number
    total: number
    percentage: number
  }>({ followed: 0, modified: 0, skipped: 0, total: 0, percentage: 0 })

  useEffect(() => {
    if (clientId) {
      loadClientData()
    }
  }, [clientId])

  async function loadClientData() {
    setLoading(true)
    try {
      // Load all data in parallel
      const [summaryRes, bodyRes, plansRes, logsRes] = await Promise.all([
        getClientSummary(clientId),
        getClientBodyHistory(clientId),
        getClientDietPlans(clientId),
        getClientMealLogs(clientId)
      ])

      if (summaryRes.data) {
        setClient(summaryRes.data)
      }

      if (bodyRes.data) {
        setBodyCompositions(bodyRes.data)
      }

      if (plansRes.data) {
        setDietPlans(plansRes.data)
      }

      if (logsRes.data) {
        setMealLogs(logsRes.data)
        // Calculate compliance
        const followed = logsRes.data.filter((l: MealLog) => l.status === 'followed').length
        const modified = logsRes.data.filter((l: MealLog) => l.status === 'modified').length
        const skipped = logsRes.data.filter((l: MealLog) => l.status === 'skipped').length
        const total = logsRes.data.length
        const percentage = total > 0 ? Math.round(((followed + modified * 0.5) / total) * 100) : 0
        setCompliance({ followed, modified, skipped, total, percentage })
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const latestBody = bodyCompositions[0]
  const previousBody = bodyCompositions[1]
  const activePlan = dietPlans.find(p => p.status === 'active')

  const getWeightChange = () => {
    if (!latestBody?.weight_kg || !previousBody?.weight_kg) return null
    const change = latestBody.weight_kg - previousBody.weight_kg
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'same'
    }
  }

  const weightChange = getWeightChange()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
      </div>
    )
  }

  // Get the profile data from the client summary
  const profile = client?.client || client?.profile || client

  if (!client || !profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Client not found</h2>
        <p className="text-gray-500 mt-2">This client may not be assigned to you</p>
        <Link href="/dashboard/clients" className="mt-4 inline-block text-rose-500 hover:text-rose-600">
          Back to Clients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Client'}</h1>
          <p className="text-gray-500">{profile.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/body-analysis?client=${clientId}`}
            className="px-4 py-2 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Body Analysis
          </Link>
          <Link
            href={`/dashboard/diet-plans?client=${clientId}`}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            Diet Plans
          </Link>
        </div>
      </div>

      {/* Client Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Weight */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            {weightChange && weightChange.direction !== 'same' && (
              <span className={`flex items-center gap-1 text-sm font-medium ${
                weightChange.direction === 'down' ? 'text-green-600' : 'text-red-600'
              }`}>
                {weightChange.direction === 'down' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {weightChange.value} kg
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {latestBody?.weight_kg?.toFixed(1) || '--'} kg
          </p>
          <p className="text-gray-500 text-sm mt-1">Current Weight</p>
        </div>

        {/* BMI */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            {latestBody?.bmi && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBMICategory(latestBody.bmi).color} bg-opacity-20`}>
                {getBMICategory(latestBody.bmi).label}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {latestBody?.bmi?.toFixed(1) || '--'}
          </p>
          <p className="text-gray-500 text-sm mt-1">BMI</p>
        </div>

        {/* Body Fat */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="p-3 bg-orange-100 rounded-xl w-fit mb-4">
            <Target className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {latestBody?.percent_body_fat?.toFixed(1) || '--'}%
          </p>
          <p className="text-gray-500 text-sm mt-1">Body Fat</p>
        </div>

        {/* Compliance */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold">{compliance.percentage}%</p>
          <p className="text-white/80 text-sm mt-1">Diet Compliance</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Diet Plan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Active Diet Plan</h2>
            <Link
              href={`/dashboard/diet-plans?client=${clientId}`}
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {activePlan ? (
              <div>
                <h3 className="font-semibold text-gray-900">{activePlan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{activePlan.description || 'No description'}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Daily Calories</p>
                    <p className="font-bold text-gray-900">{activePlan.target_calories || '--'} kcal</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Protein Target</p>
                    <p className="font-bold text-gray-900">{activePlan.target_protein_g || '--'}g</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Carbs Target</p>
                    <p className="font-bold text-gray-900">{activePlan.target_carbs_g || '--'}g</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Fat Target</p>
                    <p className="font-bold text-gray-900">{activePlan.target_fat_g || '--'}g</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Started {formatDate(activePlan.start_date)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active diet plan</p>
                <Link
                  href={`/dashboard/diet-plans?client=${clientId}`}
                  className="mt-3 inline-block text-rose-500 hover:text-rose-600 text-sm"
                >
                  Create Plan
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Body Measurements */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Body Measurements</h2>
            <Link
              href={`/dashboard/body-analysis?client=${clientId}`}
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              View All
            </Link>
          </div>
          <div className="p-6">
            {bodyCompositions.length > 0 ? (
              <div className="space-y-4">
                {bodyCompositions.slice(0, 3).map((comp, idx) => (
                  <div key={comp.id} className={`flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-rose-50' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(comp.measurement_date)}</p>
                      <p className="text-sm text-gray-500">
                        BMI: {comp.bmi?.toFixed(1) || '--'} | Fat: {comp.percent_body_fat?.toFixed(1) || '--'}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{comp.weight_kg?.toFixed(1)} kg</p>
                      <p className="text-sm text-gray-500">Muscle: {comp.skeletal_muscle_mass_kg?.toFixed(1) || '--'} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No measurements recorded</p>
                <Link
                  href={`/dashboard/body-analysis?client=${clientId}`}
                  className="mt-3 inline-block text-rose-500 hover:text-rose-600 text-sm"
                >
                  Add Measurement
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meal Log Compliance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Meal Log Compliance</h2>
          <p className="text-gray-500 text-sm mt-1">How well the client is following their diet plan</p>
        </div>
        <div className="p-6">
          {compliance.total > 0 ? (
            <div>
              {/* Compliance Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Overall Compliance</span>
                  <span className="text-sm font-bold text-gray-900">{compliance.percentage}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div 
                      className="bg-green-500 transition-all"
                      style={{ width: `${(compliance.followed / compliance.total) * 100}%` }}
                    />
                    <div 
                      className="bg-yellow-500 transition-all"
                      style={{ width: `${(compliance.modified / compliance.total) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 transition-all"
                      style={{ width: `${(compliance.skipped / compliance.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{compliance.followed}</p>
                  <p className="text-sm text-gray-500">Followed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{compliance.modified}</p>
                  <p className="text-sm text-gray-500">Modified</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{compliance.skipped}</p>
                  <p className="text-sm text-gray-500">Skipped</p>
                </div>
              </div>

              {/* Recent Logs */}
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-3">Recent Meal Logs</h3>
                <div className="space-y-2">
                  {mealLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          log.status === 'followed' ? 'bg-green-500' :
                          log.status === 'modified' ? 'bg-yellow-500' :
                          log.status === 'skipped' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {log.meal_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(log.meal_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{log.total_calories || 0} kcal</p>
                        <p className="text-xs text-gray-500 capitalize">{log.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No meal logs recorded yet</p>
              <p className="text-gray-400 text-sm mt-1">Client needs to log their meals in the app</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
