/**
 * Delete a member and their auth user - prevents orphaned auth.users traffic
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

    const { user_id } = await req.json()
    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    await admin.from('client_profiles').delete().eq('user_id', user_id)
    await admin.from('profiles').delete().eq('id', user_id)
    const { error } = await admin.auth.admin.deleteUser(user_id)

    if (error) {
      console.error('Auth delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete member error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete member' },
      { status: 500 }
    )
  }
}
