'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Search, 
  Activity,
  Utensils,
  TrendingUp,
  ChevronRight,
  Loader2,
  Eye,
  UserPlus,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge } from '@/lib/utils'

interface ClientWithSummary {
  id: string
  client: any
  summary?: any
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadClients() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: assignments, error } = await supabase
          .from('client_dietitian_assignments')
          .select(`
            id,
            assigned_at,
            notes,
            client:client_id(
              id,
              email,
              full_name,
              phone,
              gender,
              date_of_birth
            )
          `)
          .eq('dietitian_id', user.id)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching clients:', error)
          setLoading(false)
          return
        }

        // Show all assigned clients: gym clients (Nutrition/Premium) + dietitian-added clients (no subscription)
        if (assignments && assignments.length > 0) {
          const validAssignments = assignments.filter((a: any) => a.client?.id)
          const clientsWithSummaries = await Promise.all(
            validAssignments.map(async (assignment: any) => {
              // Get latest body composition
              const { data: latestBody } = await supabase
                .from('body_compositions')
                .select('weight_kg, bmi')
                .eq('client_id', assignment.client?.id)
                .order('measurement_date', { ascending: false })
                .limit(1)
                .single()

              // Get active diet plan
              const { data: activePlan } = await supabase
                .from('diet_plans')
                .select('id, name, status')
                .eq('client_id', assignment.client?.id)
                .eq('status', 'active')
                .limit(1)
                .single()

              return {
                id: assignment.id,
                client: assignment.client,
                summary: {
                  latestBodyComposition: latestBody,
                  activeDietPlan: activePlan,
                  weeklyCompliance: 0
                }
              }
            })
          )
          setClients(clientsWithSummaries)
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClients().then(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase
        .channel('dietitian_assignments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_dietitian_assignments',
          filter: `dietitian_id=eq.${user.id}`,
        }, () => {
          loadClients()
        })
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const filteredClients = clients.filter(c => 
    c.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header - glassy like admin */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Clients</h1>
              <p className="text-white/80">Manage assigned gym clients and add new clients not in the gym</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-white transition-colors border border-white/20"
          >
            <UserPlus className="w-5 h-5" />
            Add New Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients by name or email..."
          className="w-full pl-12 pr-4 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No clients found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery ? 'Try a different search term' : 'Add a new client or wait for admin to assign gym clients'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors"
            >
              Add New Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(({ id, client, summary }) => (
            <div 
              key={id}
              className="glass-card rounded-2xl overflow-hidden card-hover"
            >
              {/* Client Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white text-xl font-bold">
                    {client?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{client?.full_name || 'Unknown'}</h3>
                    <p className="text-sm text-slate-400">{client?.email}</p>
                    {client?.date_of_birth && (
                      <p className="text-xs text-slate-500 mt-1">
                        {calculateAge(client.date_of_birth)} years old • {client?.gender || 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 grid grid-cols-3 gap-4 border-b border-white/10">
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-lg bg-blue-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">
                    {summary?.latestBodyComposition?.weight_kg?.toFixed(1) || '--'}
                  </p>
                  <p className="text-xs text-slate-400">Weight (kg)</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-lg bg-green-500/20">
                    <Utensils className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">
                    {summary?.activeDietPlan ? 'Active' : 'None'}
                  </p>
                  <p className="text-xs text-slate-400">Diet Plan</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto rounded-lg bg-purple-500/20">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">
                    {summary?.weeklyCompliance || 0}%
                  </p>
                  <p className="text-xs text-slate-400">Compliance</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 space-y-2">
                <Link
                  href={`/dashboard/clients/${client?.id}`}
                  className="w-full py-2.5 px-3 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Full Profile
                </Link>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/body-analysis?client=${client?.id}`}
                    className="flex-1 py-2 px-3 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/30 transition-colors text-center border border-blue-500/30"
                  >
                    Body Analysis
                  </Link>
                  <Link
                    href={`/dashboard/diet-plans?client=${client?.id}`}
                    className="flex-1 py-2 px-3 bg-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-colors text-center border border-green-500/30"
                  >
                    Diet Plan
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadClients()
          }}
        />
      )}
    </div>
  )
}

function AddClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTempPassword(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Please sign in again')
      }
      const res = await fetch('/api/add-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          date_of_birth: form.date_of_birth || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add client')
      setTempPassword(data.tempPassword)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-white/20 w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Add New Client</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">For clients not in the gym (private nutrition)</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>
            )}

            {tempPassword ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3">
                <p className="text-sm font-medium text-green-400">Client added successfully!</p>
                <p className="text-gray-300 text-sm">
                  Share this temporary password: <code className="bg-black/30 px-2 py-1 rounded font-mono text-green-400 break-all">{tempPassword}</code>
                </p>
                <p className="text-gray-500 text-xs">They must change it on first login.</p>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 [&::-webkit-calendar-picker-indicator]:opacity-70"
                  />
                </div>
                <div className="flex gap-3 pt-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-slate-600 rounded-xl text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Client
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
