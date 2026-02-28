/**
 * List dietitians for admin (e.g. when assigning client to dietitian)
 * Uses dietitian_profiles as source of truth (joins profiles for id, full_name, email)
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

    const { data: dietitianProfiles, error: dpError } = await admin
      .from('dietitian_profiles')
      .select('user_id')
      .order('created_at', { ascending: false })

    if (dpError) throw dpError
    if (!dietitianProfiles?.length) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    const userIds = dietitianProfiles.map((d: { user_id: string }) => d.user_id)
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
      .order('full_name')

    if (error) throw error
    return NextResponse.json(profiles || [], {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('Dietitians API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dietitians' },
      { status: 500 }
    )
  }
}
