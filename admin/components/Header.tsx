'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, ChevronDown, UserPlus, Users, Calendar, X, Loader2, LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const router = useRouter()
  const [headerSearch, setHeaderSearch] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddTrainer, setShowAddTrainer] = useState(false)
  const [showAddBooking, setShowAddBooking] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    loadUserName()
  }, [])

  const loadUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
      if (profile) setUserName(profile.full_name)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      <header className="h-16 glass-subtle border-b border-white/10 flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members, trainers, bookings..."
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && headerSearch.trim()) {
                  router.push(`/dashboard/members?q=${encodeURIComponent(headerSearch.trim())}`)
                }
              }}
              className="w-full pl-10 pr-4 py-2 glass-input rounded text-sm text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Date display */}
          <div className="text-sm text-gray-400 hidden md:block">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded glass-button">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          {/* Quick actions */}
          <div className="relative">
            <button 
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center gap-2 px-4 py-2 glass-button text-white rounded text-sm font-medium"
            >
              Quick Add
              <ChevronDown className={`w-4 h-4 transition-transform ${showQuickAdd ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showQuickAdd && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded shadow-xl py-2 z-50">
                <button 
                  onClick={() => { setShowAddMember(true); setShowQuickAdd(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3"
                >
                  <UserPlus className="w-4 h-4 text-primary" />
                  Add Member
                </button>
                <button 
                  onClick={() => { setShowAddTrainer(true); setShowQuickAdd(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3"
                >
                  <Users className="w-4 h-4 text-primary" />
                  Add Trainer
                </button>
                <button 
                  onClick={() => { setShowAddBooking(true); setShowQuickAdd(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3"
                >
                  <Calendar className="w-4 h-4 text-primary" />
                  New Booking
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded glass-button"
            >
              <div className="w-8 h-8 glass-subtle rounded flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-white">{userName}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card rounded shadow-xl py-2 z-50">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Add Modals */}
      {showAddMember && <QuickAddMemberModal onClose={() => setShowAddMember(false)} />}
      {showAddTrainer && <QuickAddTrainerModal onClose={() => setShowAddTrainer(false)} />}
      {showAddBooking && <QuickAddBookingModal onClose={() => setShowAddBooking(false)} />}

      {/* Click outside to close dropdown */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-40" onClick={() => setShowQuickAdd(false)} />
      )}
    </>
  )
}

function QuickAddMemberModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    plan: 'open_gym',
    fitness_goal: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const memberId = crypto.randomUUID()

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: memberId,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: 'client',
        })

      if (profileError) throw profileError

      // Create client_profile entry (required for members page to work)
      const { error: clientProfileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: memberId,
          fitness_goal: formData.fitness_goal || null,
        })

      if (clientProfileError) throw clientProfileError

      // Create subscription
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const { error: subError } = await supabase.from('subscriptions').insert({
        client_id: memberId,
        type: formData.plan,
        status: 'active',
        price_usd: formData.plan === 'with_pt' ? 200 : 75,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        pt_sessions_included: formData.plan === 'with_pt' ? 12 : 0,
        pt_sessions_used: 0,
      })

      if (subError) throw subError

      // Create loyalty tracking entry
      await supabase.from('loyalty_tracking').insert({
        client_id: memberId,
        consecutive_months: 1,
        total_months: 1,
        last_subscription_date: startDate.toISOString().split('T')[0],
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error('Error adding member:', err)
      setError(err.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">Quick Add Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-white">Member Added!</p>
            <p className="text-gray-500 mt-1">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subscription Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData(p => ({ ...p, plan: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              >
                <option value="open_gym">Open Gym - $75/month</option>
                <option value="with_pt">PT Package - $200/month</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fitness Goal</label>
              <select
                value={formData.fitness_goal}
                onChange={(e) => setFormData(p => ({ ...p, fitness_goal: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              >
                <option value="">Select a goal (optional)</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="general_fitness">General Fitness</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-600 rounded hover:bg-slate-700/50 text-gray-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Member
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function QuickAddTrainerModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    hourly_rate: 50,
    specializations: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const trainerId = crypto.randomUUID()

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: trainerId,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: 'trainer',
        })

      if (profileError) throw profileError

      const specs = formData.specializations.split(',').map(s => s.trim()).filter(Boolean)

      await supabase.from('trainer_profiles').insert({
        user_id: trainerId,
        specializations: specs,
        hourly_rate: formData.hourly_rate,
        is_active: true,
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to add trainer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">Quick Add Trainer</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-white">Trainer Added!</p>
            <p className="text-gray-500 mt-1">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(p => ({ ...p, hourly_rate: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Specializations</label>
              <input
                type="text"
                placeholder="Strength, HIIT, Cardio"
                value={formData.specializations}
                onChange={(e) => setFormData(p => ({ ...p, specializations: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-600 rounded hover:bg-slate-700/50 text-gray-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Trainer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function QuickAddBookingModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [trainers, setTrainers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    trainer_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    session_type: 'Strength Training',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: clientsData }, { data: trainersData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('role', 'client').order('full_name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'trainer').order('full_name')
    ])
    setClients(clientsData || [])
    setTrainers(trainersData || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.client_id || !formData.trainer_id) {
      setError('Please select both client and trainer')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get the trainer_profile id for the selected trainer
      const { data: trainerProfile } = await supabase
        .from('trainer_profiles')
        .select('id')
        .eq('user_id', formData.trainer_id)
        .single()

      if (!trainerProfile) {
        throw new Error('Trainer profile not found. Please ensure the trainer has a profile.')
      }

      const { error: bookingError } = await supabase.from('bookings').insert({
        client_id: formData.client_id,
        trainer_id: trainerProfile.id,  // Use trainer_profiles.id, not profiles.id
        scheduled_date: formData.scheduled_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        session_type: formData.session_type,
        status: 'confirmed',
      })

      if (bookingError) throw bookingError

      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">Quick Add Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-white">Booking Created!</p>
            <p className="text-gray-500 mt-1">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Client *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData(p => ({ ...p, client_id: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Trainer *</label>
              <select
                required
                value={formData.trainer_id}
                onChange={(e) => setFormData(p => ({ ...p, trainer_id: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              >
                <option value="">Select trainer...</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData(p => ({ ...p, scheduled_date: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                  className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(p => ({ ...p, end_time: e.target.value }))}
                  className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Session Type</label>
              <select
                value={formData.session_type}
                onChange={(e) => setFormData(p => ({ ...p, session_type: e.target.value }))}
                className="w-full px-4 py-2 glass-input rounded text-white focus:outline-none"
              >
                <option>Strength Training</option>
                <option>Cardio</option>
                <option>HIIT</option>
                <option>Full Body</option>
                <option>Assessment</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-600 rounded hover:bg-slate-700/50 text-gray-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
