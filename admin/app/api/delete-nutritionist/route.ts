/**
 * Delete a nutritionist and their auth user - prevents orphaned auth.users
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    const { dietitian_profile_id, user_id } = await req.json()
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Unassign / null all references to this dietitian (avoid FK violation)
    await admin.from('client_profiles').update({ assigned_dietitian_id: null }).eq('assigned_dietitian_id', user_id)
    await admin.from('client_dietitian_assignments').delete().eq('dietitian_id', user_id)
    await admin.from('diet_plans').update({ dietitian_id: null }).eq('dietitian_id', user_id)
    await admin.from('body_compositions').update({ recorded_by_id: null }).eq('recorded_by_id', user_id)
    if (dietitian_profile_id) {
      await admin.from('dietitian_profile_specializations').delete().eq('dietitian_profile_id', dietitian_profile_id)
      await admin.from('dietitian_profiles').delete().eq('id', dietitian_profile_id)
    }
    await admin.from('profiles').delete().eq('id', user_id)
    const { error } = await admin.auth.admin.deleteUser(user_id)

    if (error) {
      console.error('Auth delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete nutritionist error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to delete nutritionist'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
