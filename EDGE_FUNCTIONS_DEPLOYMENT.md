# SweatBox Gym - Edge Functions Deployment Guide

## Delete All Existing Functions First

Go to: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/functions

Click on each function and delete it. Delete ALL of these:
- admin-action
- approve-registration  
- body-composition
- diet-plan
- dietitian-action
- login
- meal-log
- register

---

## Deploy New Functions

You need to deploy **4 functions**. For each one:

1. Go to: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/functions
2. Click "Deploy a new function"
3. Enter the function name
4. Paste the code
5. Click "Deploy"

---

## Function 1: `register`

**Name:** `register`

**Code:**
```typescript
// Register Edge Function - handles new user registration requests
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
    const { email, password, fullName, phone, role, plan } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
      if (existingRequest.status === 'rejected') {
        await supabase
          .from('registration_requests')
          .delete()
          .eq('id', existingRequest.id)
      }
    }

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

    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: request, error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        password_hash: passwordHash,
        role: role || 'client',
        requested_plan: plan || 'open_gym',
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
```

---

## Function 2: `login`

**Name:** `login`

**Code:**
```typescript
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

    // First try normal login
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    })

    if (signInData?.session) {
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

    // Check for approved registration request
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

    // Verify password
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

    // Create auth user (first login after approval)
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true
    })

    if (createUserError) {
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
    await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: normalizedEmail,
        full_name: regRequest.full_name,
        phone: regRequest.phone,
        role: regRequest.role
      })

    // Create role-specific profile
    if (regRequest.role === 'client') {
      await supabaseAdmin.from('client_profiles').insert({
        user_id: userId,
        fitness_goal: regRequest.fitness_goal
      })

      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      await supabaseAdmin.from('subscriptions').insert({
        client_id: userId,
        subscription_type: regRequest.requested_plan || 'open_gym',
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      })

      await supabaseAdmin.from('loyalty_tracking').insert({
        client_id: userId,
        consecutive_months: 1,
        total_months: 1,
        last_subscription_date: startDate.toISOString().split('T')[0]
      })
    } else if (regRequest.role === 'trainer') {
      await supabaseAdmin.from('trainer_profiles').insert({
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
```

---

## Function 3: `approve-registration`

**Name:** `approve-registration`

**Code:**
```typescript
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
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const { requestId, action, adminNotes } = await req.json()

    if (!requestId || !action) {
      return new Response(
        JSON.stringify({ error: 'Request ID and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      await supabaseAuth
        .from('registration_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || 'Rejected by admin',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      return new Response(
        JSON.stringify({ success: true, message: 'Registration rejected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'approve') {
      await supabaseAuth
        .from('registration_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || 'Approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

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
```

---

## Function 4: `admin-action`

**Name:** `admin-action`

**Code:**
```typescript
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
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        const { email, password, fullName, phone, plan, fitnessGoal } = data

        if (!email || !password || !fullName) {
          return new Response(
            JSON.stringify({ error: 'Email, password, and full name are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

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

        await adminClient.from('profiles').insert({
          id: userId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
          phone: phone || null,
          role: 'client',
        })

        await adminClient.from('client_profiles').insert({
          user_id: userId,
          fitness_goal: fitnessGoal || null,
        })

        const now = new Date()
        const endDate = new Date(now)
        endDate.setMonth(endDate.getMonth() + 1)

        await adminClient.from('subscriptions').insert({
          client_id: userId,
          subscription_type: plan || 'open_gym',
          status: 'active',
          start_date: now.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        })

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

        await adminClient.from('profiles').insert({
          id: userId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
          phone: phone || null,
          role: 'trainer',
        })

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

      case 'check_in': {
        const { clientId } = data

        if (!clientId) {
          return new Response(
            JSON.stringify({ error: 'Client ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const today = new Date().toISOString().split('T')[0]

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
```

---

## Verification

After deploying all 4 functions, you should see them in the Functions dashboard:
- admin-action
- approve-registration
- login
- register

The dietitian functions (`body-composition`, `diet-plan`, `dietitian-action`, `meal-log`) are **NOT needed** - the dietitian dashboard now uses direct database calls.
