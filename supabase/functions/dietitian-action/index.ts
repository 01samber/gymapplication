// Dietitian Action Edge Function - admin/dietitian operations
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

    const { action, data } = await req.json()

    switch (action) {
      case 'create_dietitian': {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { email, password, fullName, phone, specializations, certifications, licenseNumber, bio } = data

        // Create auth user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password,
          email_confirm: true
        })

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const userId = newUser.user.id

        // Create profile
        await supabase.from('profiles').insert({
          id: userId,
          email: email.toLowerCase(),
          full_name: fullName,
          phone: phone || null,
          role: 'dietitian'
        })

        // Create dietitian profile
        await supabase.from('dietitian_profiles').insert({
          user_id: userId,
          specializations: specializations || [],
          certifications: certifications || [],
          license_number: licenseNumber || null,
          bio: bio || null,
          is_active: true
        })

        return new Response(
          JSON.stringify({ success: true, userId }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'assign_client_to_dietitian': {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { clientId, dietitianId, notes } = data

        // Verify client exists and is a client
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', clientId)
          .single()

        if (!clientProfile || clientProfile.role !== 'client') {
          return new Response(
            JSON.stringify({ error: 'Invalid client' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify dietitian exists
        const { data: dietitianProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', dietitianId)
          .single()

        if (!dietitianProfile || dietitianProfile.role !== 'dietitian') {
          return new Response(
            JSON.stringify({ error: 'Invalid dietitian' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Deactivate existing assignments
        await supabase
          .from('client_dietitian_assignments')
          .update({ is_active: false })
          .eq('client_id', clientId)
          .eq('is_active', true)

        // Create new assignment
        const { data: assignment, error } = await supabase
          .from('client_dietitian_assignments')
          .insert({
            client_id: clientId,
            dietitian_id: dietitianId,
            assigned_by: user.id,
            notes: notes || null,
            is_active: true
          })
          .select()
          .single()

        if (error) throw error

        // Update client_profiles with assigned_dietitian_id
        await supabase
          .from('client_profiles')
          .update({ assigned_dietitian_id: dietitianId })
          .eq('user_id', clientId)

        return new Response(
          JSON.stringify({ success: true, data: assignment }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'unassign_client': {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { clientId, dietitianId } = data

        // Deactivate assignment
        await supabase
          .from('client_dietitian_assignments')
          .update({ is_active: false })
          .eq('client_id', clientId)
          .eq('dietitian_id', dietitianId)

        // Clear assigned_dietitian_id from client_profiles
        await supabase
          .from('client_profiles')
          .update({ assigned_dietitian_id: null })
          .eq('user_id', clientId)

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_my_clients': {
        if (!isDietitian && !isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const dietitianId = isDietitian ? user.id : data.dietitianId

        const { data: assignments, error } = await supabase
          .from('client_dietitian_assignments')
          .select(`
            id,
            assigned_at,
            notes,
            client:client_id(
              id,
              email,
              full_name,
              phone,
              gender,
              date_of_birth
            )
          `)
          .eq('dietitian_id', dietitianId)
          .eq('is_active', true)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: assignments }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_all_dietitians': {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: dietitians, error } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            phone,
            dietitian_profile:dietitian_profiles(
              specializations,
              certifications,
              license_number,
              bio,
              is_active
            )
          `)
          .eq('role', 'dietitian')

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: dietitians }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_dietitian_profile': {
        const { dietitianId, updates } = data

        // Dietitians can update their own, admins can update any
        if (!isAdmin && (!isDietitian || user.id !== dietitianId)) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: updated, error } = await supabase
          .from('dietitian_profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', dietitianId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add_food': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can add foods' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { food } = data

        const { data: newFood, error } = await supabase
          .from('foods')
          .insert({
            ...food,
            created_by: user.id
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: newFood }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_food': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can update foods' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { foodId, updates } = data

        // Check if dietitian owns the food or is admin
        if (isDietitian) {
          const { data: food } = await supabase
            .from('foods')
            .select('created_by')
            .eq('id', foodId)
            .single()

          if (food?.created_by !== user.id) {
            return new Response(
              JSON.stringify({ error: 'You can only update foods you created' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const { data: updated, error } = await supabase
          .from('foods')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', foodId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_client_summary': {
        const { clientId } = data

        if (!clientId) {
          return new Response(
            JSON.stringify({ error: 'Client ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check access - admins can access any client, dietitians need assignment
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // If dietitian, verify they have this client assigned
        if (isDietitian && !isAdmin) {
          const { data: assignment, error: assignmentError } = await supabase
            .from('client_dietitian_assignments')
            .select('id')
            .eq('dietitian_id', user.id)
            .eq('client_id', clientId)
            .eq('is_active', true)
            .maybeSingle()

          if (!assignment) {
            return new Response(
              JSON.stringify({ error: 'Client not assigned to you' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        // Get client profile
        const { data: client } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            phone,
            gender,
            date_of_birth,
            client_profile:client_profiles(
              fitness_goal,
              height_cm,
              weight_kg,
              body_fat_percentage
            )
          `)
          .eq('id', clientId)
          .single()

        // Get latest body composition
        const { data: latestBody } = await supabase
          .from('body_compositions')
          .select('*')
          .eq('client_id', clientId)
          .order('measurement_date', { ascending: false })
          .limit(1)
          .single()

        // Get active diet plan
        const today = new Date().toISOString().split('T')[0]
        const { data: activePlan } = await supabase
          .from('diet_plans')
          .select('id, name, status, start_date, end_date, target_calories')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .limit(1)
          .single()

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

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              client,
              latestBodyComposition: latestBody,
              activeDietPlan: activePlan,
              weeklyCompliance,
              totalMealsLogged: totalLogs
            }
          }),
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
    console.error('Dietitian action error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
