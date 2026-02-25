'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  Salad,
  UserPlus,
  Mail,
  Phone,
  Users,
  MoreVertical,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Nutritionist = {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  date_of_birth?: string
  specializations: string | null
  experience_years: number
  bio: string | null
  created_at: string
  avatar_url?: string
  client_count?: number
}

export default function NutritionistsPage() {
  const [loading, setLoading] = useState(true)
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNutritionist, setEditingNutritionist] = useState<Nutritionist | null>(null)

  useEffect(() => {
    fetchNutritionists()

    const channel = supabase
      .channel('nutritionist_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dietitian_profiles',
      }, () => {
        fetchNutritionists()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchNutritionists() {
    setLoading(true)
    try {
      const { data: dietitianProfiles, error: dietitianError } = await supabase
        .from('dietitian_profiles')
        .select('id, user_id, specializations, certifications, experience_years, bio, created_at')
        .order('created_at', { ascending: false })

      if (dietitianError) throw dietitianError

      if (dietitianProfiles && dietitianProfiles.length > 0) {
        const userIds = dietitianProfiles.map(dp => dp.user_id)
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, avatar_url, date_of_birth')
          .in('id', userIds)

        if (profileError) throw profileError

        const { data: assignments } = await supabase
          .from('client_dietitian_assignments')
          .select('dietitian_id')
          .eq('is_active', true)

        const nutritionistData = dietitianProfiles.map(dp => {
          const profile = profiles?.find(p => p.id === dp.user_id)
          const clients = assignments?.filter(a => a.dietitian_id === dp.user_id).length || 0
          const spec = dp.specializations 
            ? (Array.isArray(dp.specializations) ? dp.specializations.join(', ') : dp.specializations)
            : null
          return {
            id: dp.id,
            user_id: dp.user_id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            phone: profile?.phone || '',
            date_of_birth: profile?.date_of_birth,
            specializations: spec,
            experience_years: dp.experience_years || 0,
            bio: dp.bio,
            created_at: dp.created_at,
            avatar_url: profile?.avatar_url,
            client_count: clients
          }
        })
        setNutritionists(nutritionistData)
      } else {
        setNutritionists([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, userId: string) {
    if (!confirm('Are you sure you want to delete this nutritionist?')) return
    try {
      await supabase.from('dietitian_profiles').delete().eq('id', id)
      await supabase.from('profiles').delete().eq('id', userId)
      fetchNutritionists()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredNutritionists = nutritionists.filter(n =>
    n.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.specializations || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalClients = nutritionists.reduce((sum, n) => sum + (n.client_count || 0), 0)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl strength-card border border-primary/20 p-8 shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent-red/10" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-24 bg-gradient-to-b from-primary to-primary/30 rounded-r" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
                <Salad className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Nutritionists</h1>
                <p className="text-gray-400">Manage dietitians for Nutrition Plan & Premium clients</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded font-semibold hover:bg-primary-light transition-colors border border-primary/50"
            >
              <UserPlus className="w-5 h-5" />
              Add Nutritionist
            </button>
          </div>
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="workout-stat">
              <div className="p-2.5 bg-primary/20 rounded-lg border border-primary/30">
                <Salad className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{nutritionists.length}</p>
                <p className="text-xs text-gray-400 font-medium">Total Nutritionists</p>
              </div>
            </div>
            <div className="workout-stat">
              <div className="p-2.5 bg-primary/20 rounded-lg border border-primary/30">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{totalClients}</p>
                <p className="text-xs text-gray-400 font-medium">Assigned Clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-4 border border-white/10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search nutritionists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass-input border border-slate-600/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center border border-white/10">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading nutritionists...</p>
        </div>
      ) : filteredNutritionists.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center border border-white/10">
          <Salad className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No nutritionists found</h3>
          <p className="text-gray-500 mb-6">Add a nutritionist to assign them to clients with Nutrition Plan or Premium</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-white rounded font-medium hover:bg-primary-light transition-colors border border-primary/50"
          >
            Add First Nutritionist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNutritionists.map((n) => (
            <NutritionistCard
              key={n.id}
              nutritionist={n}
              onEdit={() => setEditingNutritionist(n)}
              onDelete={() => handleDelete(n.id, n.user_id)}
            />
          ))}
        </div>
      )}

      {(showAddModal || editingNutritionist) && (
        <NutritionistFormModal
          nutritionist={editingNutritionist}
          onClose={() => {
            setShowAddModal(false)
            setEditingNutritionist(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingNutritionist(null)
            fetchNutritionists()
          }}
        />
      )}
    </div>
  )
}

function NutritionistCard({ nutritionist, onEdit, onDelete }: {
  nutritionist: Nutritionist
  onEdit: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="strength-card glass-card rounded-xl border border-primary/20 hover:border-primary/40 transition-all overflow-hidden group card-hover shadow-glow">
      <div className="h-24 bg-gradient-to-r from-primary/30 to-accent-red/30 relative border-b border-white/10">
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-lg glass-card border border-slate-600/50 p-1">
            {nutritionist.avatar_url ? (
              <img src={nutritionist.avatar_url} alt={nutritionist.full_name} className="w-full h-full rounded object-cover" />
            ) : (
              <div className="w-full h-full rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-3xl font-bold">
                {nutritionist.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-300" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 glass-card rounded border border-slate-600/50 shadow-xl py-2 min-w-[140px] z-10">
                <button onClick={() => { setShowMenu(false); onEdit(); }} className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { setShowMenu(false); onDelete(); }} className="w-full px-4 py-2 text-left text-sm text-accent-red-light hover:bg-accent-red/10 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-16 p-6">
        <h3 className="text-lg font-bold text-white">{nutritionist.full_name}</h3>
        {nutritionist.specializations && (
          <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded text-xs font-medium mt-2 border border-primary/40">
            {nutritionist.specializations}
          </span>
        )}

        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{nutritionist.experience_years}</p>
            <p className="text-xs text-gray-500">Years Exp.</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{nutritionist.client_count || 0}</p>
            <p className="text-xs text-gray-500">Clients</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="truncate">{nutritionist.email}</span>
          </div>
          {nutritionist.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{nutritionist.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NutritionistFormModal({ nutritionist, onClose, onSuccess }: {
  nutritionist: Nutritionist | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: nutritionist?.full_name || '',
    email: nutritionist?.email || '',
    phone: nutritionist?.phone || '',
    date_of_birth: (nutritionist?.date_of_birth || '').toString().split('T')[0] || '',
    specializations: nutritionist?.specializations || '',
    certifications: '',
    experience_years: nutritionist?.experience_years || 0,
    bio: nutritionist?.bio || ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTempPassword(null)

    try {
      if (nutritionist) {
        const spec = form.specializations ? (form.specializations.includes(',') ? form.specializations.split(',').map(s => s.trim()) : [form.specializations]) : []
        await supabase.from('profiles').update({ full_name: form.full_name, email: form.email, phone: form.phone, date_of_birth: form.date_of_birth || null }).eq('id', nutritionist.user_id)
        await supabase.from('dietitian_profiles').update({
          specializations: spec,
          experience_years: form.experience_years,
          bio: form.bio || null
        }).eq('id', nutritionist.id)
        onSuccess()
      } else {
        const res = await fetch('/api/add-nutritionist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone: form.phone || undefined,
            date_of_birth: form.date_of_birth || undefined,
            specializations: form.specializations || undefined,
            certifications: form.certifications || undefined,
            experience_years: form.experience_years,
            bio: form.bio || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to add nutritionist')
        setTempPassword(data.tempPassword)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving')
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
                <Salad className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{nutritionist ? 'Edit Nutritionist' : 'Add Nutritionist'}</h2>
                <p className="text-gray-400 text-sm">Assign to clients with Nutrition Plan or Premium</p>
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
            <div className="p-3 bg-accent-red/20 border border-accent-red/40 text-accent-red-light rounded text-sm">{error}</div>
          )}

          {tempPassword ? (
            <div className="p-4 glass-subtle border border-primary/40 rounded-lg space-y-3">
              <p className="text-sm font-medium text-primary">Nutritionist added!</p>
              <p className="text-gray-300 text-sm">Share this temporary password: <code className="bg-black/30 px-2 py-1 rounded font-mono text-primary break-all">{tempPassword}</code></p>
              <button type="button" onClick={() => { onSuccess(); onClose(); }} className="w-full px-4 py-2 glass-button text-white rounded font-medium">Done</button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white [&::-webkit-calendar-picker-indicator]:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Specializations</label>
                <input type="text" value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white" placeholder="e.g. Weight Loss, Sports Nutrition" />
              </div>
              {!nutritionist && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Certifications</label>
                  <input type="text" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white" placeholder="Optional" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
                <input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 glass-input rounded text-white" min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-4 py-3 glass-input rounded text-white" rows={2} placeholder="Optional" />
              </div>
              <div className="flex gap-3 pt-4 flex-shrink-0">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-600 rounded text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-primary text-white rounded font-medium hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-primary/50">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {nutritionist ? 'Update' : 'Add Nutritionist'}
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
