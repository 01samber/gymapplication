'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, Loader2, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Specialization = {
  id: string
  name: string
  slug: string | null
  display_order: number
  created_at: string
}

export default function SpecializationsPage() {
  const [loading, setLoading] = useState(true)
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Specialization | null>(null)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formOrder, setFormOrder] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSpecializations()
  }, [])

  async function fetchSpecializations() {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('specializations')
        .select('id, name, slug, display_order, created_at')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (err) throw err
      setSpecializations(data || [])
    } catch (e) {
      console.error(e)
      setSpecializations([])
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditing(null)
    setFormName('')
    setFormOrder(specializations.length)
    setError('')
    setShowModal(true)
  }

  function openEdit(spec: Specialization) {
    setEditing(spec)
    setFormName(spec.name)
    setFormOrder(spec.display_order)
    setError('')
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setSaving(true)
    setError('')
    try {
      const slug = formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      if (editing) {
        const { error: err } = await supabase
          .from('specializations')
          .update({ name: formName.trim(), slug: slug || null, display_order: formOrder, updated_at: new Date().toISOString() })
          .eq('id', editing.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('specializations')
          .insert({ name: formName.trim(), slug: slug || null, display_order: formOrder })
        if (err) throw err
      }
      await fetchSpecializations()
      setShowModal(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this specialization? Trainers and nutritionists using it will have it removed.')) return
    try {
      const { error: err } = await supabase.from('specializations').delete().eq('id', id)
      if (err) throw err
      await fetchSpecializations()
    } catch (e) {
      console.error(e)
      alert('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 border border-primary/40 rounded">
              <Tag className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Specializations</h1>
              <p className="text-gray-400 text-sm">Manage linked specialties for trainers and nutritionists</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Specialization
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        ) : specializations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No specializations yet. Add one to link trainers and nutritionists consistently.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {specializations.map((spec) => (
              <div key={spec.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5">
                <div>
                  <span className="font-medium text-white">{spec.name}</span>
                  {spec.slug && <span className="text-gray-500 text-sm ml-2">({spec.slug})</span>}
                  <span className="text-gray-500 text-sm ml-2">Order: {spec.display_order}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(spec)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(spec.id)}
                    className="p-2 text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-modal rounded-2xl border border-white/20 w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Edit Specialization' : 'Add Specialization'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="p-3 bg-accent-red/20 border border-accent-red/40 text-accent-red-light rounded text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Weight Training"
                  className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-600 rounded text-gray-300 hover:bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-primary text-white rounded font-medium hover:bg-primary-light disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
