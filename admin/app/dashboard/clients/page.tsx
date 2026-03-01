'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Circle,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Loader2
} from 'lucide-react'
import { Users01, Receipt, Package } from '@untitled-ui/icons-react'

interface Client {
  id: string
  full_name: string
  email: string
  phone?: string
  fitness_goal?: string
  subscription_plan?: string
}

interface BodyComposition {
  id: string
  measurement_date: string
  weight_kg: number
  bmi: number
  percent_body_fat: number
  skeletal_muscle_mass_kg: number
  total_body_water_l: number
  basal_metabolic_rate: number
  visceral_fat_level: number
}

interface DietPlan {
  id: string
  name: string
  status: string
  plan_type?: string
  target_calories?: number
  target_protein_g?: number
  target_carbs_g?: number
  target_fat_g?: number
  cheat_days?: string[]
  start_date: string
  end_date?: string
  meals: any[]
}

interface MealLog {
  id: string
  log_date: string
  meal_type: string
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
}

interface MealCommitment {
  id: string
  meal_id: string
  commitment_date: string
  is_committed: boolean
}

interface DailyTracking {
  id: string
  tracking_date: string
  total_calories_consumed: number
  meals_completed: number
  total_meals: number
  completion_percentage: number
  is_cheat_day: boolean
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', time: '08:00' },
  { value: 'morning_snack', label: 'Morning Snack', time: '10:30' },
  { value: 'lunch', label: 'Lunch', time: '13:00' },
  { value: 'afternoon_snack', label: 'Afternoon Snack', time: '16:00' },
  { value: 'dinner', label: 'Dinner', time: '19:00' },
  { value: 'evening_snack', label: 'Evening Snack', time: '21:00' },
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ClientsNutritionPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'body' | 'diet' | 'commitment' | 'logs'>('body')
  
  // Client data
  const [bodyCompositions, setBodyCompositions] = useState<BodyComposition[]>([])
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [commitments, setCommitments] = useState<MealCommitment[]>([])
  const [dailyTracking, setDailyTracking] = useState<DailyTracking[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null)
  const [selectedDay, setSelectedDay] = useState(1)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientData(selectedClient.id)
    }
  }, [selectedClient, activeTab])

  const q = searchQuery.trim().toLowerCase()
  const filteredClients = !q ? clients : clients.filter(c =>
    c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
  )

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/clients-list', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data === 'object' && data.error ? data.error : 'Failed to load clients')
      setClients(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load clients. Check Supabase connection in .env.local')
    } finally {
      setLoading(false)
    }
  }

  async function loadClientData(clientId: string) {
    setDataLoading(true)

    try {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const res = await fetch('/api/client-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          tab: activeTab,
          startDate: activeTab === 'logs' ? weekAgo.toISOString().split('T')[0] : undefined,
          endDate: activeTab === 'logs' ? today.toISOString().split('T')[0] : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load data')

      if (data.compositions) setBodyCompositions(data.compositions)
      if (data.plans) {
        setDietPlans(data.plans)
        const activePlan = data.plans.find((p: DietPlan) => p.status === 'active')
        if (activePlan) setSelectedPlan(activePlan)
      }
      if (data.commitments) setCommitments(data.commitments)
      if (data.tracking) setDailyTracking(data.tracking)
      if (data.logs) setMealLogs(data.logs)
    } catch (err: any) {
      console.error('Error loading client data:', err)
      setError(err?.message || 'Failed to load data')
    } finally {
      setDataLoading(false)
    }
  }

  // Helper functions
  function getPlanDays(plan: DietPlan): number {
    if (!plan.start_date || !plan.end_date) return 7
    const start = new Date(plan.start_date)
    const end = new Date(plan.end_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  function getDateForDay(plan: DietPlan, dayNumber: number): Date {
    const start = new Date(plan.start_date)
    start.setDate(start.getDate() + dayNumber - 1)
    return start
  }

  function getMealsForDay(plan: DietPlan, dayNumber: number): any[] {
    if (!plan.meals) return []
    return plan.meals.filter((m: any) => (m.day_number || 1) === dayNumber)
  }

  function isCheatDay(plan: DietPlan, dayNumber: number): boolean {
    if (!plan.cheat_days) return false
    const date = getDateForDay(plan, dayNumber)
    const dateStr = date.toISOString().split('T')[0]
    return plan.cheat_days.includes(dateStr)
  }

  function calculateDayTotals(meals: any[]) {
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const meal of meals) {
      if (meal.items) {
        for (const item of meal.items) {
          calories += item.calories || 0
          protein += item.protein_g || 0
          carbs += item.carbs_g || 0
          fat += item.fat_g || 0
        }
      }
    }
    return { calories, protein, carbs, fat, mealCount: meals.length }
  }

  const withPlans = clients.filter(c => c.subscription_plan === 'with_dietitian' || c.subscription_plan === 'premium').length
  const premiumCount = clients.filter(c => c.subscription_plan === 'premium').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-6">
        <div className="bg-accent-red/20 border border-accent-red/40 text-accent-red-light px-4 py-3 rounded-lg text-sm">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - identical to Subscriptions */}
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">Client Nutrition</h1>
              <p className="text-gray-400">Only clients on Nutrition Plan ($300/mo) or Premium Package ($550/mo) appear here. Deleted members are removed immediately.</p>
            </div>
            <button
              onClick={loadClients}
              className="flex items-center gap-2 px-6 py-3 glass-button text-white rounded font-semibold"
              title="Refresh client list"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Users01 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
                <p className="text-xs text-gray-400">Total Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{withPlans}</p>
                <p className="text-xs text-gray-400">With Nutrition Plan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{premiumCount}</p>
                <p className="text-xs text-gray-400">Premium</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar - identical to Subscriptions */}
      <div className="glass-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1 glass-card rounded-lg p-4 overflow-hidden">
          <h2 className="text-lg font-semibold text-white mb-4">Clients</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`w-full text-left p-3 rounded-xl transition-colors border ${
                  selectedClient?.id === client.id
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <p className="font-medium truncate">{client.full_name}</p>
                <p className="text-xs opacity-70 truncate">{client.email}</p>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                {q ? 'No matching clients' : 'No clients found'}
              </p>
            )}
          </div>
        </div>

        {/* Client Details */}
        <div className="lg:col-span-3">
          {selectedClient ? (
            <div className="glass-card rounded-lg overflow-hidden">
              {/* Client Header - gradient like Subscriptions card */}
              <div className="bg-gradient-to-r from-primary/30 to-accent-red/30 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedClient.full_name}</h2>
                    <p className="text-white/70 text-sm">{selectedClient.email}</p>
                  </div>
                  {selectedClient.subscription_plan && (
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded text-xs font-medium border border-primary/40">
                      {selectedClient.subscription_plan}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs - glass style */}
              <div className="p-4 border-b border-white/10">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('body')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors border ${
                      activeTab === 'body'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Body Composition
                  </button>
                  <button
                    onClick={() => setActiveTab('diet')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors border ${
                      activeTab === 'diet'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Diet Plans
                  </button>
                  <button
                    onClick={() => setActiveTab('commitment')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors border ${
                      activeTab === 'commitment'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Commitment Tracking
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors border ${
                      activeTab === 'logs'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Meal Logs
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {dataLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {activeTab === 'body' && <BodyCompositionTab data={bodyCompositions} />}
                    {activeTab === 'diet' && (
                      <DietPlansTab 
                        data={dietPlans} 
                        selectedPlan={selectedPlan}
                        setSelectedPlan={setSelectedPlan}
                        selectedDay={selectedDay}
                        setSelectedDay={setSelectedDay}
                        getMealsForDay={getMealsForDay}
                        isCheatDay={isCheatDay}
                        calculateDayTotals={calculateDayTotals}
                        getPlanDays={getPlanDays}
                        getDateForDay={getDateForDay}
                      />
                    )}
                    {activeTab === 'commitment' && (
                      <CommitmentTrackingTab
                        plans={dietPlans}
                        selectedPlan={selectedPlan}
                        setSelectedPlan={setSelectedPlan}
                        commitments={commitments}
                        dailyTracking={dailyTracking}
                        getMealsForDay={getMealsForDay}
                        isCheatDay={isCheatDay}
                        getPlanDays={getPlanDays}
                        getDateForDay={getDateForDay}
                      />
                    )}
                    {activeTab === 'logs' && <MealLogsTab data={mealLogs} />}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-lg p-16 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Client</h3>
              <p className="text-gray-500">
                Choose a client from the list to view their nutrition and body composition data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Body Composition Tab Component
function BodyCompositionTab({ data }: { data: BodyComposition[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-lg p-16 text-center">
        <p className="text-5xl mb-4">📊</p>
        <p className="text-white font-medium mb-2">No body composition data available for this client.</p>
        <p className="text-gray-500 text-sm">Data will appear here once the dietitian adds measurements.</p>
      </div>
    )
  }

  const latest = data[0]

  return (
    <div className="space-y-6">
      {/* Latest Stats - strength-card style like Subscriptions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Weight" 
          value={`${latest.weight_kg?.toFixed(1) || '-'} kg`}
          color="blue"
        />
        <StatCard 
          label="BMI" 
          value={latest.bmi?.toFixed(1) || '-'}
          color="green"
          subtitle={getBmiCategory(latest.bmi)}
        />
        <StatCard 
          label="Body Fat" 
          value={`${latest.percent_body_fat?.toFixed(1) || '-'}%`}
          color="orange"
        />
        <StatCard 
          label="Muscle Mass" 
          value={`${latest.skeletal_muscle_mass_kg?.toFixed(1) || '-'} kg`}
          color="purple"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard 
          label="Body Water" 
          value={`${latest.total_body_water_l?.toFixed(1) || '-'} L`}
          color="cyan"
        />
        <StatCard 
          label="BMR" 
          value={`${latest.basal_metabolic_rate || '-'} kcal`}
          color="red"
        />
        <StatCard 
          label="Visceral Fat" 
          value={`Level ${latest.visceral_fat_level || '-'}`}
          color="yellow"
          subtitle={getVisceralFatCategory(latest.visceral_fat_level)}
        />
      </div>

      {/* History Table */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Measurement History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-right py-3 px-4">Weight</th>
                <th className="text-right py-3 px-4">BMI</th>
                <th className="text-right py-3 px-4">Body Fat</th>
                <th className="text-right py-3 px-4">Muscle</th>
              </tr>
            </thead>
            <tbody>
              {data.map(comp => (
                <tr key={comp.id} className="border-b border-white/5 text-white hover:bg-white/5">
                  <td className="py-3 px-4">
                    {new Date(comp.measurement_date).toLocaleDateString()}
                  </td>
                  <td className="text-right py-3 px-4">{comp.weight_kg?.toFixed(1)} kg</td>
                  <td className="text-right py-3 px-4">{comp.bmi?.toFixed(1)}</td>
                  <td className="text-right py-3 px-4">{comp.percent_body_fat?.toFixed(1)}%</td>
                  <td className="text-right py-3 px-4">{comp.skeletal_muscle_mass_kg?.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Diet Plans Tab Component - Enhanced with Daily Schedules
function DietPlansTab({ 
  data, 
  selectedPlan,
  setSelectedPlan,
  selectedDay,
  setSelectedDay,
  getMealsForDay,
  isCheatDay,
  calculateDayTotals,
  getPlanDays,
  getDateForDay
}: { 
  data: DietPlan[]
  selectedPlan: DietPlan | null
  setSelectedPlan: (plan: DietPlan | null) => void
  selectedDay: number
  setSelectedDay: (day: number) => void
  getMealsForDay: (plan: DietPlan, day: number) => any[]
  isCheatDay: (plan: DietPlan, day: number) => boolean
  calculateDayTotals: (meals: any[]) => { calories: number, protein: number, carbs: number, fat: number, mealCount: number }
  getPlanDays: (plan: DietPlan) => number
  getDateForDay: (plan: DietPlan, day: number) => Date
}) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-lg p-16 text-center">
        <p className="text-5xl mb-4">🥗</p>
        <p className="text-white font-medium mb-2">No diet plans available for this client.</p>
        <p className="text-gray-500 text-sm">The dietitian will create personalized plans.</p>
      </div>
    )
  }

  const activePlan = selectedPlan || data.find(p => p.status === 'active') || data[0]
  const totalDays = getPlanDays(activePlan)
  const dayMeals = getMealsForDay(activePlan, selectedDay)
  const dayTotals = calculateDayTotals(dayMeals)
  const dayIsCheat = isCheatDay(activePlan, selectedDay)
  const dayDate = getDateForDay(activePlan, selectedDay)

  return (
    <div className="space-y-6">
      {/* Plan Selector */}
      {data.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-400">Select Plan:</span>
          {data.map(plan => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan); setSelectedDay(1); }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
                activePlan?.id === plan.id
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              {plan.name} {plan.status === 'active' && '✓'}
            </button>
          ))}
        </div>
      )}

      {/* Active Plan Header - gradient like Subscriptions */}
      <div className="rounded-xl overflow-hidden strength-card glass-card border border-primary/20">
        <div className="h-2 bg-gradient-to-r from-primary/30 to-accent-red/30" />
        <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{activePlan.name}</h3>
            <p className="text-sm text-gray-400">
              {activePlan.plan_type === 'monthly' ? 'Monthly Plan' : 'Weekly Plan'} • 
              {new Date(activePlan.start_date).toLocaleDateString()} - {activePlan.end_date ? new Date(activePlan.end_date).toLocaleDateString() : 'Ongoing'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-medium border ${
            activePlan.status === 'active' 
              ? 'bg-primary/20 text-primary border-primary/40' 
              : 'bg-white/10 text-gray-400 border-white/10'
          }`}>
            {activePlan.status?.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{activePlan.target_calories || 0}</p>
            <p className="text-xs text-gray-400">Target Calories</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{activePlan.target_protein_g || 0}g</p>
            <p className="text-xs text-gray-400">Protein</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{activePlan.target_carbs_g || 0}g</p>
            <p className="text-xs text-gray-400">Carbs</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-2xl font-bold text-primary">{activePlan.target_fat_g || 0}g</p>
            <p className="text-xs text-gray-400">Fat</p>
          </div>
        </div>

        {activePlan.cheat_days && activePlan.cheat_days.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <p className="text-sm text-amber-400 font-medium">
              Cheat Days: {activePlan.cheat_days.map(d => new Date(d).toLocaleDateString()).join(', ')}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-white">Daily Schedule</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
            disabled={selectedDay <= 1}
            className="p-2 rounded-xl glass-button text-white disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            className="glass-input text-white rounded-xl px-4 py-2"
          >
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
              const date = getDateForDay(activePlan, day)
              const isCheat = isCheatDay(activePlan, day)
              return (
                <option key={day} value={day}>
                  Day {day} - {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {isCheat ? ' (Cheat)' : ''}
                </option>
              )
            })}
          </select>
          <button
            onClick={() => setSelectedDay(Math.min(totalDays, selectedDay + 1))}
            disabled={selectedDay >= totalDays}
            className="p-2 rounded-xl glass-button text-white disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Header */}
      <div className={`p-4 rounded-xl ${dayIsCheat ? 'bg-amber-500/15 border border-amber-500/30' : 'glass-card border border-white/10'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-white font-bold">
              Day {selectedDay} - {dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            {dayIsCheat && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold flex items-center gap-1">
                <PartyPopper className="w-3 h-3" /> Cheat Day
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {dayMeals.length} meals configured
          </div>
        </div>

        {/* Day Totals */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-lg font-bold text-primary">{dayTotals.calories}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-lg font-bold text-primary">{dayTotals.protein.toFixed(1)}g</p>
            <p className="text-xs text-gray-400">Protein</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-lg font-bold text-primary">{dayTotals.carbs.toFixed(1)}g</p>
            <p className="text-xs text-gray-400">Carbs</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-lg font-bold text-primary">{dayTotals.fat.toFixed(1)}g</p>
            <p className="text-xs text-gray-400">Fat</p>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-3">
          {MEAL_TYPES.map(mealType => {
            const meal = dayMeals.find((m: any) => m.meal_type === mealType.value)
            const mealCals = meal?.items?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) || 0
            
            return (
              <div key={mealType.value} className="glass-card rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getMealEmoji(mealType.value)}</span>
                    <div>
                      <p className="text-white font-medium">{mealType.label}</p>
                      <p className="text-xs text-gray-400">{meal?.scheduled_time || mealType.time}</p>
                    </div>
                  </div>
                  <span className="text-orange-400 font-bold">{mealCals} kcal</span>
                </div>
                
                {meal?.items && meal.items.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {meal.items.map((item: any, idx: number) => {
                      const itemName = item.custom_item_name || item.food?.name || 'Custom Item'
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-white/5 border border-white/5">
                          <span className="text-gray-300">
                            {item.quantity} {item.unit || 'serving'} {itemName}
                          </span>
                          <div className="flex gap-3 text-xs">
                            <span className="text-orange-400">{item.calories || 0} kcal</span>
                            <span className="text-red-400">P:{item.protein_g || 0}g</span>
                            <span className="text-blue-400">C:{item.carbs_g || 0}g</span>
                            <span className="text-yellow-400">F:{item.fat_g || 0}g</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-2">No items configured for this meal</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Commitment Tracking Tab Component
function CommitmentTrackingTab({
  plans,
  selectedPlan,
  setSelectedPlan,
  commitments,
  dailyTracking,
  getMealsForDay,
  isCheatDay,
  getPlanDays,
  getDateForDay
}: {
  plans: DietPlan[]
  selectedPlan: DietPlan | null
  setSelectedPlan: (plan: DietPlan | null) => void
  commitments: MealCommitment[]
  dailyTracking: DailyTracking[]
  getMealsForDay: (plan: DietPlan, day: number) => any[]
  isCheatDay: (plan: DietPlan, day: number) => boolean
  getPlanDays: (plan: DietPlan) => number
  getDateForDay: (plan: DietPlan, day: number) => Date
}) {
  if (plans.length === 0) {
    return (
      <div className="glass-card rounded-lg p-16 text-center">
        <p className="text-5xl mb-4">📊</p>
        <p className="text-white font-medium">No diet plans available for commitment tracking.</p>
      </div>
    )
  }

  const activePlan = selectedPlan || plans.find(p => p.status === 'active') || plans[0]
  const totalDays = getPlanDays(activePlan)

  // Calculate overall stats
  const totalMealsPlanned = totalDays * 6 // 6 meals per day
  const completedMeals = commitments.filter(c => c.is_committed).length
  const completionRate = totalMealsPlanned > 0 ? Math.round((completedMeals / totalMealsPlanned) * 100) : 0

  // Calculate streak
  let currentStreak = 0
  const today = new Date()
  for (let i = totalDays; i >= 1; i--) {
    const date = getDateForDay(activePlan, i)
    if (date > today) continue
    const dayMeals = getMealsForDay(activePlan, i)
    const dayCommits = commitments.filter(c => {
      const commitDate = new Date(c.commitment_date)
      return commitDate.toDateString() === date.toDateString() && c.is_committed
    })
    if (dayMeals.length > 0 && dayCommits.length >= dayMeals.length * 0.8) {
      currentStreak++
    } else {
      break
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan Selector */}
      {plans.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-400">Select Plan:</span>
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
                activePlan?.id === plan.id
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats Overview - glass style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="text-sm text-gray-400">Overall Completion</span>
          </div>
          <p className="text-3xl font-bold text-white">{completionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{completedMeals} / {totalMealsPlanned} meals</p>
        </div>
        
        <div className="glass-card rounded-xl p-5 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="text-sm text-gray-400">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{currentStreak} days</p>
          <p className="text-xs text-gray-400 mt-1">Keep it going!</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <span className="text-sm text-gray-400">Completed Days</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {dailyTracking.filter(t => t.completion_percentage >= 80).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">of {totalDays} days</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <PartyPopper className="w-6 h-6 text-amber-400" />
            <span className="text-sm text-gray-400">Cheat Days Used</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {activePlan.cheat_days?.length || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">designated cheat days</p>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Daily Commitment Overview</h4>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
            const date = getDateForDay(activePlan, day)
            const isCheat = isCheatDay(activePlan, day)
            const tracking = dailyTracking.find(t => {
              const trackDate = new Date(t.tracking_date)
              return trackDate.toDateString() === date.toDateString()
            })
            const isPast = date < new Date()
            const isToday = date.toDateString() === new Date().toDateString()
            const completion = tracking?.completion_percentage || 0
            
            return (
              <div
                key={day}
                className={`rounded-lg p-3 text-center border transition-all ${
                  isCheat 
                    ? 'bg-amber-500/15 border-amber-500/30'
                    : completion >= 80
                      ? 'bg-primary/15 border-primary/30'
                      : completion > 0
                        ? 'bg-primary/10 border-primary/20'
                        : isPast
                          ? 'bg-accent-red/15 border-accent-red/30'
                          : 'glass-card border-white/10'
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <p className="text-xs text-gray-400">{DAYS_OF_WEEK[date.getDay()]}</p>
                <p className="text-sm font-bold text-white">{date.getDate()}</p>
                {isCheat ? (
                  <PartyPopper className="w-4 h-4 text-amber-400 mx-auto mt-1" />
                ) : completion >= 80 ? (
                  <CheckCircle2 className="w-4 h-4 text-primary mx-auto mt-1" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-600 mx-auto mt-1" />
                )}
                <p className="text-xs mt-1 text-gray-400">{completion}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Recent Meal Commitments</h4>
            {commitments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No commitment data recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commitments.slice(0, 20).map((c, idx) => (
              <div key={idx} className="flex items-center justify-between glass-card rounded-lg p-3 border border-white/10">
                <div className="flex items-center gap-3">
                  {c.is_committed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-gray-300">
                    {new Date(c.commitment_date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-sm ${c.is_committed ? 'text-primary' : 'text-gray-500'}`}>
                  {c.is_committed ? 'Completed' : 'Not completed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Meal Logs Tab Component
function MealLogsTab({ data }: { data: MealLog[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-lg p-16 text-center">
        <p className="text-5xl mb-4">📝</p>
        <p className="text-white font-medium mb-2">No meal logs in the past 7 days.</p>
        <p className="text-gray-500 text-sm">Logs will appear here when the client tracks their meals.</p>
      </div>
    )
  }

  // Group logs by date
  const logsByDate = data.reduce((acc: Record<string, MealLog[]>, log) => {
    const date = log.log_date.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(logsByDate).map(([date, logs]) => {
        const totalCals = logs.reduce((sum, l) => sum + l.total_calories, 0)
        const totalProtein = logs.reduce((sum, l) => sum + l.total_protein_g, 0)
        const totalCarbs = logs.reduce((sum, l) => sum + l.total_carbs_g, 0)
        const totalFat = logs.reduce((sum, l) => sum + l.total_fat_g, 0)

        return (
          <div key={date} className="glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h4>
              <div className="flex gap-4 text-sm">
                <span className="text-orange-400">{totalCals} kcal</span>
                <span className="text-red-400">P: {totalProtein.toFixed(0)}g</span>
                <span className="text-blue-400">C: {totalCarbs.toFixed(0)}g</span>
                <span className="text-yellow-400">F: {totalFat.toFixed(0)}g</span>
              </div>
            </div>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="rounded-lg p-3 flex justify-between items-center bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getMealEmoji(log.meal_type)}</span>
                    <p className="text-gray-300">{getMealTypeLabel(log.meal_type)}</p>
                  </div>
                  <p className="text-gray-400 text-sm">{log.total_calories} kcal</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  color, 
  subtitle 
}: { 
  label: string
  value: string
  color: string
  subtitle?: string 
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-primary/10 border-primary/30 text-primary',
    green: 'bg-primary/10 border-primary/30 text-primary',
    orange: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    purple: 'bg-primary/10 border-primary/30 text-primary',
    cyan: 'bg-primary/10 border-primary/30 text-primary',
    red: 'bg-accent-red/20 border-accent-red/30 text-accent-red-light',
    yellow: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  }

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs mt-1 text-gray-400">{subtitle}</p>}
    </div>
  )
}

// Helper Functions
function getBmiCategory(bmi?: number): string {
  if (!bmi) return ''
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

function getVisceralFatCategory(level?: number): string {
  if (!level) return ''
  if (level <= 9) return 'Normal'
  if (level <= 14) return 'High'
  return 'Very High'
}

function getMealTypeLabel(type: string): string {
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

function getMealEmoji(type: string): string {
  const emojis: Record<string, string> = {
    breakfast: '🌅',
    morning_snack: '🍎',
    lunch: '🍱',
    afternoon_snack: '🍪',
    dinner: '🍽️',
    evening_snack: '🌙',
  }
  return emojis[type] || '🍴'
}
