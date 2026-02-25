// Edge Functions API for secure admin operations
import { supabase } from './supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Get authorization header for authenticated requests
async function getAuthHeader(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  return `Bearer ${session.access_token}`
}

// Call Edge Function with authentication
async function callEdgeFunction(
  functionName: string,
  body: Record<string, any>
): Promise<{ data: any; error: string | null }> {
  try {
    const authHeader = await getAuthHeader()
    if (!authHeader) {
      return { data: null, error: 'Not authenticated' }
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data.error || 'Request failed' }
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' }
  }
}

// Approve registration request
export async function approveRegistration(
  requestId: string,
  adminNotes?: string
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await callEdgeFunction('approve-registration', {
    requestId,
    action: 'approve',
    adminNotes,
  })

  return { success: data?.success || false, error }
}

// Reject registration request
export async function rejectRegistration(
  requestId: string,
  adminNotes?: string
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await callEdgeFunction('approve-registration', {
    requestId,
    action: 'reject',
    adminNotes,
  })

  return { success: data?.success || false, error }
}

// Create member directly (admin)
export async function createMember(
  memberData: {
    email: string
    password: string
    fullName: string
    phone?: string
    plan?: 'open_gym' | 'with_pt'
    fitnessGoal?: string
  }
): Promise<{ success: boolean; userId?: string; error: string | null }> {
  const { data, error } = await callEdgeFunction('admin-action', {
    action: 'create_member',
    data: memberData,
  })

  return { 
    success: data?.success || false, 
    userId: data?.userId,
    error 
  }
}

// Create trainer (admin)
export async function createTrainer(
  trainerData: {
    email: string
    password: string
    fullName: string
    phone?: string
    specializations?: string[]
    bio?: string
    experienceYears?: number
  }
): Promise<{ success: boolean; userId?: string; error: string | null }> {
  const { data, error } = await callEdgeFunction('admin-action', {
    action: 'create_trainer',
    data: trainerData,
  })

  return { 
    success: data?.success || false, 
    userId: data?.userId,
    error 
  }
}

// Delete user (admin)
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await callEdgeFunction('admin-action', {
    action: 'delete_user',
    data: { userId },
  })

  return { success: data?.success || false, error }
}

// Update subscription (admin)
export async function updateSubscription(
  subscriptionId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; error: string | null }> {
  const { data, error } = await callEdgeFunction('admin-action', {
    action: 'update_subscription',
    data: { subscriptionId, updates },
  })

  return { success: data?.success || false, error }
}

// ===== TRAINER CLIENT DATA ACCESS (Direct Supabase - Read-only) =====

// Get client body composition history (trainer/admin view)
export async function getClientBodyComposition(
  clientId: string
): Promise<{ compositions: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('body_compositions')
      .select('*')
      .eq('client_id', clientId)
      .order('measurement_date', { ascending: false })
      .limit(20)

    if (error) throw error
    return { compositions: data || [], error: null }
  } catch (error: any) {
    return { compositions: [], error: error.message }
  }
}

// Get client's latest body composition
export async function getClientLatestBodyComposition(
  clientId: string
): Promise<{ composition: any; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('body_compositions')
      .select('*')
      .eq('client_id', clientId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { composition: data || null, error: null }
  } catch (error: any) {
    return { composition: null, error: error.message }
  }
}

// Get client diet plans (trainer/admin view)
export async function getClientDietPlans(
  clientId: string
): Promise<{ plans: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('diet_plans')
      .select(`
        *,
        meals:diet_plan_meals(
          *,
          items:diet_plan_meal_items(*)
        )
      `)
      .eq('client_id', clientId)
      .order('start_date', { ascending: false })

    if (error) throw error
    const plans = data || []
    if (plans.length > 0) {
      const foodIds = new Set<string>()
      for (const p of plans) {
        for (const m of p.meals || []) {
          for (const item of m.items || []) {
            if (item.food_id) foodIds.add(item.food_id)
          }
        }
      }
      if (foodIds.size > 0) {
        const { data: foods } = await supabase.from('foods').select('id, name, name_ar').in('id', Array.from(foodIds))
        const foodMap = Object.fromEntries((foods || []).map((f: any) => [f.id, f]))
        for (const p of plans) {
          for (const m of p.meals || []) {
            for (const item of m.items || []) {
              item.food = foodMap[item.food_id] || null
            }
          }
        }
      }
    }
    return { plans, error: null }
  } catch (error: any) {
    return { plans: [], error: error.message }
  }
}

// Get client active diet plan
export async function getClientActiveDietPlan(
  clientId: string
): Promise<{ plan: any; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('diet_plans')
      .select(`
        *,
        meals:diet_plan_meals(
          *,
          items:diet_plan_meal_items(*)
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .lte('start_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    const plan = data
    if (plan?.meals?.length) {
      const foodIds = new Set<string>()
      for (const m of plan.meals) {
        for (const item of m.items || []) {
          if (item.food_id) foodIds.add(item.food_id)
        }
      }
      if (foodIds.size > 0) {
        const { data: foods } = await supabase.from('foods').select('id, name, name_ar').in('id', Array.from(foodIds))
        const foodMap = Object.fromEntries((foods || []).map((f: any) => [f.id, f]))
        for (const m of plan.meals) {
          for (const item of m.items || []) {
            item.food = foodMap[item.food_id] || null
          }
        }
      }
    }
    return { plan: plan || null, error: null }
  } catch (error: any) {
    return { plan: null, error: error.message }
  }
}

// Get client meal logs (trainer/admin view)
export async function getClientMealLogs(
  clientId: string,
  startDate?: string,
  endDate?: string
): Promise<{ logs: any[]; error: string | null }> {
  try {
    let query = supabase
      .from('meal_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('meal_date', { ascending: false })
      .limit(50)

    if (startDate) query = query.gte('meal_date', startDate)
    if (endDate) query = query.lte('meal_date', endDate)

    const { data, error } = await query
    if (error) throw error

    const rawLogs = data || []
    const logs = rawLogs.map((log: any) => ({
      ...log,
      log_date: log.meal_date || log.logged_at,
      total_calories: log.total_calories || 0,
      total_protein_g: log.total_protein_g || 0,
      total_carbs_g: log.total_carbs_g || 0,
      total_fat_g: log.total_fat_g || 0,
    }))
    return { logs, error: null }
  } catch (error: any) {
    return { logs: [], error: error.message }
  }
}

// Get meal commitments for a client's plan
export async function getClientMealCommitments(
  clientId: string,
  planId: string
): Promise<{ commitments: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('meal_commitments')
      .select('*')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .order('commitment_date', { ascending: true })

    if (error) throw error
    return { commitments: data || [], error: null }
  } catch (error: any) {
    return { commitments: [], error: error.message }
  }
}

// Get daily tracking for a client's plan
export async function getClientDailyTracking(
  clientId: string,
  planId: string
): Promise<{ tracking: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('daily_plan_tracking')
      .select('*')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .order('tracking_date', { ascending: true })

    if (error) throw error
    return { tracking: data || [], error: null }
  } catch (error: any) {
    return { tracking: [], error: error.message }
  }
}
