import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TEMP_PASSWORD = 'SweatBoxWelcome1!'

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
    const { full_name, email, phone, date_of_birth, specialization, specialization_ids, experience_years, bio } = body

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

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
      role: 'trainer',
    })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    const specIds = Array.isArray(specialization_ids) ? specialization_ids : []
    let specializations: string[] = specialization
      ? (specialization.includes(',') ? specialization.split(',').map((s: string) => s.trim()) : [specialization])
      : []
    if (specIds.length > 0 && specializations.length === 0) {
      const { data: specRows } = await adminClient.from('specializations').select('name').in('id', specIds)
      specializations = (specRows || []).map((r) => r.name)
    }

    const { data: trainerRow, error: trainerError } = await adminClient
      .from('trainer_profiles')
      .insert({
        user_id: userId,
        specializations: specializations.length > 0 ? specializations : [],
        experience_years: parseInt(experience_years) || 0,
        bio: bio || null,
      })
      .select('id')
      .single()

    if (trainerError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: trainerError.message },
        { status: 400 }
      )
    }

    if (trainerRow && specIds.length > 0) {
      await adminClient.from('trainer_profile_specializations').insert(
        specIds.map((sid: string) => ({ trainer_profile_id: trainerRow.id, specialization_id: sid }))
      )
    }

    return NextResponse.json({
      success: true,
      userId,
      tempPassword: DEFAULT_TEMP_PASSWORD,
      message: 'Trainer added. Share the temporary password. They must change it on first login in the app.',
    })
  } catch (err) {
    console.error('Add trainer error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add trainer' },
      { status: 500 }
    )
  }
}
