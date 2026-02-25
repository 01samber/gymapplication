// Body Composition Edge Function - manages InBody-style body measurements
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

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isDietitian = profile?.role === 'dietitian'

    const { action, data } = await req.json()

    switch (action) {
      case 'get_client_history': {
        const { clientId, limit = 10 } = data
        
        // Check permissions
        if (!isAdmin && !isDietitian) {
          // Check if user is the client themselves
          if (user.id !== clientId) {
            // Check if user is trainer with this client
            const { data: clientProfile } = await supabase
              .from('client_profiles')
              .select('assigned_trainer_id')
              .eq('user_id', clientId)
              .single()
            
            if (clientProfile?.assigned_trainer_id !== user.id) {
              return new Response(
                JSON.stringify({ error: 'Access denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }
        }

        // If dietitian, verify assignment
        if (isDietitian) {
          const { data: assignment } = await supabase
            .from('client_dietitian_assignments')
            .select('id')
            .eq('dietitian_id', user.id)
            .eq('client_id', clientId)
            .eq('is_active', true)
            .single()
          
          if (!assignment && user.id !== clientId) {
            return new Response(
              JSON.stringify({ error: 'Client not assigned to you' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const { data: compositions, error } = await supabase
          .from('body_compositions')
          .select('*')
          .eq('client_id', clientId)
          .order('measurement_date', { ascending: false })
          .limit(limit)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: compositions }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'add_measurement': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can add body compositions' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { clientId, measurement } = data

        // If dietitian, verify assignment
        if (isDietitian) {
          const { data: assignment } = await supabase
            .from('client_dietitian_assignments')
            .select('id')
            .eq('dietitian_id', user.id)
            .eq('client_id', clientId)
            .eq('is_active', true)
            .single()
          
          if (!assignment) {
            return new Response(
              JSON.stringify({ error: 'Client not assigned to you' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const { data: newComposition, error } = await supabase
          .from('body_compositions')
          .insert({
            client_id: clientId,
            recorded_by_id: user.id,
            ...measurement
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: newComposition }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_measurement': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can update body compositions' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { compositionId, updates } = data

        // Get the composition to check ownership
        const { data: existing } = await supabase
          .from('body_compositions')
          .select('client_id, recorded_by_id')
          .eq('id', compositionId)
          .single()

        if (!existing) {
          return new Response(
            JSON.stringify({ error: 'Composition not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // If dietitian, verify they recorded it or have assignment
        if (isDietitian && existing.recorded_by_id !== user.id) {
          const { data: assignment } = await supabase
            .from('client_dietitian_assignments')
            .select('id')
            .eq('dietitian_id', user.id)
            .eq('client_id', existing.client_id)
            .eq('is_active', true)
            .single()
          
          if (!assignment) {
            return new Response(
              JSON.stringify({ error: 'Access denied' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const { data: updated, error } = await supabase
          .from('body_compositions')
          .update(updates)
          .eq('id', compositionId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, data: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_latest': {
        const { clientId } = data
        
        // Same permission checks as get_client_history
        if (!isAdmin && !isDietitian && user.id !== clientId) {
          const { data: clientProfile } = await supabase
            .from('client_profiles')
            .select('assigned_trainer_id')
            .eq('user_id', clientId)
            .single()
          
          if (clientProfile?.assigned_trainer_id !== user.id) {
            return new Response(
              JSON.stringify({ error: 'Access denied' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const { data: composition, error } = await supabase
          .from('body_compositions')
          .select('*')
          .eq('client_id', clientId)
          .order('measurement_date', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        return new Response(
          JSON.stringify({ success: true, data: composition || null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_measurement': {
        if (!isAdmin && !isDietitian) {
          return new Response(
            JSON.stringify({ error: 'Only dietitians and admins can delete body compositions' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { compositionId } = data

        if (!compositionId) {
          return new Response(
            JSON.stringify({ error: 'Composition ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get the composition to check ownership
        const { data: existing, error: fetchError } = await supabase
          .from('body_compositions')
          .select('client_id, recorded_by_id')
          .eq('id', compositionId)
          .single()

        if (fetchError && fetchError.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Composition not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (fetchError) throw fetchError

        // If dietitian, verify they recorded it or have assignment
        if (isDietitian && existing.recorded_by_id !== user.id) {
          const { data: assignment } = await supabase
            .from('client_dietitian_assignments')
            .select('id')
            .eq('dietitian_id', user.id)
            .eq('client_id', existing.client_id)
            .eq('is_active', true)
            .single()
          
          if (!assignment) {
            return new Response(
              JSON.stringify({ error: 'Access denied' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const { error } = await supabase
          .from('body_compositions')
          .delete()
          .eq('id', compositionId)

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
    console.error('Body composition error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
