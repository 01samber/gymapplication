import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error(
    'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  )
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be generated from Supabase)
export type Profile = {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: 'client' | 'trainer' | 'admin'
  date_of_birth: string | null
  gender: string | null
  created_at: string
  updated_at: string
}

export type Booking = {
  id: string
  client_id: string
  trainer_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  session_type: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Subscription = {
  id: string
  client_id: string
  type: 'open_gym' | 'with_pt'
  status: 'active' | 'expired' | 'cancelled' | 'frozen'
  price_usd: number
  start_date: string
  end_date: string
  pt_sessions_included: number
  pt_sessions_used: number
  created_at: string
}

export type BodyMetrics = {
  id: string
  client_id: string
  recorded_by: string | null
  measurement_date: string
  weight_kg: number | null
  height_cm: number | null
  bmi: number | null
  body_fat_percentage: number | null
  muscle_mass_kg: number | null
  created_at: string
}
