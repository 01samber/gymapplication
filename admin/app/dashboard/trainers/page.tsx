'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Plus, 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  UserCog,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Star,
  Users,
  Award,
  MoreVertical,
  Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Trainer = {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  date_of_birth?: string
  specialization: string | string[] | null
  experience_years: number
  bio: string | null
  created_at: string
  avatar_url?: string
  client_count?: number
}

export default function TrainersPage() {
  const [loading, setLoading] = useState(true)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)

  useEffect(() => {
    fetchTrainers()

    const channel = supabase
      .channel('trainer_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trainer_profiles',
      }, () => {
        fetchTrainers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchTrainers() {
    setLoading(true)
    try {
      const { data: trainerProfiles, error: trainerError } = await supabase
        .from('trainer_profiles')
        .select('id, user_id, specializations, experience_years, bio, created_at')
        .order('created_at', { ascending: false })

      if (trainerError) throw trainerError

      if (trainerProfiles && trainerProfiles.length > 0) {
        const userIds = trainerProfiles.map(tp => tp.user_id)
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url, date_of_birth')
          .in('id', userIds)

        if (profileError) throw profileError

        // Get client counts (assigned_trainer_id references profiles.id = user_id)
        const { data: clientCounts } = await supabase
          .from('client_profiles')
          .select('assigned_trainer_id')
          .not('assigned_trainer_id', 'is', null)

        const trainerData = trainerProfiles.map(tp => {
          const profile = profiles?.find(p => p.id === tp.user_id)
          const clients = clientCounts?.filter(c => c.assigned_trainer_id === tp.user_id).length || 0
          return {
            id: tp.id,
            user_id: tp.user_id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            phone: profile?.phone || '',
            specialization: tp.specializations ? (Array.isArray(tp.specializations) ? tp.specializations.join(', ') : tp.specializations) : null,
            experience_years: tp.experience_years || 0,
            bio: tp.bio,
            created_at: tp.created_at,
            avatar_url: profile?.avatar_url,
            client_count: clients
          }
        })
        setTrainers(trainerData)
      } else {
        setTrainers([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, userId: string) {
    if (!confirm('Are you sure you want to delete this trainer?')) return
    try {
      await supabase.from('trainer_profiles').delete().eq('id', id)
      await supabase.from('profiles').delete().eq('id', userId)
      fetchTrainers()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredTrainers = trainers.filter(t => {
    const spec = typeof t.specialization === 'string' ? t.specialization : Array.isArray(t.specialization) ? t.specialization.join(' ') : ''
    return t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalClients = trainers.reduce((sum, t) => sum + (t.client_count || 0), 0)
  const avgExperience = trainers.length > 0 
    ? (trainers.reduce((sum, t) => sum + t.experience_years, 0) / trainers.length).toFixed(1)
    : 0

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
                <UserCog className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Trainers</h1>
                <p className="text-gray-400">Manage your personal trainers</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded font-semibold hover:bg-primary-light transition-colors border border-primary/50"
            >
              <UserPlus className="w-5 h-5" />
              Add Trainer
            </button>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <UserCog className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{trainers.length}</p>
                <p className="text-xs text-gray-500">Total Trainers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalClients}</p>
                <p className="text-xs text-gray-500">Total Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{avgExperience}</p>
                <p className="text-xs text-gray-500">Avg. Years Exp.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card rounded-lg p-4 border border-white/10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search trainers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass-input border border-slate-600/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Trainers Grid */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center border border-white/10">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading trainers...</p>
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center border border-white/10">
          <UserCog className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No trainers found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first trainer</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-white rounded font-medium hover:bg-primary-light transition-colors border border-primary/50"
          >
            Add First Trainer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrainers.map((trainer) => (
            <TrainerCard
              key={trainer.id}
              trainer={trainer}
              onEdit={() => setEditingTrainer(trainer)}
              onDelete={() => handleDelete(trainer.id, trainer.user_id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingTrainer) && (
        <TrainerFormModal
          trainer={editingTrainer}
          onClose={() => {
            setShowAddModal(false)
            setEditingTrainer(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingTrainer(null)
            fetchTrainers()
          }}
        />
      )}
    </div>
  )
}

function TrainerCard({ trainer, onEdit, onDelete }: {
  trainer: Trainer
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="glass-card rounded-lg border border-white/10 hover:border-primary/30 transition-all overflow-hidden group card-hover">
      <div className="h-24 bg-gradient-to-r from-primary/30 to-accent-red/30 relative border-b border-white/10">
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-lg glass-card border border-slate-600/50 p-1">
            {trainer.avatar_url ? (
              <img src={trainer.avatar_url} alt={trainer.full_name} className="w-full h-full rounded object-cover" />
            ) : (
              <div className="w-full h-full rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-3xl font-bold">
                {trainer.full_name.charAt(0).toUpperCase()}
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

      <div className="pt-16 p-6">
        <h3 className="text-lg font-bold text-white">{trainer.full_name}</h3>
        {trainer.specialization && (
          <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded text-xs font-medium mt-2 border border-primary/40">
            {trainer.specialization}
          </span>
        )}

        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{trainer.experience_years}</p>
            <p className="text-xs text-gray-500">Years Exp.</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{trainer.client_count || 0}</p>
            <p className="text-xs text-gray-500">Clients</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="truncate">{trainer.email}</span>
          </div>
          {trainer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{trainer.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TrainerFormModal({ trainer, onClose, onSuccess }: {
  trainer: Trainer | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: trainer?.full_name || '',
    email: trainer?.email || '',
    phone: trainer?.phone || '',
    date_of_birth: (trainer?.date_of_birth || '').toString().split('T')[0] || '',
    specialization: typeof trainer?.specialization === 'string' ? trainer.specialization : Array.isArray(trainer?.specialization) ? (trainer.specialization as string[]).join(', ') : '',
    experience_years: trainer?.experience_years || 0,
    bio: trainer?.bio || ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTempPassword(null)

    try {
      if (trainer) {
        const specializations = form.specialization
          ? (form.specialization.includes(',') ? form.specialization.split(',').map(s => s.trim()) : [form.specialization])
          : []
        await supabase
          .from('profiles')
          .update({ full_name: form.full_name, email: form.email, phone: form.phone, date_of_birth: form.date_of_birth || null })
          .eq('id', trainer.user_id)

        await supabase
          .from('trainer_profiles')
          .update({ 
            specializations: specializations.length > 0 ? specializations : [],
            experience_years: form.experience_years,
            bio: form.bio || null
          })
          .eq('id', trainer.id)
        onSuccess()
      } else {
        const res = await fetch('/api/add-trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone || undefined,
            date_of_birth: form.date_of_birth || undefined,
            specialization: form.specialization || undefined,
            experience_years: form.experience_years,
            bio: form.bio || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to add trainer')
        setTempPassword(data.tempPassword)
      }
    } catch (err: unknown) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error saving trainer')
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
                {trainer ? <Edit2 className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{trainer ? 'Edit Trainer' : 'Add New Trainer'}</h2>
                <p className="text-gray-400 text-sm">{trainer ? 'Update trainer details' : 'Register a new trainer'}</p>
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
            <div className="p-3 bg-accent-red/20 border border-accent-red/40 text-accent-red-light rounded-lg text-sm">
              {error}
            </div>
          )}

          {tempPassword ? (
            <div className="p-4 glass-subtle border border-primary/40 rounded-lg space-y-3">
              <p className="text-sm font-medium text-primary">Trainer added successfully!</p>
              <p className="text-gray-300 text-sm">Share this temporary password with the trainer: <code className="bg-black/30 px-2 py-1 rounded font-mono text-primary break-all">{tempPassword}</code></p>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&::-webkit-calendar-picker-indicator]:opacity-70"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Specialization</label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g., Weight Training"
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
              <input
                type="number"
                value={form.experience_years}
                onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Brief description about the trainer..."
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
              {trainer ? 'Update' : 'Add Trainer'}
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
