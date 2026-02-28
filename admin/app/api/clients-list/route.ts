/**
 * Clients list for Client Nutrition page - ONLY clients on Nutrition Plan or Premium Package.
 * Nutrition Plan = with_dietitian ($300/mo), Premium Package = premium ($550/mo).
 * Other plans (normal_gym, with_pt, open_gym) are NOT shown in Client Nutrition.
 */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const NUTRITION_ELIGIBLE_PLANS = ['with_dietitian', 'premium']

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 500 }
      )
    }
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    // Only clients with ACTIVE subscription to Nutrition Plan OR Premium Package
    const { data: subData, error: subErr } = await admin
      .from('subscriptions')
      .select('client_id, subscription_type')
      .eq('status', 'active')
      .in('subscription_type', NUTRITION_ELIGIBLE_PLANS)
    if (subErr) throw subErr

    const clientIds = [...new Set((subData || []).map((s: any) => s.client_id))]
    if (clientIds.length === 0) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })

    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', clientIds)
      .order('full_name')
    if (profileError) throw profileError

    const { data: cpFull } = await admin
      .from('client_profiles')
      .select('user_id, fitness_goal')
      .in('user_id', clientIds)

    const subMap = Object.fromEntries((subData || []).map((s: any) => [s.client_id, s]))
    const cpMap = Object.fromEntries((cpFull || []).map((c: any) => [c.user_id, c]))

    const clients = (profileData || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || 'Unknown',
      email: p.email || '',
      phone: p.phone,
      fitness_goal: cpMap[p.id]?.fitness_goal,
      subscription_plan: subMap[p.id]?.subscription_type || null,
    }))

    return NextResponse.json(clients, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('Clients list API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load clients' },
      { status: 500 }
    )
  }
}
