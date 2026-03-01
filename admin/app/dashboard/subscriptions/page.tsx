'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Loader2, X } from 'lucide-react'
import { CreditCard01, Calendar, CurrencyDollar, RefreshCcw01, Snowflake01, XClose, CheckCircle, XCircle } from '@untitled-ui/icons-react'
import { supabase } from '@/lib/supabase'

type Subscription = {
  id: string
  client_id: string
  subscription_type: string
  start_date: string
  end_date: string
  price_usd?: number
  status: 'active' | 'expired' | 'cancelled' | 'frozen'
  client_name?: string
}

const PLAN_CONFIG: Record<string, { subscriptionType: string; price: number; label: string }> = {
  open_gym: { subscriptionType: 'open_gym', price: 75, label: 'Open Gym' },
  normal_gym: { subscriptionType: 'normal_gym', price: 150, label: 'Normal Gym' },
  with_pt: { subscriptionType: 'with_pt', price: 350, label: 'PT Package' },
  with_dietitian: { subscriptionType: 'with_dietitian', price: 300, label: 'Nutrition Plan' },
  premium: { subscriptionType: 'premium', price: 550, label: 'Premium' },
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function getEffectivePrice(sub: Subscription): number {
  const planKey = Object.keys(PLAN_CONFIG).find(k => PLAN_CONFIG[k].subscriptionType === sub.subscription_type)
  const planPrice = planKey ? PLAN_CONFIG[planKey].price : 0
  return (sub.price_usd != null && sub.price_usd > 0) ? sub.price_usd : planPrice
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [clients, setClients] = useState<{ userId: string; name: string }[]>([])
  const [renewingId, setRenewingId] = useState<string | null>(null)
  const [renewSub, setRenewSub] = useState<Subscription | null>(null)

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
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds)
        profiles?.forEach(p => {
          clientNames[p.id] = p.full_name || 'Unknown'
        })
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
        .select('user_id')

      if (clientProfiles) {
        const userIds = [...new Set(clientProfiles.map(cp => cp.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const clientList = (profiles || []).map(p => ({
          userId: p.id,
          name: p.full_name || 'Unknown'
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

  async function renewSubscription(
    id: string,
    currentEndDate: string,
    amountUsd: number,
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other'
  ) {
    setRenewingId(id)
    try {
      const end = new Date(currentEndDate)
      end.setMonth(end.getMonth() + 1)
      const newEndDate = end.toISOString().split('T')[0]

      await supabase.from('subscriptions').update({
        end_date: newEndDate,
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', id)

      await supabase.from('subscription_payments').insert({
        subscription_id: id,
        amount_usd: amountUsd,
        payment_method: paymentMethod,
        paid_at: new Date().toISOString()
      })

      setRenewSub(null)
      fetchSubscriptions()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to renew')
    } finally {
      setRenewingId(null)
    }
  }

  const filteredSubscriptions = subscriptions.filter(s => {
    const q = searchQuery.trim().toLowerCase()
    const planKey = Object.keys(PLAN_CONFIG).find(k => PLAN_CONFIG[k].subscriptionType === s.subscription_type) || s.subscription_type
    return (!q || s.client_name?.toLowerCase().includes(q)) &&
      (!filterStatus || s.status === filterStatus) &&
      (!filterPlan || s.subscription_type === filterPlan)
  })

  const stats = {
    active: subscriptions.filter(s => s.status === 'active').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
    revenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + getEffectivePrice(s), 0)
  }

  const getPlanLabel = (plan: string) => PLAN_CONFIG[Object.keys(PLAN_CONFIG).find(k => PLAN_CONFIG[k].subscriptionType === plan)!]?.label || plan
  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      open_gym: 'bg-blue-100 text-blue-700',
      normal_gym: 'bg-slate-100 text-slate-700',
      with_pt: 'bg-purple-100 text-purple-700',
      with_dietitian: 'bg-green-100 text-green-700',
      premium: 'bg-amber-100 text-amber-700'
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
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">Subscriptions</h1>
              <p className="text-gray-400">Track renewals and member subscription countdowns</p>
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
                <CurrencyDollar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${stats.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Monthly Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            {Object.entries(PLAN_CONFIG).map(([k, v]) => (
              <option key={k} value={v.subscriptionType}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading subscriptions...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center">
          <CreditCard01 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No subscriptions found</h3>
          <p className="text-gray-500 mb-6">Add members via Members page—subscriptions are created automatically. Or create one manually here.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Create Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => {
            const daysLeft = getDaysRemaining(sub.end_date)
            const isExpiringSoon = sub.status === 'active' && daysLeft <= 5
            const showRenewButton = sub.status === 'active' && daysLeft <= 5 && daysLeft >= 0
            const price = getEffectivePrice(sub)
            return (
              <div key={sub.id} className="flip-card-group h-[280px]">
                <div className="flip-card-inner relative w-full h-full">
                  {/* FRONT - match nutritionist card design */}
                  <div className="flip-card-front absolute inset-0 rounded-xl overflow-hidden strength-card glass-card border border-primary/20 hover:border-primary/40 shadow-glow">
                    <div className="h-20 bg-gradient-to-r from-primary/30 to-accent-red/30 relative border-b border-white/10">
                      <div className="absolute -bottom-10 left-5">
                        <div className="w-14 h-14 rounded-lg glass-card border border-primary/40 p-1 flex items-center justify-center bg-primary/20">
                          <span className="text-primary text-2xl font-bold">{sub.client_name?.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-14 p-5 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/dashboard/members?q=${encodeURIComponent(sub.client_name || '')}`} className="hover:opacity-90">
                          <h3 className="font-bold text-white">{sub.client_name}</h3>
                          <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded text-xs font-medium mt-1 border border-primary/40">
                            {getPlanLabel(sub.subscription_type)}
                          </span>
                        </Link>
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${sub.status === 'active' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/10 text-gray-400 border border-white/10'}`}>
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </div>
                      {sub.status === 'active' && (
                        <div className={`mb-3 p-3 rounded-lg flex-1 flex flex-col justify-center ${isExpiringSoon ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-primary/10 border border-primary/20'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-400">Days remaining</span>
                            <span className={`text-2xl font-bold ${isExpiringSoon ? 'text-amber-400' : 'text-primary'}`}>{daysLeft}</span>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 mt-auto pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-2"><CurrencyDollar className="w-4 h-4" /> Price</span>
                          <span className="font-bold text-white">${price}/mo</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Renews</span>
                          <span className="font-medium text-white">{new Date(sub.end_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* BACK - glass-style buttons matching nutritionist dropdown */}
                  <div className="flip-card-back absolute inset-0 rounded-xl overflow-hidden strength-card glass-card border border-primary/20">
                    <div className="h-12 bg-gradient-to-r from-primary/20 to-accent-red/20 border-b border-white/10" />
                    <div className="p-5 h-full flex flex-col items-center justify-center gap-3 bg-black/30">
                      <p className="text-sm text-gray-400 text-center">{sub.client_name}</p>
                      {sub.status === 'active' && (
                        <>
                          {showRenewButton && (
                            <button onClick={() => setRenewSub(sub)} disabled={renewingId === sub.id} className="w-full px-4 py-2.5 glass-button text-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 border-primary/40">
                              {renewingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw01 className="w-4 h-4" />}
                              Renew +1 month
                            </button>
                          )}
                          <button onClick={() => updateStatus(sub.id, 'frozen')} className="w-full px-4 py-2.5 text-gray-300 hover:bg-white/5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                            <Snowflake01 className="w-4 h-4" /> Freeze
                          </button>
                          <button onClick={() => updateStatus(sub.id, 'cancelled')} className="w-full px-4 py-2.5 text-accent-red-light hover:bg-accent-red/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                            <XClose className="w-4 h-4" /> Cancel
                          </button>
                        </>
                      )}
                      {sub.status === 'frozen' && (
                        <button onClick={() => updateStatus(sub.id, 'active')} className="w-full px-4 py-2.5 glass-button text-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2 border-primary/40">
                          <RefreshCcw01 className="w-4 h-4" /> Reactivate
                        </button>
                      )}
                      {sub.status !== 'active' && sub.status !== 'frozen' && <p className="text-gray-500 text-sm">No actions</p>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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

      {renewSub && (
        <RenewalModal
          sub={renewSub}
          planConfig={PLAN_CONFIG}
          getEffectivePrice={getEffectivePrice}
          onClose={() => setRenewSub(null)}
          onConfirm={(paymentMethod) => {
            renewSubscription(renewSub.id, renewSub.end_date, getEffectivePrice(renewSub), paymentMethod)
          }}
          loading={renewingId === renewSub.id}
        />
      )}
    </div>
  )
}

function RenewalModal({
  sub,
  planConfig,
  getEffectivePrice,
  onClose,
  onConfirm,
  loading
}: {
  sub: Subscription
  planConfig: Record<string, { subscriptionType: string; price: number; label: string }>
  getEffectivePrice: (s: Subscription) => number
  onClose: () => void
  onConfirm: (method: 'cash' | 'card' | 'bank_transfer' | 'other') => void
  loading: boolean
}) {
  const [method, setMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'other'>('cash')
  const planKey = Object.keys(planConfig).find(k => planConfig[k].subscriptionType === sub.subscription_type)
  const cfg = planKey ? planConfig[planKey] : null
  const amount = getEffectivePrice(sub)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/30 to-accent-red/30 p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Renew Subscription</h2>
              <p className="text-white/70 text-sm">{sub.client_name} – {cfg?.label || sub.subscription_type}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
          <div className="p-6 space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <p className="text-sm text-gray-400">Amount due</p>
            <p className="text-2xl font-bold text-primary">${amount}/month</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Payment method</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash' as const, label: 'Cash', icon: '💵' },
                { value: 'card' as const, label: 'Card', icon: '💳' },
                { value: 'bank_transfer' as const, label: 'Bank Transfer', icon: '🏦' },
                { value: 'other' as const, label: 'Other', icon: '📋' }
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    method === m.value ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className={`font-medium ${method === m.value ? 'text-white' : 'text-gray-400'}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Payment is recorded for audit. No card details are stored. Process payment at the gym desk.
          </p>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(method)}
              disabled={loading}
              className="flex-1 px-4 py-3 glass-button text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw01 className="w-4 h-4" />}
              Confirm renewal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubscriptionFormModal({ clients, onClose, onSuccess }: {
  clients: { userId: string; name: string }[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    client_id: '',
    plan: 'open_gym',
    start_date: today,
    end_date: nextMonth
  })

  const planConfig = PLAN_CONFIG[form.plan] || PLAN_CONFIG.open_gym

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('subscriptions').upsert({
        client_id: form.client_id,
        subscription_type: planConfig.subscriptionType,
        start_date: form.start_date,
        end_date: form.end_date,
        price_usd: planConfig.price,
        status: 'active'
      }, { onConflict: 'client_id' })
      if (error) throw error
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Error creating subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/30 to-accent-red/30 p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">New Subscription</h2>
              <p className="text-white/70 text-sm">Link to member & set renewal date</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
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
                <option key={c.userId} value={c.userId}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLAN_CONFIG).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, plan: k })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.plan === k ? 'border-primary bg-primary/5' : 'border-slate-600/50'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{v.label}</p>
                  <p className="text-sm text-gray-500">${v.price}/mo</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End (Renewal)</label>
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
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-600/50 rounded-xl text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 glass-button text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
