// Approve Registration Edge Function - admin approves/rejects registration requests
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
    
    // Get the auth header from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user making the request
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { requestId, action, adminNotes } = await req.json()

    if (!requestId || !action) {
      return new Response(
        JSON.stringify({ error: 'Request ID and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the registration request
    const { data: regRequest, error: fetchError } = await supabaseAuth
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !regRequest) {
      return new Response(
        JSON.stringify({ error: 'Registration request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (regRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Request already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'reject') {
      // Simply update status to rejected
      const { error: updateError } = await supabaseAuth
        .from('registration_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || 'Rejected by admin',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Registration rejected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'approve') {
      // Update status to approved - user creation happens on login
      const { error: updateError } = await supabaseAuth
        .from('registration_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || 'Approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) {
        throw updateError
      }

      // Create notification (will be checked on login)
      await supabaseAuth
        .from('notifications')
        .insert({
          recipient_type: 'registration',
          title: 'Registration Approved!',
          message: `Welcome to SweatBox Gym! Your registration has been approved. You can now login.`,
          type: 'success',
          related_id: requestId,
          related_type: 'registration_request'
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Registration approved! User can now login.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "approve" or "reject"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Approval error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
