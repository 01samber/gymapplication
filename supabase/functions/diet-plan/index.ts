// Diet Plan Edge Function - manages diet plans, meals, and food items
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isDietitian = profile?.role === 'dietitian'
    const isTrainer = profile?.role === 'trainer'

    const { action, data } = await req.json()

    // Helper function to check dietitian-client assignment
    async function hasDietitianAccess(clientId: string): Promise<boolean> {
      if (isAdmin) return true
      if (!isDietitian) return false
      
      const { data: assignment } = await supabase
        .from('client_dietitian_assignments')
        .select('id')
        .eq('dietitian_id', user.id)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      return !!assignment
    }

    // Helper function to check trainer-client assignment
    async function hasTrainerAccess(clientId: string): Promise<boolean> {
      if (isAdmin) return true
      if (!isTrainer) return false
      
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('assigned_trainer_id')
        .eq('user_id', clientId)
        .single()
      
      return clientProfile?.assigned_trainer_id === user.id
    }

    switch (action) {
      case 'get_client_plans': {
        const { clientId, status } = data
        
        // Check access
        const isOwnData = user.id === clientId
        const canAccess = isOwnData || isAdmin || 
          await hasDietitianAccess(clientId) || 
          await hasTrainerAccess(clientId)
        
        if (!canAccess) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let query = supabase
          .from('diet_plans')
          .select(`
            *,
            dietitian:dietitian_id(id, full_name),
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

        const { data: plans, error } = await query

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: plans }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_active_plan': {
        const { clientId } = data
        
        const isOwnData = user.id === clientId
        const canAccess = isOwnData || isAdmin || 
          await hasDietitianAccess(clientId) || 
          await hasTrainerAccess(clientId)
        
        if (!canAccess) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const today = new Date().toISOString().split('T')[0]
        
        const { data: plan, error } = await supabase
          .from('diet_plans')
          .select(`
            *,
            dietitian:dietitian_id(id, full_name),
            meals:diet_plan_meals(
              *,
              items:diet_plan_meal_items(
                *,
                food:food_id(id, name, name_ar, calories_per_100g, protein_g, carbs_g, fat_g)
              )
            )
          `)
          .eq('client_id', clientId)
          .eq('status', 'active')
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order('start_date', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        return new Response(
          JSON.stringify({ success: true, data: plan || null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_plan': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can create diet plans' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { clientId, plan } = data

        if (isDietitian && !(await hasDietitianAccess(clientId))) {
          return new Response(
            JSON.stringify({ error: 'Client not assigned to you' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: newPlan, error } = await supabase
          .from('diet_plans')
          .insert({
            client_id: clientId,
            dietitian_id: user.id,
            ...plan
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: newPlan }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_plan': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can update diet plans' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { planId, updates } = data

        // Get plan to check access
        const { data: existingPlan } = await supabase
          .from('diet_plans')
          .select('client_id, dietitian_id')
          .eq('id', planId)
          .single()

        if (!existingPlan) {
          return new Response(
            JSON.stringify({ error: 'Plan not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (isDietitian && existingPlan.dietitian_id !== user.id && 
            !(await hasDietitianAccess(existingPlan.client_id))) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: updated, error } = await supabase
          .from('diet_plans')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', planId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add_meal': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can add meals' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { planId, meal } = data

        // Check plan access
        const { data: plan } = await supabase
          .from('diet_plans')
          .select('client_id, dietitian_id')
          .eq('id', planId)
          .single()

        if (!plan) {
          return new Response(
            JSON.stringify({ error: 'Plan not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (isDietitian && plan.dietitian_id !== user.id && 
            !(await hasDietitianAccess(plan.client_id))) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: newMeal, error } = await supabase
          .from('diet_plan_meals')
          .insert({
            plan_id: planId,
            ...meal
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: newMeal }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add_meal_item': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can add meal items' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { mealId, item } = data

        const { data: newItem, error } = await supabase
          .from('diet_plan_meal_items')
          .insert({
            meal_id: mealId,
            ...item
          })
          .select(`
            *,
            food:food_id(id, name, name_ar)
          `)
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: newItem }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_meal': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can delete meals' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { mealId } = data

        const { error } = await supabase
          .from('diet_plan_meals')
          .delete()
          .eq('id', mealId)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_meal_item': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can delete meal items' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { itemId } = data

        const { error } = await supabase
          .from('diet_plan_meal_items')
          .delete()
          .eq('id', itemId)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'search_foods': {
        const { query, category, limit = 20 } = data

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

        const { data: foods, error } = await foodQuery

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: foods }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Diet plan error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
