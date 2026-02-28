'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Search, 
  Plus, 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  Users,
  UserPlus,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Target,
  Activity,
  Award,
  ChevronDown,
  UserCheck,
  Salad,
  BadgeCheck
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Member = {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  fitness_goal: string | null
  created_at: string
  avatar_url?: string
  date_of_birth?: string
  subscription_plan?: string
  subscription_status?: string
  assigned_trainer_name?: string
  assigned_trainer_id?: string
  assigned_dietitian_name?: string
  assigned_dietitian_id?: string
}

export default function MembersPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [filterGoal, setFilterGoal] = useState('')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
  }, [searchParams])

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    setLoading(true)
    try {
      const { data: clientProfiles, error: clientError } = await supabase
        .from('client_profiles')
        .select('id, user_id, fitness_goal, assigned_trainer_id, assigned_dietitian_id, created_at')
        .order('created_at', { ascending: false })

      if (clientError) throw clientError

      if (clientProfiles && clientProfiles.length > 0) {
        const userIds = clientProfiles.map(cp => cp.user_id)
        const trainerIds = [...new Set(clientProfiles.map(cp => cp.assigned_trainer_id).filter(Boolean))] as string[]
        const dietitianIds = [...new Set(clientProfiles.map(cp => cp.assigned_dietitian_id).filter(Boolean))] as string[]

        const [profilesRes, subsRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email, phone, avatar_url, date_of_birth').in('id', userIds),
          supabase.from('subscriptions').select('client_id, subscription_type, status').in('client_id', userIds),
        ])
        const allStaffIds = [...new Set([...trainerIds, ...dietitianIds])]
        const { data: staffProfiles } = allStaffIds.length > 0
          ? await supabase.from('profiles').select('id, full_name').in('id', allStaffIds)
          : { data: null }

        const profiles = profilesRes.data
        const subs = subsRes.data || []
        const staffMap = Object.fromEntries((staffProfiles || []).map((s: any) => [s.id, s.full_name]))
        const subMap = Object.fromEntries(subs.map((s: any) => [s.client_id, s]))

        const memberData = clientProfiles.map(cp => {
          const profile = profiles?.find((p: any) => p.id === cp.user_id)
          const sub = subMap[cp.user_id]
          return {
            id: cp.id,
            user_id: cp.user_id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            phone: profile?.phone || '',
            fitness_goal: cp.fitness_goal,
            created_at: cp.created_at,
            avatar_url: profile?.avatar_url,
            date_of_birth: profile?.date_of_birth,
            subscription_plan: sub?.subscription_type,
            subscription_status: sub?.status,
            assigned_trainer_name: cp.assigned_trainer_id ? staffMap[cp.assigned_trainer_id] : undefined,
            assigned_trainer_id: cp.assigned_trainer_id || undefined,
            assigned_dietitian_name: cp.assigned_dietitian_id ? staffMap[cp.assigned_dietitian_id] : undefined,
            assigned_dietitian_id: cp.assigned_dietitian_id || undefined,
          }
        })
        setMembers(memberData)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, userId: string) {
    if (!confirm('Are you sure you want to delete this member? This will also remove their login account.')) return
    try {
      const res = await fetch('/api/delete-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      fetchMembers()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete member')
    }
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredMembers = members.filter(m => {
    const matchesSearch = !q ||
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    const matchesGoal = !filterGoal || m.fitness_goal === filterGoal
    return matchesSearch && matchesGoal
  })

  const fitnessGoals = ['weight_loss', 'muscle_gain', 'general_fitness', 'strength', 'endurance']

  const getGoalLabel = (goal: string | null) => {
    const labels: Record<string, string> = {
      weight_loss: 'Weight Loss',
      muscle_gain: 'Muscle Gain',
      general_fitness: 'General Fitness',
      strength: 'Strength',
      endurance: 'Endurance'
    }
    return goal ? labels[goal] || goal : 'Not Set'
  }

  const getGoalColor = (goal: string | null) => {
    const colors: Record<string, string> = {
      weight_loss: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      muscle_gain: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      general_fitness: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      strength: 'bg-accent-red/20 text-accent-red-light border border-accent-red/40',
      endurance: 'bg-primary/20 text-primary border border-primary/40'
    }
    return goal ? colors[goal] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
  }

  const getPlanLabel = (plan: string | undefined) => {
    const labels: Record<string, string> = {
      normal_gym: 'Normal Gym',
      with_pt: 'PT Package',
      with_dietitian: 'Nutrition Plan',
      premium: 'Premium',
      open_gym: 'Open Gym'
    }
    return plan ? labels[plan] || plan : '—'
  }

  const getPlanColor = (plan: string | undefined) => {
    const colors: Record<string, string> = {
      normal_gym: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
      with_pt: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      with_dietitian: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      premium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      open_gym: 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    }
    return plan ? colors[plan] || 'bg-slate-500/20 text-slate-400' : 'bg-slate-500/20 text-slate-400'
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
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Members</h1>
                <p className="text-gray-400">Manage your gym members</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 glass-button text-white rounded font-semibold"
            >
              <UserPlus className="w-5 h-5" />
              Add Member
            </button>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{members.length}</p>
                <p className="text-xs text-gray-500">Total Members</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{members.filter(m => m.fitness_goal).length}</p>
                <p className="text-xs text-gray-500">Active Goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-lg p-4 border border-white/10">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-input rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
            className="px-4 py-3 glass-input rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Goals</option>
            {fitnessGoals.map(goal => (
              <option key={goal} value={goal}>{getGoalLabel(goal)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center border border-white/10">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center border border-white/10">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No members found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first member</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 glass-button text-white rounded font-medium"
          >
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={() => setEditingMember(member)}
              onDelete={() => handleDelete(member.id, member.user_id)}
              getGoalLabel={getGoalLabel}
              getGoalColor={getGoalColor}
              getPlanLabel={getPlanLabel}
              getPlanColor={getPlanColor}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingMember) && (
        <MemberFormModal
          member={editingMember}
          isOpen={!!(showAddModal || editingMember)}
          onClose={() => {
            setShowAddModal(false)
            setEditingMember(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingMember(null)
            fetchMembers()
          }}
        />
      )}
    </div>
  )
}

function MemberCard({ member, onEdit, onDelete, getGoalLabel, getGoalColor, getPlanLabel, getPlanColor }: {
  member: Member
  onEdit: () => void
  onDelete: () => void
  getGoalLabel: (goal: string | null) => string
  getGoalColor: (goal: string | null) => string
  getPlanLabel: (plan: string | undefined) => string
  getPlanColor: (plan: string | undefined) => string
}) {
  const [showMenu, setShowMenu] = useState(false)
  const isActive = member.subscription_status === 'active'
  const headerBg = isActive
    ? 'bg-gradient-to-r from-primary/30 to-accent-red/30'
    : 'bg-gradient-to-r from-slate-600/40 to-slate-700/30'

  return (
    <div className="glass-card rounded-lg border border-white/10 hover:border-primary/30 transition-all overflow-hidden group card-hover">
      <div className={`h-2 ${isActive ? 'bg-primary/60' : 'bg-accent-red/60'}`} />
      <div className={`h-20 ${headerBg} relative border-b border-white/10`}>
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 rounded-lg glass-card border border-slate-600/50 p-1">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded object-cover" />
            ) : (
              <div className="w-full h-full rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl font-bold">
                {member.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-300" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 glass-card rounded border border-slate-600/50 shadow-xl py-2 min-w-[140px] z-10">
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(); }}
                  className="w-full px-4 py-2 text-left text-sm text-accent-red-light hover:bg-accent-red/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-14 p-6">
        <h3 className="text-lg font-bold text-white">{member.full_name}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${getPlanColor(member.subscription_plan)}`}>
            <BadgeCheck className="w-3.5 h-3.5" />
            {getPlanLabel(member.subscription_plan)}
          </span>
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${getGoalColor(member.fitness_goal)}`}>
            {getGoalLabel(member.fitness_goal)}
          </span>
          {member.subscription_status && (
            <span className={`text-xs ${member.subscription_status === 'active' ? 'text-primary' : 'text-gray-500'}`}>
              {member.subscription_status === 'active' ? '● Active' : `● ${member.subscription_status}`}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          {member.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{member.phone}</span>
            </div>
          )}
          {(member.assigned_trainer_id || member.assigned_trainer_name) && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <UserCheck className="w-4 h-4 flex-shrink-0 text-primary/70" />
              <span>Trainer: {member.assigned_trainer_name || 'Unassigned (deleted)'}</span>
            </div>
          )}
          {(member.assigned_dietitian_id || member.assigned_dietitian_name) && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Salad className="w-4 h-4 flex-shrink-0 text-emerald-500/80" />
              <span>Dietitian: {member.assigned_dietitian_name || 'Unassigned (deleted)'}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberFormModal({ member, isOpen, onClose, onSuccess }: {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dietitians, setDietitians] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [trainers, setTrainers] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [form, setForm] = useState({
    full_name: member?.full_name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    date_of_birth: (member?.date_of_birth || '').toString().split('T')[0] || '',
    fitness_goal: member?.fitness_goal || '',
    plan: (member as Member & { subscription_plan?: string })?.subscription_plan || 'normal_gym',
    dietitian_id: (member as Member)?.assigned_dietitian_id || '',
    trainer_id: (member as Member)?.assigned_trainer_id || '',
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function refreshStaff() {
    try {
      const [dietRes, trainRes] = await Promise.all([
        fetch('/api/dietitians', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/trainers', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ])
      const dietData = await dietRes.json()
      const trainData = await trainRes.json()
      const dietList = Array.isArray(dietData) ? dietData : []
      const trainList = Array.isArray(trainData) ? trainData : []
      setDietitians(dietList)
      setTrainers(trainList)
      setForm(prev => ({
        ...prev,
        trainer_id: prev.trainer_id && trainList.some((t: { id: string }) => t.id === prev.trainer_id) ? prev.trainer_id : '',
        dietitian_id: prev.dietitian_id && dietList.some((d: { id: string }) => d.id === prev.dietitian_id) ? prev.dietitian_id : '',
      }))
    } catch (e) {
      console.error('Failed to load staff:', e)
    }
  }

  useEffect(() => {
    if (isOpen) refreshStaff()
  }, [isOpen])

  useEffect(() => {
    const onFocus = () => { if (isOpen) refreshStaff() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTempPassword(null)

    try {
      if (member) {
        await supabase
          .from('profiles')
          .update({ 
            full_name: form.full_name, 
            email: form.email, 
            phone: form.phone,
            date_of_birth: form.date_of_birth || null 
          })
          .eq('id', member.user_id)

        const planType = (form.plan as string) || 'normal_gym'
        const trainerId = (planType === 'with_pt' || planType === 'premium') && form.trainer_id ? form.trainer_id : null
        const dietitianId = (planType === 'with_dietitian' || planType === 'premium') && form.dietitian_id ? form.dietitian_id : null
        await supabase
          .from('client_profiles')
          .update({ 
            fitness_goal: form.fitness_goal || null,
            assigned_trainer_id: trainerId,
            assigned_dietitian_id: dietitianId,
          })
          .eq('id', member.id)
        if (dietitianId) {
          await supabase.from('client_dietitian_assignments').update({ is_active: false }).eq('client_id', member.user_id)
          const { error: assignErr } = await supabase.from('client_dietitian_assignments').upsert(
            { client_id: member.user_id, dietitian_id: dietitianId, is_active: true },
            { onConflict: 'client_id,dietitian_id' }
          )
          if (assignErr) console.warn('Dietitian assignment upsert:', assignErr)
        } else {
          await supabase.from('client_dietitian_assignments').update({ is_active: false }).eq('client_id', member.user_id)
        }
        onSuccess()
      } else {
        const res = await fetch('/api/add-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone || undefined,
            date_of_birth: form.date_of_birth || undefined,
            plan: form.plan,
            fitness_goal: form.fitness_goal || undefined,
            trainer_id: (form.plan === 'with_pt' || form.plan === 'premium') && form.trainer_id ? form.trainer_id : undefined,
            dietitian_id: (form.plan === 'with_dietitian' || form.plan === 'premium') && form.dietitian_id ? form.dietitian_id : undefined,
          }),
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to add member')
        }
        setTempPassword(data.tempPassword)
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error saving member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-2xl border border-white/20 w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="backdrop-blur-xl bg-gradient-to-r from-primary/40 to-accent-red/40 p-6 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 border border-primary/40 rounded">
                {member ? <Edit2 className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{member ? 'Edit Member' : 'Add New Member'}</h2>
                <p className="text-gray-400 text-sm">{member ? 'Update member details' : 'Register a new gym member'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="p-3 bg-accent-red/20 border border-accent-red/40 text-accent-red-light rounded text-sm">
              {error}
            </div>
          )}

          {tempPassword ? (
            <div className="p-4 glass-subtle border border-primary/40 rounded-lg space-y-3">
              <p className="text-sm font-medium text-primary">Member added successfully!</p>
              <p className="text-gray-300 text-sm">Share this temporary password with the client: <code className="bg-black/30 px-2 py-1 rounded font-mono text-primary break-all">{tempPassword}</code></p>
              <p className="text-gray-500 text-xs">They must change it on first login in the app.</p>
              <button
                type="button"
                onClick={() => { onSuccess(); onClose(); }}
                className="w-full px-4 py-2 glass-button text-white rounded font-medium"
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
              className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&::-webkit-calendar-picker-indicator]:opacity-70"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subscription Plan *</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value, dietitian_id: '', trainer_id: '' })}
              className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&>option]:bg-surface-card [&>option]:text-white"
              disabled={!!member}
            >
              <option value="normal_gym" className="bg-surface-card">Normal Gym - $150/month</option>
              <option value="with_pt" className="bg-surface-card">Personal Training - $350/month</option>
              <option value="with_dietitian" className="bg-surface-card">Nutrition Plan - $300/month</option>
              <option value="premium" className="bg-surface-card">Premium Package - $550/month</option>
            </select>
            {member && <p className="text-xs text-gray-500 mt-1">Plan cannot be changed when editing</p>}
          </div>
          {(form.plan === 'with_pt' || form.plan === 'premium') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Assign to Trainer {!member && '*'}</label>
              <select
                value={form.trainer_id}
                onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
                className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&>option]:bg-surface-card [&>option]:text-white"
                required={!member}
              >
                <option value="" className="bg-surface-card">Select trainer</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id} className="bg-surface-card">{t.full_name} ({t.email})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Client will be assigned to this personal trainer</p>
            </div>
          )}
          {(form.plan === 'with_dietitian' || form.plan === 'premium') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Assign to Dietitian {!member && '*'}</label>
              <select
                value={form.dietitian_id}
                onChange={(e) => setForm({ ...form, dietitian_id: e.target.value })}
                className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&>option]:bg-surface-card [&>option]:text-white"
                required={!member}
              >
                <option value="" className="bg-surface-card">Select dietitian</option>
                {dietitians.map(d => (
                  <option key={d.id} value={d.id} className="bg-surface-card">{d.full_name} ({d.email})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Client will appear in the dietitian&apos;s portal</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fitness Goal</label>
            <select
              value={form.fitness_goal}
              onChange={(e) => setForm({ ...form, fitness_goal: e.target.value })}
              className="w-full px-4 py-3 glass-input rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&>option]:bg-surface-card [&>option]:text-white"
            >
              <option value="">Select a goal (optional)</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="general_fitness">General Fitness</option>
              <option value="strength">Strength</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 flex-shrink-0">
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
              {member ? 'Update' : 'Add Member'}
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
