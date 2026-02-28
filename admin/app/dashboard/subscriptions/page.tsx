'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Plus, 
  Loader2, 
  X, 
  CreditCard,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Subscription = {
  id: string
  client_id: string
  plan_type: 'open_gym' | 'pt_basic' | 'pt_premium'
  start_date: string
  end_date: string
  price: number
  status: 'active' | 'expired' | 'cancelled' | 'frozen'
  client_name?: string
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchSubscriptions()
    fetchClients()
  }, [])

  async function fetchSubscriptions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientIds = Array.from(new Set(data?.map(s => s.client_id) || []))
      let clientNames: Record<string, string> = {}

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

      const subscriptionsWithNames = (data || []).map(s => ({
        ...s,
        client_name: clientNames[s.client_id] || 'Unknown'
      }))

      setSubscriptions(subscriptionsWithNames)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchClients() {
    try {
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
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await supabase.from('subscriptions').update({ status }).eq('id', id)
      fetchSubscriptions()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredSubscriptions = subscriptions.filter(s => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || s.client_name?.toLowerCase().includes(q)
    const matchesStatus = !filterStatus || s.status === filterStatus
    const matchesPlan = !filterPlan || s.plan_type === filterPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  const stats = {
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    revenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.price, 0)
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      open_gym: 'Open Gym',
      pt_basic: 'PT Basic',
      pt_premium: 'PT Premium'
    }
    return labels[plan] || plan
  }

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      open_gym: 'bg-blue-100 text-blue-700',
      pt_basic: 'bg-purple-100 text-purple-700',
      pt_premium: 'bg-amber-100 text-amber-700'
    }
    return colors[plan] || 'bg-gray-100 text-gray-700'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200',
      expired: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border-slate-600/50',
      frozen: 'bg-blue-100 text-blue-700 border-blue-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
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
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Subscriptions</h1>
                <p className="text-gray-400">Manage member subscriptions</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 glass-button text-white rounded font-semibold"
            >
              <Plus className="w-5 h-5" />
              New Subscription
            </button>
          </div>

          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <XCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.expired}</p>
                <p className="text-xs text-gray-400">Expired</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${stats.revenue}</p>
                <p className="text-xs text-gray-400">Monthly Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="frozen">Frozen</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Plans</option>
            <option value="open_gym">Open Gym</option>
            <option value="pt_basic">PT Basic</option>
            <option value="pt_premium">PT Premium</option>
          </select>
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading subscriptions...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No subscriptions found</h3>
          <p className="text-gray-500 mb-6">Create a new subscription for members</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Create Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => (
            <div key={sub.id} className="glass-card rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className={`h-2 ${sub.status === 'active' ? 'bg-green-500' : sub.status === 'expired' ? 'bg-red-500' : sub.status === 'frozen' ? 'bg-blue-500' : 'bg-gray-400'}`} />
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/30 border border-primary/40 flex items-center justify-center text-primary font-bold text-lg">
                      {sub.client_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{sub.client_name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(sub.plan_type)}`}>
                        {getPlanLabel(sub.plan_type)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Price
                    </span>
                    <span className="font-bold text-gray-900">${sub.price}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Start
                    </span>
                    <span className="font-medium">{new Date(sub.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> End
                    </span>
                    <span className="font-medium">{new Date(sub.end_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {sub.status === 'active' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => updateStatus(sub.id, 'frozen')}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Freeze
                    </button>
                    <button
                      onClick={() => updateStatus(sub.id, 'cancelled')}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {sub.status === 'frozen' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => updateStatus(sub.id, 'active')}
                      className="w-full px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" /> Reactivate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <SubscriptionFormModal
          clients={clients}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchSubscriptions()
          }}
        />
      )}
    </div>
  )
}

function SubscriptionFormModal({ clients, onClose, onSuccess }: {
  clients: { id: string; name: string }[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    client_id: '',
    plan_type: 'open_gym',
    start_date: today,
    end_date: nextMonth,
    price: 75
  })

  const handlePlanChange = (plan: string) => {
    const prices: Record<string, number> = {
      open_gym: 75,
      pt_basic: 150,
      pt_premium: 200
    }
    setForm({ ...form, plan_type: plan, price: prices[plan] || 75 })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await supabase.from('subscriptions').insert({
        client_id: form.client_id,
        plan_type: form.plan_type,
        start_date: form.start_date,
        end_date: form.end_date,
        price: form.price,
        status: 'active'
      })

      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/30 to-accent-red/30 p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">New Subscription</h2>
                <p className="text-white/70 text-sm">Create a member subscription</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">Select member</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'open_gym', label: 'Open Gym', price: '$75' },
                { value: 'pt_basic', label: 'PT Basic', price: '$150' },
                { value: 'pt_premium', label: 'PT Premium', price: '$200' }
              ].map((plan) => (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => handlePlanChange(plan.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    form.plan_type === plan.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-600/50 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{plan.label}</p>
                  <p className="text-sm text-gray-500">{plan.price}/mo</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-600/50 rounded-xl text-gray-700 hover:glass-input transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 glass-button text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
