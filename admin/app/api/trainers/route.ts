/**
 * List trainers for admin (e.g. when assigning client to trainer)
 * Uses trainer_profiles as source of truth (joins profiles for id, full_name, email)
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: trainerProfiles, error: tpError } = await admin
      .from('trainer_profiles')
      .select('user_id')
      .order('created_at', { ascending: false })

    if (tpError) throw tpError
    if (!trainerProfiles?.length) return NextResponse.json([])

    const userIds = trainerProfiles.map((t: { user_id: string }) => t.user_id)
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
      .order('full_name')

    if (error) throw error
    return NextResponse.json(profiles || [])
  } catch (err) {
    console.error('Trainers API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load trainers' },
      { status: 500 }
    )
  }
}
