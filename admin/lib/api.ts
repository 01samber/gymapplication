import { supabase, Profile, Booking, Subscription } from './supabase'

// ============ PROFILES API ============

export async function getProfiles(role?: 'client' | 'trainer' | 'admin') {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role)
  const { data, error } = await query
  if (error) throw error
  return data as Profile[]
}

export async function getProfileById(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Profile
}

export async function createProfile(profile: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').insert(profile).select().single()
  if (error) throw error
  return data as Profile
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

// ============ CLIENT PROFILES API ============

export async function createClientProfile(id: string, data: { fitness_goal?: string }) {
  const { error } = await supabase.from('client_profiles').insert({ id, ...data })
  if (error) throw error
}

// ============ TRAINER PROFILES API ============

export async function getTrainerProfile(id: string) {
  const { data, error } = await supabase.from('trainer_profiles').select('*').eq('id', id).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createTrainerProfile(id: string, data: {
  specializations?: string[]
  certifications?: string[]
  hourly_rate_usd?: number
  is_available?: boolean
  bio?: string
}) {
  const { error } = await supabase.from('trainer_profiles').insert({ id, ...data })
  if (error) throw error
}

export async function updateTrainerProfile(id: string, updates: any) {
  const { error } = await supabase.from('trainer_profiles').update(updates).eq('id', id)
  if (error) throw error
}

// ============ SUBSCRIPTIONS API ============

export async function getSubscriptions() {
  const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Subscription[]
}

export async function getSubscriptionByClientId(clientId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as Subscription | null
}

export async function createSubscription(subscription: Partial<Subscription>) {
  const { data, error } = await supabase.from('subscriptions').insert(subscription).select().single()
  if (error) throw error
  return data as Subscription
}

export async function updateSubscription(id: string, updates: Partial<Subscription>) {
  const { data, error } = await supabase.from('subscriptions').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Subscription
}

// ============ BOOKINGS API ============

export async function getBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return data as Booking[]
}

export async function getBookingsByDate(date: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('scheduled_date', date)
    .order('start_time', { ascending: true })
  if (error) throw error
  return data as Booking[]
}

export async function createBooking(booking: Partial<Booking>) {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single()
  if (error) throw error
  return data as Booking
}

export async function updateBooking(id: string, updates: Partial<Booking>) {
  const { data, error } = await supabase.from('bookings').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Booking
}

export async function deleteBooking(id: string) {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

// ============ GYM SETTINGS API ============

export async function getGymSettings() {
  const { data, error } = await supabase.from('gym_settings').select('*').single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateGymSettings(updates: any) {
  // First check if settings exist
  const existing = await getGymSettings()
  if (existing) {
    const { data, error } = await supabase.from('gym_settings').update(updates).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('gym_settings').insert(updates).select().single()
    if (error) throw error
    return data
  }
}

// ============ STATS API ============

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date()
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  const [
    { count: membersCount },
    { count: trainersCount },
    { data: activeSubs },
    { count: todayBookings },
    { count: pendingBookings },
    { count: expiringSubs }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'trainer'),
    supabase.from('subscriptions').select('price_usd').eq('status', 'active'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('scheduled_date', today),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('end_date', weekFromNow.toISOString().split('T')[0])
      .gte('end_date', today)
  ])

  const revenue = activeSubs?.reduce((sum, sub) => sum + (sub.price_usd || 0), 0) || 0

  return {
    totalMembers: membersCount || 0,
    totalTrainers: trainersCount || 0,
    activeSubscriptions: activeSubs?.length || 0,
    monthlyRevenue: revenue,
    todayBookings: todayBookings || 0,
    pendingBookings: pendingBookings || 0,
    expiringSubscriptions: expiringSubs || 0
  }
}
