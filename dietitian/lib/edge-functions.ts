// Direct Database API for dietitian operations (no Edge Functions needed)
import { supabase } from './supabase'

// ==================== Types ====================

export interface BodyComposition {
  id: string
  client_id: string
  recorded_by_id?: string
  measurement_date: string
  height_cm?: number
  weight_kg?: number
  age?: number
  gender?: string
  total_body_water_l?: number
  protein_kg?: number
  minerals_kg?: number
  body_fat_mass_kg?: number
  skeletal_muscle_mass_kg?: number
  bmi?: number
  percent_body_fat?: number
  left_arm_lean_kg?: number
  left_arm_lean_percent?: number
  right_arm_lean_kg?: number
  right_arm_lean_percent?: number
  trunk_lean_kg?: number
  trunk_lean_percent?: number
  left_leg_lean_kg?: number
  left_leg_lean_percent?: number
  right_leg_lean_kg?: number
  right_leg_lean_percent?: number
  left_arm_fat_kg?: number
  left_arm_fat_percent?: number
  right_arm_fat_kg?: number
  right_arm_fat_percent?: number
  trunk_fat_kg?: number
  trunk_fat_percent?: number
  left_leg_fat_kg?: number
  left_leg_fat_percent?: number
  right_leg_fat_kg?: number
  right_leg_fat_percent?: number
  fat_free_mass_kg?: number
  basal_metabolic_rate?: number
  waist_hip_ratio?: number
  visceral_fat_level?: number
  metabolic_age?: number
  target_weight_kg?: number
  weight_control_kg?: number
  fat_control_kg?: number
  muscle_control_kg?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface DietPlan {
  id: string
  client_id: string
  dietitian_id?: string
  name: string
  description?: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed' | 'paused' | 'draft'
  target_calories?: number
  target_protein_g?: number
  target_carbs_g?: number
  target_fat_g?: number
  target_fiber_g?: number
  target_water_l?: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface Food {
  id: string
  name: string
  name_ar?: string
  brand?: string
  description?: string
  category: string
  serving_size?: number
  serving_unit?: string
  calories_per_serving?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  is_verified?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface MealLog {
  id: string
  client_id: string
  meal_type: string
  meal_date: string
  status: string
  total_calories?: number
  total_protein_g?: number
  total_carbs_g?: number
  total_fat_g?: number
  notes?: string
  created_at?: string
}

export interface ClientAssignment {
  id: string
  client_id: string
  dietitian_id: string
  assigned_at: string
  is_active: boolean
  client?: {
    id: string
    email: string
    full_name: string
    phone?: string
    gender?: string
    date_of_birth?: string
  }
}

// ==================== Helper Functions ====================

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// ==================== Body Composition ====================

export async function getClientBodyHistory(
  clientId: string,
  limit = 10
): Promise<{ data: BodyComposition[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('body_compositions')
      .select('*')
      .eq('client_id', clientId)
      .order('measurement_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getLatestBodyComposition(
  clientId: string
): Promise<{ data: BodyComposition | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('body_compositions')
      .select('*')
      .eq('client_id', clientId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function addBodyComposition(
  clientId: string,
  measurement: Partial<BodyComposition>
): Promise<{ data: BodyComposition | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('body_compositions')
      .insert({
        client_id: clientId,
        recorded_by_id: userId,
        ...measurement
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateBodyComposition(
  compositionId: string,
  updates: Partial<BodyComposition>
): Promise<{ data: BodyComposition | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('body_compositions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', compositionId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function deleteBodyComposition(
  compositionId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('body_compositions')
      .delete()
      .eq('id', compositionId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ==================== Diet Plans ====================

export async function getClientDietPlans(
  clientId: string,
  status?: string
): Promise<{ data: DietPlan[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('diet_plans')
      .select(`
        *,
        meals:diet_plan_meals(
          *,
          items:diet_plan_meal_items(
            *,
            food:food_id(id, name, name_ar)
          )
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as DietPlan[], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getActiveDietPlan(
  clientId: string
): Promise<{ data: DietPlan | null; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .lte('start_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function createDietPlan(
  plan: Partial<DietPlan> & { client_id: string }
): Promise<{ data: DietPlan | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('diet_plans')
      .insert({
        ...plan,
        dietitian_id: userId
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateDietPlan(
  planId: string,
  updates: Partial<DietPlan>
): Promise<{ data: DietPlan | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('diet_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function deleteDietPlan(
  planId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('diet_plans')
      .delete()
      .eq('id', planId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addMealToPlan(
  planId: string,
  meal: any
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('diet_plan_meals')
      .insert({
        plan_id: planId,
        ...meal
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function addItemToMeal(
  mealId: string,
  item: any
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('diet_plan_meal_items')
      .insert({
        meal_id: mealId,
        ...item
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function deleteMeal(
  mealId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('diet_plan_meals')
      .delete()
      .eq('id', mealId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMealItem(
  itemId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('diet_plan_meal_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function searchFoods(
  query?: string,
  category?: string,
  limit = 20
): Promise<{ data: Food[] | null; error: string | null }> {
  try {
    let foodQuery = supabase
      .from('foods')
      .select('*')
      .limit(limit)

    if (query) {
      foodQuery = foodQuery.or(`name.ilike.%${query}%,name_ar.ilike.%${query}%`)
    }

    if (category) {
      foodQuery = foodQuery.eq('category', category)
    }

    const { data, error } = await foodQuery

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ==================== Meal Logs ====================

export async function getClientMealLogs(
  clientId: string,
  startDate?: string,
  endDate?: string,
  limit = 50
): Promise<{ data: MealLog[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('meal_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('meal_date', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('meal_date', startDate)
    }

    if (endDate) {
      query = query.lte('meal_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getComplianceStats(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { data: logs, error } = await supabase
      .from('meal_logs')
      .select('status')
      .eq('client_id', clientId)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate)

    if (error) throw error

    const total = logs?.length || 0
    const followed = logs?.filter(l => l.status === 'followed').length || 0
    const modified = logs?.filter(l => l.status === 'modified').length || 0
    const skipped = logs?.filter(l => l.status === 'skipped').length || 0

    return {
      data: {
        total,
        followed,
        modified,
        skipped,
        complianceRate: total > 0 ? Math.round((followed / total) * 100) : 0
      },
      error: null
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ==================== Dietitian Actions ====================

export async function getMyClients(): Promise<{ data: ClientAssignment[] | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('client_dietitian_assignments')
      .select(`
        id,
        assigned_at,
        is_active,
        client:client_id(
          id,
          email,
          full_name,
          phone,
          gender,
          date_of_birth
        )
      `)
      .eq('dietitian_id', userId)
      .eq('is_active', true)

    if (error) throw error
    return { data: data as ClientAssignment[], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getClientSummary(
  clientId: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    // Get client profile
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        gender,
        date_of_birth
      `)
      .eq('id', clientId)
      .single()

    if (clientError) throw clientError

    // Get client details
    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('fitness_goal, height_cm, weight_kg, body_fat_percentage')
      .eq('user_id', clientId)
      .maybeSingle()

    // Get latest body composition
    const { data: latestBody } = await supabase
      .from('body_compositions')
      .select('*')
      .eq('client_id', clientId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get active diet plan
    const today = new Date().toISOString().split('T')[0]
    const { data: activePlan } = await supabase
      .from('diet_plans')
      .select('id, name, status, start_date, end_date, target_calories')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .lte('start_date', today)
      .limit(1)
      .maybeSingle()

    // Get meal compliance for last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: recentLogs } = await supabase
      .from('meal_logs')
      .select('status')
      .eq('client_id', clientId)
      .gte('meal_date', weekAgo.toISOString().split('T')[0])

    const totalLogs = recentLogs?.length || 0
    const followedLogs = recentLogs?.filter(l => l.status === 'followed').length || 0
    const weeklyCompliance = totalLogs > 0 ? Math.round((followedLogs / totalLogs) * 100) : 0

    return {
      data: {
        client: { ...client, client_profile: clientProfile },
        latestBodyComposition: latestBody,
        activeDietPlan: activePlan,
        weeklyCompliance,
        totalMealsLogged: totalLogs
      },
      error: null
    }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function addFood(
  food: Partial<Food>
): Promise<{ data: Food | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('foods')
      .insert({
        ...food,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateFood(
  foodId: string,
  updates: Partial<Food>
): Promise<{ data: Food | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('foods')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', foodId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ==================== Foods Database ====================

export async function getAllFoods(
  limit = 100
): Promise<{ data: Food[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .order('name')
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function deleteFood(
  foodId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('id', foodId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ==================== Meal Commitments ====================

export async function getMealCommitments(
  clientId: string,
  planId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('meal_commitments')
      .select('*')
      .eq('client_id', clientId)
      .eq('plan_id', planId)

    if (startDate) {
      query = query.gte('commitment_date', startDate)
    }
    if (endDate) {
      query = query.lte('commitment_date', endDate)
    }

    const { data, error } = await query.order('commitment_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function toggleMealCommitment(
  clientId: string,
  planId: string,
  mealId: string,
  commitmentDate: string,
  isCommitted: boolean
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('meal_commitments')
      .upsert({
        client_id: clientId,
        plan_id: planId,
        meal_id: mealId,
        commitment_date: commitmentDate,
        is_committed: isCommitted,
        committed_at: isCommitted ? new Date().toISOString() : null
      }, { onConflict: 'client_id,meal_id,commitment_date' })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ==================== Daily Plan Tracking ====================

export async function getDailyTracking(
  clientId: string,
  planId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('daily_plan_tracking')
      .select('*')
      .eq('client_id', clientId)
      .eq('plan_id', planId)

    if (startDate) {
      query = query.gte('tracking_date', startDate)
    }
    if (endDate) {
      query = query.lte('tracking_date', endDate)
    }

    const { data, error } = await query.order('tracking_date', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateDailyTracking(
  clientId: string,
  planId: string,
  trackingDate: string,
  updates: {
    total_calories_consumed?: number
    total_protein_g?: number
    total_carbs_g?: number
    total_fat_g?: number
    meals_completed?: number
    total_meals?: number
    completion_percentage?: number
    is_cheat_day?: boolean
    notes?: string
  }
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('daily_plan_tracking')
      .upsert({
        client_id: clientId,
        plan_id: planId,
        tracking_date: trackingDate,
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,plan_id,tracking_date' })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ==================== Calculate Plan Totals ====================

export function calculateMealTotals(items: any[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return items.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein_g || 0),
    carbs: acc.carbs + (item.carbs_g || 0),
    fat: acc.fat + (item.fat_g || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

export function calculateDayTotals(meals: any[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
  mealCount: number
} {
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: meals.length }
  
  for (const meal of meals) {
    if (meal.items) {
      const mealTotals = calculateMealTotals(meal.items)
      totals.calories += mealTotals.calories
      totals.protein += mealTotals.protein
      totals.carbs += mealTotals.carbs
      totals.fat += mealTotals.fat
    } else {
      totals.calories += meal.total_calories || 0
      totals.protein += meal.total_protein_g || 0
      totals.carbs += meal.total_carbs_g || 0
      totals.fat += meal.total_fat_g || 0
    }
  }
  
  return totals
}

export function calculatePlanTotals(plan: any): {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  avgDailyCalories: number
  avgDailyProtein: number
  avgDailyCarbs: number
  avgDailyFat: number
  totalMeals: number
  daysCount: number
} {
  const meals = plan.meals || []
  const dayTotals = calculateDayTotals(meals)
  
  // Calculate days in plan
  const startDate = new Date(plan.start_date)
  const endDate = plan.end_date ? new Date(plan.end_date) : new Date()
  const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  return {
    totalCalories: dayTotals.calories * daysCount,
    totalProtein: dayTotals.protein * daysCount,
    totalCarbs: dayTotals.carbs * daysCount,
    totalFat: dayTotals.fat * daysCount,
    avgDailyCalories: dayTotals.calories,
    avgDailyProtein: dayTotals.protein,
    avgDailyCarbs: dayTotals.carbs,
    avgDailyFat: dayTotals.fat,
    totalMeals: dayTotals.mealCount * daysCount,
    daysCount
  }
}
