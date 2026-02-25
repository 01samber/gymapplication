// Register Edge Function - handles new user registration requests
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, fullName, phone, role, plan, fitnessGoal } = await req.json()

    // Validate required fields
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if email already exists in registration_requests
    const { data: existingRequest } = await supabase
      .from('registration_requests')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return new Response(
          JSON.stringify({ error: 'Registration already pending approval' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (existingRequest.status === 'approved') {
        return new Response(
          JSON.stringify({ error: 'Email already registered. Please login.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // If rejected, allow re-registration by deleting old request
      if (existingRequest.status === 'rejected') {
        await supabase
          .from('registration_requests')
          .delete()
          .eq('id', existingRequest.id)
      }
    }

    // Check if email exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Email already registered. Please login.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash password using SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Store the PLAIN password hash (we'll use it with Supabase Auth later)
    // For now, just store a marker that we have the password
    // The actual auth user will be created on approval

    // Map open_gym to normal_gym for COMPLETE_SETUP_V2 schema compatibility
    const requestedPlan = (plan === 'open_gym' ? 'normal_gym' : plan) || 'normal_gym'

    // Insert registration request
    const { data: request, error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        password_hash: passwordHash,
        role: role || 'client',
        requested_plan: requestedPlan,
        fitness_goal: fitnessGoal || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to submit registration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification for admin
    await supabase
      .from('notifications')
      .insert({
        recipient_type: 'admin',
        title: 'New Registration Request',
        message: `${fullName} (${email}) has requested to join as a ${role || 'client'}`,
        type: 'registration',
        related_id: request.id,
        related_type: 'registration_request'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registration submitted! Waiting for admin approval.',
        requestId: request.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
