// Login Edge Function - handles user login with registration approval check
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
    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    const normalizedEmail = email.toLowerCase()

    // First try normal login (for existing auth users like admin)
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    })

    if (signInData?.session) {
      // Login successful
      return new Response(
        JSON.stringify({
          success: true,
          session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_at: signInData.session.expires_at,
            user: signInData.user
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If login failed, check if there's an approved registration request
    const { data: regRequest } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (!regRequest) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check registration status
    if (regRequest.status === 'pending') {
      return new Response(
        JSON.stringify({ 
          error: 'Your registration is pending admin approval. Please wait.',
          status: 'PENDING'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (regRequest.status === 'rejected') {
      return new Response(
        JSON.stringify({ 
          error: 'Your registration was rejected. Please contact support.',
          status: 'REJECTED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Status is 'approved' - verify password and create auth user
    // Hash the provided password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (passwordHash !== regRequest.password_hash) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the auth user now (first login after approval)
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true
    })

    if (createUserError) {
      console.error('Create user error:', createUserError)
      
      // User might already exist, try to sign in
      const { data: retryLogin, error: retryError } = await supabaseClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      })

      if (retryLogin?.session) {
        return new Response(
          JSON.stringify({
            success: true,
            session: {
              access_token: retryLogin.session.access_token,
              refresh_token: retryLogin.session.refresh_token,
              expires_at: retryLogin.session.expires_at,
              user: retryLogin.user
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create account. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = newUser.user.id

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: normalizedEmail,
        full_name: regRequest.full_name,
        phone: regRequest.phone,
        role: regRequest.role
      })

    if (profileError) {
      console.error('Profile error:', profileError)
    }

    // Create role-specific profile
    if (regRequest.role === 'client') {
      // Create client profile
      await supabaseAdmin
        .from('client_profiles')
        .insert({
          user_id: userId,
          fitness_goal: regRequest.fitness_goal
        })

      // Create subscription
      // Map open_gym to normal_gym for COMPLETE_SETUP_V2 schema (subscription_type enum)
      const plan = regRequest.requested_plan || 'normal_gym'
      const subscriptionType = (plan === 'open_gym' ? 'normal_gym' : plan)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      // Get tier_id from subscription_tiers if available
      const { data: tier } = await supabaseAdmin
        .from('subscription_tiers')
        .select('id')
        .eq('tier_code', subscriptionType)
        .eq('is_active', true)
        .maybeSingle()

      // Try COMPLETE_SETUP_V2 schema first (subscription_type, tier_id)
      const subscriptionData: Record<string, unknown> = {
        client_id: userId,
        subscription_type: subscriptionType,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }
      if (tier?.id) subscriptionData.tier_id = tier.id

      let subError = (await supabaseAdmin.from('subscriptions').insert(subscriptionData)).error

      // Fallback for COMPLETE_FRESH_SETUP / legacy schema (type, price_usd, pt_sessions_included)
      if (subError) {
        const legacyType = subscriptionType === 'with_pt' ? 'with_pt' : 'open_gym'
        subError = (await supabaseAdmin.from('subscriptions').insert({
          client_id: userId,
          type: legacyType,
          status: 'active',
          price_usd: subscriptionType === 'with_pt' ? 200 : 75,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          pt_sessions_included: subscriptionType === 'with_pt' ? 8 : 0
        })).error
      }
      if (subError) console.error('Subscription insert error:', subError)

      // Create loyalty tracking
      await supabaseAdmin
        .from('loyalty_tracking')
        .insert({
          client_id: userId,
          consecutive_months: 1,
          total_months: 1,
          last_subscription_date: startDate.toISOString().split('T')[0]
        })
    } else if (regRequest.role === 'trainer') {
      // Create trainer profile
      await supabaseAdmin
        .from('trainer_profiles')
        .insert({
          user_id: userId,
          is_active: true
        })
    }

    // Sign in the new user
    const { data: finalLogin, error: finalLoginError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    })

    if (finalLoginError || !finalLogin.session) {
      console.error('Final login error:', finalLoginError)
      return new Response(
        JSON.stringify({ error: 'Account created but login failed. Please try logging in again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome to SweatBox Gym!',
        session: {
          access_token: finalLogin.session.access_token,
          refresh_token: finalLogin.session.refresh_token,
          expires_at: finalLogin.session.expires_at,
          user: finalLogin.user
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
