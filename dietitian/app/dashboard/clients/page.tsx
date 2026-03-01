'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Users01, 
  SearchMd, 
  Activity,
  Receipt,
  ChevronRight,
  UserPlus01,
  XClose
} from '@untitled-ui/icons-react'
import { Loader2, Eye } from 'lucide-react'
import FlipCard from '@/components/FlipCard'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge } from '@/lib/utils'

interface ClientWithSummary {
  id: string
  client: any
  summary?: any
}

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<ClientWithSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
  }, [searchParams])

  const loadClients = useCallback(async () => {
    try {
      setLoading(true)
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
      } else {
        setClients([])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

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
  }, [loadClients])

  const q = searchQuery.trim().toLowerCase()
  const filteredClients = clients.filter(c => 
    !q ||
    c.client?.full_name?.toLowerCase().includes(q) ||
    c.client?.email?.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-6">
      {/* Header - book cover style */}
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 glass-subtle rounded-2xl border border-primary/30">
              <Users01 className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white tracking-wide">My Clients</h1>
              <p className="text-gray-400">Manage assigned gym clients and add new clients not in the gym</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 glass-button rounded-xl font-medium text-white"
          >
            <UserPlus01 className="w-5 h-5" />
            Add New Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchMd className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients by name or email..."
          className="w-full pl-12 pr-4 py-3 glass-input rounded-xl"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center">
          <Users01 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No clients found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery ? 'Try a different search term' : 'Add a new client or wait for admin to assign gym clients'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 glass-button text-white rounded-xl font-medium"
            >
              Add New Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(({ id, client, summary }) => (
            <FlipCard
              key={id}
              front={
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border border-primary/30">
                      {client?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink">{client?.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-ink-muted">{client?.email}</p>
                      {client?.date_of_birth && (
                        <p className="text-xs text-ink-muted mt-1">
                          {calculateAge(client.date_of_birth)} years • {client?.gender || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-amber-900/10">
                    <div className="text-center">
                      <Activity className="w-5 h-5 text-primary mx-auto" />
                      <p className="text-sm font-semibold text-ink mt-1">{summary?.latestBodyComposition?.weight_kg?.toFixed(1) || '--'}</p>
                      <p className="text-xs text-ink-muted">kg</p>
                    </div>
                    <div className="text-center">
                      <Receipt className="w-5 h-5 text-primary mx-auto" />
                      <p className="text-sm font-semibold text-ink mt-1">{summary?.activeDietPlan ? 'Yes' : 'No'}</p>
                      <p className="text-xs text-ink-muted">Plan</p>
                    </div>
                    <div className="text-center">
                      <Activity className="w-5 h-5 text-primary mx-auto" />
                      <p className="text-sm font-semibold text-ink mt-1">{summary?.weeklyCompliance || 0}%</p>
                      <p className="text-xs text-ink-muted">Compliance</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted mt-3 text-center">Hover to flip →</p>
                </>
              }
              back={
                <div className="flex flex-col gap-3 h-full justify-center">
                  <Link
                    href={`/dashboard/clients/${client?.id}`}
                    className="w-full py-2.5 px-3 bg-primary text-amber-50 text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </Link>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/body-analysis?client=${client?.id}`}
                      className="flex-1 py-2 px-3 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors text-center border border-primary/20"
                    >
                      Body
                    </Link>
                    <Link
                      href={`/dashboard/diet-plans?client=${client?.id}`}
                      className="flex-1 py-2 px-3 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors text-center border border-primary/20"
                    >
                      Diet
                    </Link>
                  </div>
                </div>
              }
              className="card-hover rounded-xl"
            />
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
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-paper-light rounded-2xl border border-amber-900/20 w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col paper-stack">
        <div className="p-6 border-b border-amber-900/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Add New Client</h2>
            <button onClick={onClose} className="p-2 hover:bg-amber-900/10 rounded text-ink-muted hover:text-ink">
              <XClose className="w-5 h-5" />
            </button>
          </div>
          <p className="text-ink-muted text-sm mt-1">For clients not in the gym (private nutrition)</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {error && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">{error}</div>
            )}

            {tempPassword ? (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-3">
                <p className="text-sm font-medium text-primary">Client added successfully!</p>
                <p className="text-ink text-sm">
                  Share this temporary password: <code className="bg-amber-900/10 px-2 py-1 rounded font-mono text-primary break-all">{tempPassword}</code>
                </p>
                <p className="text-ink-muted text-xs">They must change it on first login.</p>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="w-full px-4 py-2 bg-primary text-amber-50 rounded font-medium hover:bg-primary-dark transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border border-amber-900/15 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border border-amber-900/15 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border border-amber-900/15 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border border-amber-900/15 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 [&::-webkit-calendar-picker-indicator]:opacity-70"
                  />
                </div>
                <div className="flex gap-3 pt-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-amber-900/20 rounded-xl text-ink-muted hover:bg-amber-900/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-primary text-amber-50 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
