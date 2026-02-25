import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TEMP_PASSWORD = 'SweatBoxWelcome1!'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server misconfigured: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      )
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const { full_name, email, phone, date_of_birth, specializations, certifications, bio, experience_years } = body

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
      role: 'dietitian',
    })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    const specArray = specializations
      ? (typeof specializations === 'string' && specializations.includes(',')
          ? specializations.split(',').map((s: string) => s.trim())
          : [specializations])
      : []
    const certArray = certifications
      ? (typeof certifications === 'string' && certifications.includes(',')
          ? certifications.split(',').map((c: string) => c.trim())
          : [certifications])
      : []

    const { error: dietitianError } = await adminClient.from('dietitian_profiles').insert({
      user_id: userId,
      specializations: specArray,
      certifications: certArray,
      bio: bio || null,
      experience_years: parseInt(experience_years) || 0,
    })

    if (dietitianError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: dietitianError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      userId,
      tempPassword: DEFAULT_TEMP_PASSWORD,
      message: 'Nutritionist added. Share the temporary password. They must change it on first login.',
    })
  } catch (err) {
    console.error('Add nutritionist error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add nutritionist' },
      { status: 500 }
    )
  }
}
