// Edge Function: Protected Admin Actions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, data } = await req.json()

    switch (action) {
      case 'create_member': {
        // Create a new member directly (skip registration approval)
        const { email, password, fullName, phone, plan, fitnessGoal } = data

        if (!email || !password || !fullName) {
          return new Response(
            JSON.stringify({ error: 'Email, password, and full name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create auth user
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password: password,
          email_confirm: true,
        })

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const userId = authData.user!.id

        // Create profile
        await adminClient.from('profiles').insert({
          id: userId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
          phone: phone || null,
          role: 'client',
        })

        // Create client profile
        await adminClient.from('client_profiles').insert({
          user_id: userId,
          fitness_goal: fitnessGoal || null,
        })

        // Create subscription
        const now = new Date()
        const endDate = new Date(now)
        endDate.setMonth(endDate.getMonth() + 1)
        const memberPlan = plan || 'open_gym'

        await adminClient.from('subscriptions').insert({
          client_id: userId,
          type: memberPlan,
          status: 'active',
          price_usd: memberPlan === 'with_pt' ? 200 : 75,
          start_date: now.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          pt_sessions_included: memberPlan === 'with_pt' ? 12 : 0,
          pt_sessions_used: 0,
        })

        // Create loyalty tracking
        await adminClient.from('loyalty_tracking').insert({
          client_id: userId,
          consecutive_months: 1,
          total_months: 1,
          last_subscription_date: now.toISOString().split('T')[0],
        })

        return new Response(
          JSON.stringify({ success: true, userId }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_trainer': {
        const { email, password, fullName, phone, specializations, bio, experienceYears } = data

        if (!email || !password || !fullName) {
          return new Response(
            JSON.stringify({ error: 'Email, password, and full name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create auth user
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password: password,
          email_confirm: true,
        })

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const userId = authData.user!.id

        // Create profile
        await adminClient.from('profiles').insert({
          id: userId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
          phone: phone || null,
          role: 'trainer',
        })

        // Create trainer profile
        await adminClient.from('trainer_profiles').insert({
          user_id: userId,
          specializations: specializations || [],
          bio: bio || null,
          experience_years: experienceYears || null,
          is_active: true,
        })

        return new Response(
          JSON.stringify({ success: true, userId }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_user': {
        const { userId } = data

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete from auth (cascades to profiles due to FK)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_subscription': {
        const { subscriptionId, updates } = data

        if (!subscriptionId) {
          return new Response(
            JSON.stringify({ error: 'Subscription ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: updateError } = await adminClient
          .from('subscriptions')
          .update(updates)
          .eq('id', subscriptionId)

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'check_in': {
        // Record a client check-in
        const { clientId } = data

        if (!clientId) {
          return new Response(
            JSON.stringify({ error: 'Client ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const today = new Date().toISOString().split('T')[0]

        // Check if already checked in today
        const { data: existing } = await adminClient
          .from('attendance')
          .select('id')
          .eq('client_id', clientId)
          .eq('check_in_date', today)
          .maybeSingle()

        if (existing) {
          return new Response(
            JSON.stringify({ error: 'Already checked in today' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: attendance, error: checkInError } = await adminClient
          .from('attendance')
          .insert({
            client_id: clientId,
            check_in: new Date().toISOString(),
            check_in_date: today,
          })
          .select()
          .single()

        if (checkInError) {
          return new Response(
            JSON.stringify({ error: checkInError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, attendance }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'check_out': {
        // Record a client check-out
        const { clientId, attendanceId } = data

        if (!clientId && !attendanceId) {
          return new Response(
            JSON.stringify({ error: 'Client ID or Attendance ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let query = adminClient.from('attendance').update({ check_out: new Date().toISOString() })

        if (attendanceId) {
          query = query.eq('id', attendanceId)
        } else {
          // Find today's active check-in for this client
          const today = new Date().toISOString().split('T')[0]
          query = query
            .eq('client_id', clientId)
            .eq('check_in_date', today)
            .is('check_out', null)
        }

        const { error: checkOutError } = await query

        if (checkOutError) {
          return new Response(
            JSON.stringify({ error: checkOutError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Admin action error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
