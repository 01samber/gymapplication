'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Plus, 
  Loader2, 
  X, 
  Calendar,
  Clock,
  User,
  UserCog,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Booking = {
  id: string
  client_id: string
  trainer_id: string
  date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  client_name?: string
  trainer_name?: string
}

export default function BookingsPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [trainers, setTrainers] = useState<{ id: string; name: string; trainer_profile_id: string }[]>([])

  useEffect(() => {
    fetchBookings()
    fetchUsersForDropdowns()
  }, [selectedDate])

  async function fetchBookings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', selectedDate)
        .order('start_time')

      if (error) throw error

      // Fetch names for clients and trainers
      const clientIds = Array.from(new Set(data?.map(b => b.client_id) || []))
      const trainerIds = Array.from(new Set(data?.map(b => b.trainer_id) || []))

      let clientNames: Record<string, string> = {}
      let trainerNames: Record<string, string> = {}

      if (clientIds.length > 0) {
        const { data: clientProfiles } = await supabase
          .from('client_profiles')
          .select('id, user_id')
          .in('id', clientIds)

        if (clientProfiles) {
          const userIds = clientProfiles.map(cp => cp.user_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          clientProfiles.forEach(cp => {
            const profile = profiles?.find(p => p.id === cp.user_id)
            clientNames[cp.id] = profile?.full_name || 'Unknown'
          })
        }
      }

      if (trainerIds.length > 0) {
        const { data: trainerProfiles } = await supabase
          .from('trainer_profiles')
          .select('id, user_id')
          .in('id', trainerIds)

        if (trainerProfiles) {
          const userIds = trainerProfiles.map(tp => tp.user_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          trainerProfiles.forEach(tp => {
            const profile = profiles?.find(p => p.id === tp.user_id)
            trainerNames[tp.id] = profile?.full_name || 'Unknown'
          })
        }
      }

      const bookingsWithNames = (data || []).map(b => ({
        ...b,
        client_name: clientNames[b.client_id] || 'Unknown',
        trainer_name: trainerNames[b.trainer_id] || 'Unknown'
      }))

      setBookings(bookingsWithNames)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsersForDropdowns() {
    try {
      // Fetch clients
      const { data: clientProfiles } = await supabase
        .from('client_profiles')
        .select('id, user_id')

      if (clientProfiles) {
        const userIds = clientProfiles.map(cp => cp.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const clientList = clientProfiles.map(cp => ({
          id: cp.id,
          name: profiles?.find(p => p.id === cp.user_id)?.full_name || 'Unknown'
        }))
        setClients(clientList)
      }

      // Fetch trainers
      const { data: trainerProfiles } = await supabase
        .from('trainer_profiles')
        .select('id, user_id')

      if (trainerProfiles) {
        const userIds = trainerProfiles.map(tp => tp.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const trainerList = trainerProfiles.map(tp => ({
          id: tp.user_id,
          name: profiles?.find(p => p.id === tp.user_id)?.full_name || 'Unknown',
          trainer_profile_id: tp.id
        }))
        setTrainers(trainerList)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await supabase.from('bookings').update({ status }).eq('id', id)
      fetchBookings()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const navigateDate = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const filteredBookings = bookings.filter(b => !filterStatus || b.status === filterStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-primary/20 text-primary border-primary/40'
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'cancelled': return 'bg-accent-red/20 text-accent-red-light border-accent-red/40'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - UFC/FIFA theme */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Bookings</h1>
                <p className="text-gray-400">Manage training sessions</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded font-semibold hover:bg-primary-light transition-colors border border-primary/50"
            >
              <Plus className="w-5 h-5" />
              New Booking
            </button>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
                <p className="text-xs text-gray-500">Confirmed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="glass-card rounded-lg p-4 border border-white/10">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-3 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-6 py-3 glass-input border border-slate-600/50 rounded">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-lg font-semibold text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="p-3 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
            >
              Today
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 glass-input border border-slate-600/50 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center border border-white/10">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center border border-white/10">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No bookings for this date</h3>
          <p className="text-gray-500 mb-6">Schedule a training session</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-white rounded font-medium hover:bg-primary-light transition-colors border border-primary/50"
          >
            Create Booking
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="glass-card rounded-lg border border-white/10 hover:border-primary/30 transition-all p-5 card-hover">
              <div className="flex items-center gap-4">
                {/* Time */}
                <div className="w-28 text-center">
                  <p className="text-2xl font-bold text-white">{booking.start_time.slice(0, 5)}</p>
                  <p className="text-sm text-gray-500">to {booking.end_time.slice(0, 5)}</p>
                </div>

                <div className="w-px h-16 bg-slate-600" />

                {/* Client & Trainer */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-semibold text-white">{booking.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-accent-red/20 border border-accent-red/40 flex items-center justify-center">
                      <UserCog className="w-5 h-5 text-accent-red-light" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trainer</p>
                      <p className="font-semibold text-white">{booking.trainer_name}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded border ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span className="font-medium capitalize">{booking.status}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        className="p-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
                        title="Confirm"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        className="p-2 bg-accent-red/20 text-accent-red-light rounded hover:bg-accent-red/30 transition-colors"
                        title="Cancel"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'completed')}
                      className="px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-sm font-medium"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-sm text-gray-500">{booking.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <BookingFormModal
          clients={clients}
          trainers={trainers}
          selectedDate={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}

function BookingFormModal({ clients, trainers, selectedDate, onClose, onSuccess }: {
  clients: { id: string; name: string }[]
  trainers: { id: string; name: string; trainer_profile_id: string }[]
  selectedDate: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    trainer_id: '',
    date: selectedDate,
    start_time: '09:00',
    end_time: '10:00',
    notes: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const trainer = trainers.find(t => t.id === form.trainer_id)
      
      await supabase.from('bookings').insert({
        client_id: form.client_id,
        trainer_id: trainer?.trainer_profile_id || form.trainer_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        notes: form.notes || null,
        status: 'pending'
      })

      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-lg border border-white/10 w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/30 to-accent-red/30 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 border border-primary/40 rounded">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">New Booking</h2>
                <p className="text-gray-400 text-sm">Schedule a training session</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trainer</label>
            <select
              value={form.trainer_id}
              onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select trainer</option>
              {trainers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-600 rounded text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-primary/50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
