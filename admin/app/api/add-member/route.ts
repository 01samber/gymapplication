import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TEMP_PASSWORD = 'SweatBoxWelcome1!'

const PLAN_CONFIG: Record<string, { price: number; ptSessions: number; subscriptionType: string }> = {
  normal_gym: { price: 150, ptSessions: 0, subscriptionType: 'normal_gym' },
  with_pt: { price: 350, ptSessions: 8, subscriptionType: 'with_pt' },
  with_dietitian: { price: 300, ptSessions: 0, subscriptionType: 'with_dietitian' },
  premium: { price: 550, ptSessions: 12, subscriptionType: 'premium' },
  open_gym: { price: 75, ptSessions: 0, subscriptionType: 'open_gym' },
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: Missing Supabase credentials. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 500 }
      )
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const { full_name, email, phone, date_of_birth, plan, fitness_goal, dietitian_id, trainer_id } = body

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const planConfig = PLAN_CONFIG[plan || 'normal_gym'] || PLAN_CONFIG.normal_gym

    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: DEFAULT_TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        needs_password_change: true,
        full_name: full_name || '',
      },
    })

    if (createError) {
      if (createError.message?.toLowerCase().includes('already been registered')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    const planType = planConfig.subscriptionType
    let assignedTrainer: string | null = null
    let assignedDietitian: string | null = null
    if ((planType === 'with_pt' || planType === 'premium') && trainer_id) {
      const { data: tp } = await adminClient.from('trainer_profiles').select('user_id').eq('user_id', trainer_id).single()
      if (tp) assignedTrainer = trainer_id
    }
    if ((planType === 'with_dietitian' || planType === 'premium') && dietitian_id) {
      const { data: dp } = await adminClient.from('dietitian_profiles').select('user_id').eq('user_id', dietitian_id).single()
      if (dp) assignedDietitian = dietitian_id
    }

    const { error: clientError } = await adminClient.from('client_profiles').insert({
      user_id: userId,
      fitness_goal: fitness_goal || null,
      assigned_trainer_id: assignedTrainer,
      assigned_dietitian_id: assignedDietitian,
    })

    if (clientError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: clientError.message },
        { status: 400 }
      )
    }

    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)

    const subPayload = {
      client_id: userId,
      status: 'active',
      start_date: now.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }

    const { error: subError } = await adminClient.from('subscriptions').insert({
      ...subPayload,
      subscription_type: planConfig.subscriptionType,
    })

    if (subError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: subError.message }, { status: 400 })
    }

    const { error: loyaltyError } = await adminClient.from('loyalty_tracking').insert({
      client_id: userId,
      consecutive_months: 1,
      total_months: 1,
      last_subscription_date: now.toISOString().split('T')[0],
    })
    if (loyaltyError && !loyaltyError.message?.includes('duplicate')) {
      // Non-fatal - member is created
    }

    // Assign to dietitian when Nutrition Plan or Premium (admin passes dietitian_id)
    if ((planType === 'with_dietitian' || planType === 'premium') && assignedDietitian) {
      const { error: assignErr } = await adminClient.from('client_dietitian_assignments').insert({
        client_id: userId,
        dietitian_id: assignedDietitian,
        is_active: true,
      })
      if (!assignErr || assignErr.message?.toLowerCase().includes('duplicate')) {
        await adminClient.from('client_profiles').update({ assigned_dietitian_id: assignedDietitian }).eq('user_id', userId)
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      tempPassword: DEFAULT_TEMP_PASSWORD,
      message: 'Member added. Share the temporary password with the client. They must change it on first login.',
    })
  } catch (err) {
    console.error('Add member error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add member' },
      { status: 500 }
    )
  }
}
