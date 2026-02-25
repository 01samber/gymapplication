// Meal Log Edge Function - handles client meal logging
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
    const isClient = profile?.role === 'client'

    const { action, data } = await req.json()

    // Helper functions for access checks
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
      case 'log_meal': {
        // Only clients can log meals for themselves
        if (!isClient) {
          return new Response(
            JSON.stringify({ error: 'Only clients can log meals' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { mealType, plannedMealId, status, notes, photoUrl, items } = data

        // Create the meal log
        const { data: log, error: logError } = await supabase
          .from('meal_logs')
          .insert({
            client_id: user.id,
            diet_plan_meal_id: plannedMealId || null,
            meal_type: mealType,
            status: status || 'pending',
            notes: notes || null,
            photo_url: photoUrl || null
          })
          .select()
          .single()

        if (logError) throw logError

        // Add items if provided
        if (items && items.length > 0) {
          const itemsToInsert = items.map((item: any) => ({
            log_id: log.id,
            food_id: item.foodId || null,
            custom_name: item.customName || null,
            quantity: item.quantity,
            unit: item.unit || 'g',
            calories: item.calories || null,
            protein_g: item.proteinG || null,
            carbs_g: item.carbsG || null,
            fat_g: item.fatG || null,
            notes: item.notes || null
          }))

          const { error: itemsError } = await supabase
            .from('meal_log_items')
            .insert(itemsToInsert)

          if (itemsError) throw itemsError
        }

        // Fetch the complete log with items
        const { data: completeLog, error: fetchError } = await supabase
          .from('meal_logs')
          .select(`
            *,
            items:meal_log_items(
              *,
              food:food_id(id, name, name_ar)
            )
          `)
          .eq('id', log.id)
          .single()

        if (fetchError) throw fetchError

        return new Response(
          JSON.stringify({ success: true, data: completeLog }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'mark_meal_status': {
        // Only clients can mark their own meals
        if (!isClient) {
          return new Response(
            JSON.stringify({ error: 'Only clients can update meal status' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { plannedMealId, status, notes } = data

        // Create a simple log entry marking the meal as followed/skipped
        const { data: log, error } = await supabase
          .from('meal_logs')
          .insert({
            client_id: user.id,
            diet_plan_meal_id: plannedMealId,
            meal_type: 'breakfast', // Will be overwritten
            status: status,
            notes: notes || null
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: log }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_my_logs': {
        if (!isClient) {
          return new Response(
            JSON.stringify({ error: 'Only clients can view their own logs' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { startDate, endDate, limit = 50 } = data

        let query = supabase
          .from('meal_logs')
          .select(`
            *,
            planned_meal:diet_plan_meal_id(id, meal_type, name),
            items:meal_log_items(
              *,
              food:food_id(id, name, name_ar)
            )
          `)
          .eq('client_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(limit)

        if (startDate) {
          query = query.gte('meal_date', startDate)
        }
        if (endDate) {
          query = query.lte('meal_date', endDate)
        }

        const { data: logs, error } = await query

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: logs }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_client_logs': {
        const { clientId, startDate, endDate, limit = 50 } = data

        // Check access
        const canAccess = isAdmin || 
          await hasDietitianAccess(clientId) || 
          await hasTrainerAccess(clientId)
        
        if (!canAccess) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let query = supabase
          .from('meal_logs')
          .select(`
            *,
            planned_meal:diet_plan_meal_id(id, meal_type, name),
            items:meal_log_items(
              *,
              food:food_id(id, name, name_ar)
            )
          `)
          .eq('client_id', clientId)
          .order('logged_at', { ascending: false })
          .limit(limit)

        if (startDate) {
          query = query.gte('meal_date', startDate)
        }
        if (endDate) {
          query = query.lte('meal_date', endDate)
        }

        const { data: logs, error } = await query

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: logs }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_compliance_stats': {
        const { clientId, startDate, endDate } = data

        // If client is checking their own, allow
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

        const { data: logs, error } = await supabase
          .from('meal_logs')
          .select('status')
          .eq('client_id', clientId)
          .gte('meal_date', startDate)
          .lte('meal_date', endDate)

        if (error) throw error

        const total = logs.length
        const followed = logs.filter(l => l.status === 'followed').length
        const modified = logs.filter(l => l.status === 'modified').length
        const skipped = logs.filter(l => l.status === 'skipped').length
        const pending = logs.filter(l => l.status === 'pending').length

        const complianceRate = total > 0 ? Math.round((followed / total) * 100) : 0

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              total,
              followed,
              modified,
              skipped,
              pending,
              complianceRate
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_log': {
        if (!isClient) {
          return new Response(
            JSON.stringify({ error: 'Only clients can update their logs' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { logId, updates } = data

        // Verify ownership
        const { data: existing } = await supabase
          .from('meal_logs')
          .select('client_id')
          .eq('id', logId)
          .single()

        if (!existing || existing.client_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Log not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: updated, error } = await supabase
          .from('meal_logs')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', logId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_log': {
        if (!isClient) {
          return new Response(
            JSON.stringify({ error: 'Only clients can delete their logs' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { logId } = data

        // Verify ownership
        const { data: existing } = await supabase
          .from('meal_logs')
          .select('client_id')
          .eq('id', logId)
          .single()

        if (!existing || existing.client_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Log not found or access denied' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error } = await supabase
          .from('meal_logs')
          .delete()
          .eq('id', logId)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
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
    console.error('Meal log error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
