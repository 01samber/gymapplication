'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Loader2, 
  Gift,
  Award,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type LoyaltyMember = {
  id: string
  user_id: string
  consecutive_months: number
  total_months: number
  free_pt_months_earned: number
  free_pt_months_used: number
  full_name?: string
}

type LoyaltyReward = {
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
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'members' | 'rewards'>('members')

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  async function fetchLoyaltyData() {
    setLoading(true)
    try {
      // Fetch loyalty tracking
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_tracking')
        .select('*')
        .order('consecutive_months', { ascending: false })

      if (loyaltyError) throw loyaltyError

      // Fetch client profiles and names
      if (loyaltyData && loyaltyData.length > 0) {
        const clientIds = loyaltyData.map(l => l.client_id)
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

          const membersWithNames = loyaltyData.map(l => {
            const cp = clientProfiles.find(c => c.id === l.client_id)
            const profile = profiles?.find(p => p.id === cp?.user_id)
            return {
              ...l,
              user_id: cp?.user_id || '',
              full_name: profile?.full_name || 'Unknown'
            }
          })

          setMembers(membersWithNames)
        }
      } else {
        setMembers([])
      }

      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('created_at', { ascending: false })

      if (rewardsError) throw rewardsError

      if (rewardsData && rewardsData.length > 0) {
        const clientIds = rewardsData.map(r => r.client_id)
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

          const rewardsWithNames = rewardsData.map(r => {
            const cp = clientProfiles.find(c => c.id === r.client_id)
            const profile = profiles?.find(p => p.id === cp?.user_id)
            return {
              ...r,
              client_name: profile?.full_name || 'Unknown'
            }
          })

          setRewards(rewardsWithNames)
        }
      } else {
        setRewards([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function claimReward(id: string) {
    try {
      await supabase
        .from('loyalty_rewards')
        .update({ is_claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', id)
      fetchLoyaltyData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRewards = rewards.filter(r =>
    r.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    totalMembers: members.length,
    totalRewardsEarned: members.reduce((sum, m) => sum + m.free_pt_months_earned, 0),
    pendingRewards: rewards.filter(r => !r.is_claimed).length,
    claimedRewards: rewards.filter(r => r.is_claimed).length
  }

  const getProgressToNextReward = (months: number) => {
    const progress = months % 12
    return (progress / 12) * 100
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - UFC/FIFA theme */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        
        <div className="absolute top-4 right-10 text-primary/20">
          <Star className="w-8 h-8 fill-current" />
        </div>
        <div className="absolute bottom-8 right-20 text-primary/10">
          <Star className="w-6 h-6 fill-current" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
              <Gift className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">Loyalty Program</h1>
              <p className="text-gray-400">12 months = 1 FREE PT month</p>
            </div>
          </div>

          <div className="flex gap-6 mt-8">
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
                <p className="text-xs text-gray-400">Total Rewards Earned</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pendingRewards}</p>
                <p className="text-xs text-gray-400">Pending Claims</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-lg border border-white/10 p-4 shadow-sm">
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
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No loyalty data yet</h3>
            <p className="text-gray-500">Members will be tracked as they maintain subscriptions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="glass-card rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-accent-red" />
                
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-red flex items-center justify-center text-white text-xl font-bold">
                      {member.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{member.full_name}</h3>
                      <p className="text-sm text-gray-500">{member.total_months} total months</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Progress to next reward</span>
                      <span className="font-medium text-amber-600">{member.consecutive_months % 12}/12 months</span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent-red rounded-full transition-all duration-500"
                        style={{ width: `${getProgressToNextReward(member.consecutive_months)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{member.consecutive_months}</p>
                      <p className="text-xs text-amber-700">Consecutive</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{member.free_pt_months_earned}</p>
                      <p className="text-xs text-green-700">Rewards Earned</p>
                    </div>
                  </div>

                  {member.free_pt_months_earned > member.free_pt_months_used && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Gift className="w-5 h-5" />
                        <span className="font-medium">
                          {member.free_pt_months_earned - member.free_pt_months_used} reward(s) available!
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
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No rewards yet</h3>
            <p className="text-gray-500">Rewards will appear when members reach 12 consecutive months</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRewards.map((reward) => (
              <div key={reward.id} className="glass-card rounded-lg shadow-sm hover:shadow-md transition-all p-5">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    reward.is_claimed ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {reward.is_claimed ? (
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    ) : (
                      <Gift className="w-7 h-7 text-amber-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{reward.client_name}</h3>
                    <p className="text-sm text-gray-500">
                      Earned 1 FREE PT month after {reward.months_count} months
                    </p>
                  </div>

                  {/* Date */}
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(reward.created_at).toLocaleDateString()}
                    </div>
                    {reward.claimed_at && (
                      <p className="text-green-600 text-xs mt-1">
                        Claimed {new Date(reward.claimed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  {!reward.is_claimed ? (
                    <button
                      onClick={() => claimReward(reward.id)}
                      className="px-4 py-2 glass-button text-white rounded font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Claimed
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
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
