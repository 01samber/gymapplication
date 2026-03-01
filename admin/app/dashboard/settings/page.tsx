'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    gym_name: 'Sweat Box Gym',
    address: 'Sarba, Jounieh, Lebanon',
    phone: '+961 XX XXX XXX',
    email: 'info@sweatboxgym.com',
    open_gym_price: 75,
    pt_package_price: 200,
    operating_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '18:00' },
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gym_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (data) {
        setFormData({
          gym_name: data.gym_name || formData.gym_name,
          address: data.address || formData.address,
          phone: data.phone || formData.phone,
          email: data.email || formData.email,
          open_gym_price: data.open_gym_price_usd || formData.open_gym_price,
          pt_package_price: data.pt_package_price_usd || formData.pt_package_price,
          operating_hours: data.operating_hours || formData.operating_hours,
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('gym_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      const settingsData = {
        gym_name: formData.gym_name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        open_gym_price_usd: formData.open_gym_price,
        pt_package_price_usd: formData.pt_package_price,
        operating_hours: formData.operating_hours,
      }

      if (existing) {
        await supabase
          .from('gym_settings')
          .update(settingsData)
          .eq('id', existing.id)
      } else {
        await supabase
          .from('gym_settings')
          .insert(settingsData)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const updateHours = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day as keyof typeof prev.operating_hours],
          [field]: value
        }
      }
    }))
  }

  if (loading) {
    return (
      <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Hero Header - matches Subscriptions */}
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">Settings</h1>
            <p className="text-gray-400">Manage your gym settings and preferences</p>
          </div>
        {saved && (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Saved successfully!</span>
          </div>
        )}
        </div>
      </div>

      {/* Gym Info */}
      <div className="glass-card rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold text-white mb-4">Gym Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Gym Name</label>
            <input
              type="text"
              value={formData.gym_name}
              onChange={(e) => setFormData(p => ({ ...p, gym_name: e.target.value }))}
              className="w-full px-4 py-3 glass-input border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
              className="w-full px-4 py-3 glass-input border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 glass-input border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 glass-input border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="glass-card rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold text-white mb-4">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Open Gym (Monthly)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.open_gym_price}
                onChange={(e) => setFormData(p => ({ ...p, open_gym_price: parseInt(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 glass-input border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">PT Package (Monthly)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.pt_package_price}
                onChange={(e) => setFormData(p => ({ ...p, pt_package_price: parseInt(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 glass-input border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="glass-card rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold text-white mb-4">Operating Hours</h2>
        <div className="space-y-3">
          {Object.entries(formData.operating_hours).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-400 capitalize">{day}</span>
              <input
                type="time"
                value={hours.open}
                onChange={(e) => updateHours(day, 'open', e.target.value)}
                className="px-3 py-2 glass-input border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                value={hours.close}
                onChange={(e) => updateHours(day, 'close', e.target.value)}
                className="px-3 py-2 glass-input border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 glass-button text-white rounded-xl font-medium disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Changes
          </>
        )}
      </button>
    </div>
  )
}
