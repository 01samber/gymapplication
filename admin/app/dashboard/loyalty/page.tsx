'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Loader2, 
  Gift,
  Award,
  CheckCircle,
  User,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type LoyaltyMember = {
  id: string
  client_id: string
  consecutive_months: number
  total_months: number
  free_pt_months_earned: number
  free_pt_months_used: number
  full_name?: string
}

type ClientReward = {
  id: string
  client_id: string
  reward_type: string
  months_count: number
  is_claimed: boolean
  created_at: string
  claimed_at: string | null
  client_name?: string
}

export default function LoyaltyPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [rewards, setRewards] = useState<ClientReward[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'members' | 'rewards'>('members')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  async function fetchLoyaltyData() {
    setLoading(true)
    try {
      // loyalty_tracking.client_id = profiles.id (user id)
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_tracking')
        .select('*')
        .order('consecutive_months', { ascending: false })

      if (loyaltyError) throw loyaltyError

      if (loyaltyData && loyaltyData.length > 0) {
        const clientIds = loyaltyData.map(l => l.client_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds)

        const membersWithNames = loyaltyData.map(l => {
          const profile = profiles?.find(p => p.id === l.client_id)
          return {
            ...l,
            full_name: profile?.full_name || 'Unknown'
          }
        })
        setMembers(membersWithNames)
      } else {
        setMembers([])
      }

      // Client-earned rewards (from client_loyalty_rewards)
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('client_loyalty_rewards')
        .select('*')
        .order('created_at', { ascending: false })

      if (rewardsError) throw rewardsError

      if (rewardsData && rewardsData.length > 0) {
        const clientIds = rewardsData.map(r => r.client_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds)

        const rewardsWithNames = rewardsData.map(r => {
          const profile = profiles?.find(p => p.id === r.client_id)
          return {
            ...r,
            client_name: profile?.full_name || 'Unknown'
          }
        })
        setRewards(rewardsWithNames)
      } else {
        setRewards([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncLoyaltyFromPayments() {
    setSyncing(true)
    try {
      const { data: subs } = await supabase.from('subscriptions').select('id, client_id, start_date, end_date')
      if (!subs?.length) {
        alert('No subscriptions found')
        return
      }

      const { data: payments } = await supabase
        .from('subscription_payments')
        .select('subscription_id, paid_at')
        .order('paid_at', { ascending: true })

      const paymentsBySub = (payments || []).reduce((acc, p) => {
        if (!acc[p.subscription_id]) acc[p.subscription_id] = []
        acc[p.subscription_id].push(p)
        return acc
      }, {} as Record<string, { paid_at: string }[]>)

      for (const sub of subs) {
        const subPayments = paymentsBySub[sub.id] || []
        const paidMonths = subPayments.length
        const lastPayment = subPayments[paidMonths - 1]
        const lastDate = lastPayment?.paid_at?.split('T')[0] ?? sub.end_date ?? null

        const { data: existing } = await supabase
          .from('loyalty_tracking')
          .select('free_pt_months_used')
          .eq('client_id', sub.client_id)
          .single()

        const used = existing?.free_pt_months_used ?? 0
        const earned = Math.floor(paidMonths / 12)
        const consec = paidMonths % 12

        await supabase.from('loyalty_tracking').upsert({
          client_id: sub.client_id,
          consecutive_months: consec,
          total_months: paidMonths,
          last_subscription_date: lastDate,
          current_streak_start: sub.start_date ?? lastDate,
          free_pt_months_earned: earned,
          free_pt_months_used: Math.min(used, earned),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'client_id', ignoreDuplicates: false })
      }

      await fetchLoyaltyData()
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function claimReward(rewardId: string, applyFreeMonth: boolean) {
    try {
      const reward = rewards.find(r => r.id === rewardId)
      if (!reward) return

      if (applyFreeMonth) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, end_date')
          .eq('client_id', reward.client_id)
          .eq('status', 'active')
          .single()

        if (sub) {
          const end = new Date(sub.end_date)
          end.setMonth(end.getMonth() + 1)
          await supabase.from('subscriptions').update({
            end_date: end.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          }).eq('id', sub.id)

          const { data: lt } = await supabase.from('loyalty_tracking').select('free_pt_months_used').eq('client_id', reward.client_id).single()
          await supabase.from('loyalty_tracking').update({
            free_pt_months_used: (lt?.free_pt_months_used ?? 0) + 1,
            updated_at: new Date().toISOString()
          }).eq('client_id', reward.client_id)
        }
      }

      await supabase
        .from('client_loyalty_rewards')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', rewardId)

      fetchLoyaltyData()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to claim reward')
    }
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredMembers = members.filter(m =>
    !q || m.full_name?.toLowerCase().includes(q)
  )
  const filteredRewards = rewards.filter(r =>
    !q || r.client_name?.toLowerCase().includes(q)
  )

  const earned = members.reduce((sum, m) => sum + (m.free_pt_months_earned ?? 0), 0)
  const stats = {
    totalMembers: members.length,
    totalRewardsEarned: earned,
    pendingRewards: rewards.filter(r => !r.is_claimed).length,
    claimedRewards: rewards.filter(r => r.is_claimed).length
  }

  const getProgressToNextReward = (months: number) => {
    const progress = months % 12
    return (progress / 12) * 100
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - matches Subscriptions, Reports, etc */}
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">Loyalty Program</h1>
            <p className="text-gray-400 mt-1">12 months paid = 13th month FREE for all clients</p>
          </div>
          <button
            onClick={syncLoyaltyFromPayments}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-2.5 glass-button text-white rounded-lg font-medium disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Sync from payments
          </button>
        </div>

        <div className="relative z-10 flex gap-6 mt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 glass-subtle rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
              <p className="text-xs text-gray-400">Members Tracked</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 glass-subtle rounded-lg">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalRewardsEarned}</p>
              <p className="text-xs text-gray-400">Free Months Earned</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 glass-subtle rounded-lg">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pendingRewards}</p>
              <p className="text-xs text-gray-400">Pending Claim</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex glass-subtle rounded-xl p-1">
            <button
              onClick={() => setViewMode('members')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'members' ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              Member Progress
            </button>
            <button
              onClick={() => setViewMode('rewards')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'rewards' ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              Rewards History
            </button>
          </div>

          <div className="relative min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading loyalty data...</p>
        </div>
      ) : viewMode === 'members' ? (
        filteredMembers.length === 0 ? (
          <div className="glass-card rounded-lg p-16 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No loyalty data yet</h3>
            <p className="text-gray-500 mb-4">Sync from payments or add renewals via Subscriptions. Each paid month counts toward the 12-month reward.</p>
            <button
              onClick={syncLoyaltyFromPayments}
              disabled={syncing}
              className="px-5 py-2.5 glass-button text-white rounded-lg font-medium"
            >
              Sync from payments
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="glass-card rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-primary/20">
                <div className="h-2 bg-gradient-to-r from-primary to-accent-red" />
                
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent-red/30 flex items-center justify-center text-white text-xl font-bold border border-primary/40">
                      {member.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{member.full_name}</h3>
                      <p className="text-sm text-gray-500">{member.total_months ?? 0} total months</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Progress to next reward</span>
                      <span className="font-medium text-primary">{(member.consecutive_months ?? 0) % 12}/12 months</span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent-red rounded-full transition-all duration-500"
                        style={{ width: `${getProgressToNextReward(member.consecutive_months ?? 0)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-subtle rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{member.consecutive_months ?? 0}</p>
                      <p className="text-xs text-gray-400">Consecutive</p>
                    </div>
                    <div className="glass-subtle rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-white">{member.free_pt_months_earned ?? 0}</p>
                      <p className="text-xs text-gray-400">Earned</p>
                    </div>
                  </div>

                  {(member.free_pt_months_earned ?? 0) > (member.free_pt_months_used ?? 0) && (
                    <div className="mt-4 p-3 glass-subtle rounded-xl border border-primary/30">
                      <div className="flex items-center gap-2 text-primary">
                        <Gift className="w-5 h-5" />
                        <span className="font-medium">
                          {(member.free_pt_months_earned ?? 0) - (member.free_pt_months_used ?? 0)} reward(s) available
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredRewards.length === 0 ? (
          <div className="glass-card rounded-lg p-16 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No rewards yet</h3>
            <p className="text-gray-500">Rewards appear when clients reach 12 consecutive paid months (renew via Subscriptions)</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRewards.map((reward) => (
              <div key={reward.id} className="glass-card rounded-lg shadow-sm hover:shadow-md transition-all p-5 border border-primary/20">
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center glass-subtle ${
                    reward.is_claimed ? 'text-primary' : 'text-primary'
                  }`}>
                    {reward.is_claimed ? (
                      <CheckCircle className="w-7 h-7" />
                    ) : (
                      <Gift className="w-7 h-7" />
                    )}
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-bold text-white">{reward.client_name}</h3>
                    <p className="text-sm text-gray-500">
                      Earned 1 FREE month after {reward.months_count} paid months
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(reward.created_at).toLocaleDateString()}
                  </div>
                  {reward.claimed_at && (
                    <p className="text-primary text-xs">
                      Claimed {new Date(reward.claimed_at).toLocaleDateString()}
                    </p>
                  )}

                  {!reward.is_claimed ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => claimReward(reward.id, true)}
                        className="px-4 py-2 glass-button text-white rounded-lg font-medium flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Apply free month
                      </button>
                      <button
                        onClick={() => claimReward(reward.id, false)}
                        className="px-4 py-2 glass-subtle rounded-lg font-medium text-gray-400 hover:text-white"
                      >
                        Mark claimed
                      </button>
                    </div>
                  ) : (
                    <span className="px-4 py-2 glass-subtle text-primary rounded-xl text-sm font-medium">
                      Claimed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
