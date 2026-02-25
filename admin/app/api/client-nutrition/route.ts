/**
 * Client Nutrition API - uses service role for reliable admin access.
 * Bypasses RLS to ensure admin can always read client nutrition data.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { clientId, tab, startDate, endDate } = await req.json()

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const result: Record<string, unknown> = {}

    // Body tab
    if (tab === 'body' || !tab) {
      const { data: compositions, error } = await admin
        .from('body_compositions')
        .select('*')
        .eq('client_id', clientId)
        .order('measurement_date', { ascending: false })
        .limit(20)
      if (error) throw error
      result.compositions = compositions || []
    }

    // Diet / Commitment tabs
    if (tab === 'diet' || tab === 'commitment' || !tab) {
      const { data: plans, error } = await admin
        .from('diet_plans')
        .select('*, meals:diet_plan_meals(*, items:diet_plan_meal_items(*))')
        .eq('client_id', clientId)
        .order('start_date', { ascending: false })

      if (error) throw error
      const plansList = plans || []

      // Enrich items with food names
      const foodIds = new Set<string>()
      for (const p of plansList) {
        for (const m of (p as any).meals || []) {
          for (const item of m.items || []) {
            if (item.food_id) foodIds.add(item.food_id)
          }
        }
      }
      if (foodIds.size > 0) {
        const { data: foods } = await admin.from('foods').select('id, name, name_ar').in('id', Array.from(foodIds))
        const foodMap = Object.fromEntries((foods || []).map((f: any) => [f.id, f]))
        for (const p of plansList) {
          for (const m of (p as any).meals || []) {
            for (const item of m.items || []) {
              item.food = foodMap[item.food_id] || null
            }
          }
        }
      }
      result.plans = plansList

      if (tab === 'commitment' || !tab) {
        const activePlan = plansList.find((p: any) => p.status === 'active')
        if (activePlan) {
          try {
            const { data: commitments } = await admin
              .from('meal_commitments')
              .select('*')
              .eq('client_id', clientId)
              .eq('plan_id', activePlan.id)
              .order('commitment_date', { ascending: true })
            result.commitments = commitments || []
          } catch {
            result.commitments = []
          }
          try {
            const { data: tracking } = await admin
              .from('daily_plan_tracking')
              .select('*')
              .eq('client_id', clientId)
              .eq('plan_id', activePlan.id)
              .order('tracking_date', { ascending: true })
            result.tracking = tracking || []
          } catch {
            result.tracking = []
          }
        } else {
          result.commitments = []
          result.tracking = []
        }
      }
    }

    // Logs tab
    if (tab === 'logs' || !tab) {
      let q = admin
        .from('meal_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('meal_date', { ascending: false })
        .limit(50)
      if (startDate) q = q.gte('meal_date', startDate)
      if (endDate) q = q.lte('meal_date', endDate)

      const { data: logs, error } = await q
      if (error) throw error
      result.logs = (logs || []).map((log: any) => ({
        ...log,
        log_date: log.meal_date || log.logged_at,
        total_calories: log.total_calories || 0,
        total_protein_g: log.total_protein_g || 0,
        total_carbs_g: log.total_carbs_g || 0,
        total_fat_g: log.total_fat_g || 0,
      }))
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Client nutrition API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load nutrition data' },
      { status: 500 }
    )
  }
}
