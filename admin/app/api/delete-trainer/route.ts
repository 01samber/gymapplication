/**
 * Delete a trainer and their auth user - prevents orphaned auth.users
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

    const { trainer_profile_id, user_id } = await req.json()
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Unassign / null all references to this trainer (avoid FK violation)
    await admin.from('client_profiles').update({ assigned_trainer_id: null }).eq('assigned_trainer_id', user_id)
    await admin.from('workout_logs').update({ trainer_id: null }).eq('trainer_id', user_id)
    if (trainer_profile_id) {
      await admin.from('trainer_profile_specializations').delete().eq('trainer_profile_id', trainer_profile_id)
      await admin.from('trainer_profiles').delete().eq('id', trainer_profile_id)
    }
    await admin.from('profiles').delete().eq('id', user_id)
    const { error } = await admin.auth.admin.deleteUser(user_id)

    if (error) {
      console.error('Auth delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete trainer error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to delete trainer'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
