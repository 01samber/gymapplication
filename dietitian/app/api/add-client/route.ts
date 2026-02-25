/**
 * Dietitian adds a new client (not in gym) - creates profile + client_profile + assignment.
 * Requires dietitian to be authenticated. Client gets temp password.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TEMP_PASSWORD = 'SweatBoxWelcome1!'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local for adding clients' },
        { status: 500 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - no token' }, { status: 401 })
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user: dietitianUser }, error: authError } = await anonClient.auth.getUser()
    if (authError || !dietitianUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await anonClient.from('profiles').select('role').eq('id', dietitianUser.id).single()
    if (profile?.role !== 'dietitian') {
      return NextResponse.json({ error: 'Only dietitians can add clients' }, { status: 403 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const { full_name, email, phone, date_of_birth } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: DEFAULT_TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: { needs_password_change: true, full_name: full_name || '' },
    })

    if (createError) {
      if (createError.message?.toLowerCase().includes('already been registered')) {
        return NextResponse.json({ error: 'This email is already registered' }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const userId = authData.user!.id

    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      email: normalizedEmail,
      full_name: full_name,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      role: 'client',
    })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    const { error: clientError } = await adminClient.from('client_profiles').insert({
      user_id: userId,
      assigned_dietitian_id: dietitianUser.id,
    })

    if (clientError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: clientError.message }, { status: 400 })
    }

    const { error: assignError } = await adminClient.from('client_dietitian_assignments').insert({
      client_id: userId,
      dietitian_id: dietitianUser.id,
      is_active: true,
    })

    if (assignError) {
      await adminClient.from('client_profiles').delete().eq('user_id', userId)
      await adminClient.from('profiles').delete().eq('id', userId)
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: assignError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      userId,
      tempPassword: DEFAULT_TEMP_PASSWORD,
      message: 'Client added. Share the temporary password. They must change it on first login.',
    })
  } catch (err) {
    console.error('Add client error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add client' },
      { status: 500 }
    )
  }
}
