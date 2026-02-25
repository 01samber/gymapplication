'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Activity, 
  Plus, 
  User,
  Scale,
  Ruler,
  Percent,
  Flame,
  Heart,
  X,
  Loader2,
  Save,
  Edit2,
  Trash2,
  BarChart3,
  FileText
} from 'lucide-react'
import { getMyClients, getClientBodyHistory, addBodyComposition, updateBodyComposition, deleteBodyComposition } from '@/lib/edge-functions'
import { formatDate, getBMICategory, getBodyFatCategory } from '@/lib/utils'
import type { BodyComposition } from '@/lib/supabase'
import BodyMeasurementTracker from '@/components/BodyMeasurementTracker'

export default function BodyAnalysisPage() {
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get('client')
  
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>(preselectedClient || '')
  const [selectedClientData, setSelectedClientData] = useState<any>(null)
  const [compositions, setCompositions] = useState<BodyComposition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'tracker' | 'table'>('tracker')

  // Form state
  const [formData, setFormData] = useState({
    measurement_date: new Date().toISOString().split('T')[0],
    height_cm: '',
    weight_kg: '',
    age: '',
    gender: 'male',
    total_body_water_l: '',
    protein_kg: '',
    minerals_kg: '',
    body_fat_mass_kg: '',
    skeletal_muscle_mass_kg: '',
    percent_body_fat: '',
    // Segmental lean
    left_arm_lean_kg: '',
    right_arm_lean_kg: '',
    trunk_lean_kg: '',
    left_leg_lean_kg: '',
    right_leg_lean_kg: '',
    // Segmental fat
    left_arm_fat_kg: '',
    right_arm_fat_kg: '',
    trunk_fat_kg: '',
    left_leg_fat_kg: '',
    right_leg_fat_kg: '',
    // Research
    fat_free_mass_kg: '',
    basal_metabolic_rate: '',
    waist_hip_ratio: '',
    visceral_fat_level: '',
    // Weight control
    target_weight_kg: '',
    weight_control_kg: '',
    fat_control_kg: '',
    muscle_control_kg: '',
    notes: ''
  })

  const resetForm = () => {
    setFormData({
      measurement_date: new Date().toISOString().split('T')[0],
      height_cm: '',
      weight_kg: '',
      age: '',
      gender: 'male',
      total_body_water_l: '',
      protein_kg: '',
      minerals_kg: '',
      body_fat_mass_kg: '',
      skeletal_muscle_mass_kg: '',
      percent_body_fat: '',
      left_arm_lean_kg: '',
      right_arm_lean_kg: '',
      trunk_lean_kg: '',
      left_leg_lean_kg: '',
      right_leg_lean_kg: '',
      left_arm_fat_kg: '',
      right_arm_fat_kg: '',
      trunk_fat_kg: '',
      left_leg_fat_kg: '',
      right_leg_fat_kg: '',
      fat_free_mass_kg: '',
      basal_metabolic_rate: '',
      waist_hip_ratio: '',
      visceral_fat_level: '',
      target_weight_kg: '',
      weight_control_kg: '',
      fat_control_kg: '',
      muscle_control_kg: '',
      notes: ''
    })
    setEditingId(null)
  }

  useEffect(() => {
    async function loadData() {
      try {
        const { data: clientAssignments } = await getMyClients()
        if (clientAssignments) {
          setClients(clientAssignments.map((a: any) => a.client))
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientData()
      const client = clients.find(c => c.id === selectedClient)
      setSelectedClientData(client)
    }
  }, [selectedClient, clients])

  async function loadClientData() {
    setLoading(true)
    try {
      const { data } = await getClientBodyHistory(selectedClient)
      if (data) {
        setCompositions(data)
      }
    } catch (error) {
      console.error('Error loading body compositions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (composition: BodyComposition) => {
    setFormData({
      measurement_date: composition.measurement_date,
      height_cm: composition.height_cm?.toString() || '',
      weight_kg: composition.weight_kg?.toString() || '',
      age: composition.age?.toString() || '',
      gender: composition.gender || 'male',
      total_body_water_l: composition.total_body_water_l?.toString() || '',
      protein_kg: composition.protein_kg?.toString() || '',
      minerals_kg: composition.minerals_kg?.toString() || '',
      body_fat_mass_kg: composition.body_fat_mass_kg?.toString() || '',
      skeletal_muscle_mass_kg: composition.skeletal_muscle_mass_kg?.toString() || '',
      percent_body_fat: composition.percent_body_fat?.toString() || '',
      left_arm_lean_kg: composition.left_arm_lean_kg?.toString() || '',
      right_arm_lean_kg: composition.right_arm_lean_kg?.toString() || '',
      trunk_lean_kg: composition.trunk_lean_kg?.toString() || '',
      left_leg_lean_kg: composition.left_leg_lean_kg?.toString() || '',
      right_leg_lean_kg: composition.right_leg_lean_kg?.toString() || '',
      left_arm_fat_kg: composition.left_arm_fat_kg?.toString() || '',
      right_arm_fat_kg: composition.right_arm_fat_kg?.toString() || '',
      trunk_fat_kg: composition.trunk_fat_kg?.toString() || '',
      left_leg_fat_kg: composition.left_leg_fat_kg?.toString() || '',
      right_leg_fat_kg: composition.right_leg_fat_kg?.toString() || '',
      fat_free_mass_kg: composition.fat_free_mass_kg?.toString() || '',
      basal_metabolic_rate: composition.basal_metabolic_rate?.toString() || '',
      waist_hip_ratio: composition.waist_hip_ratio?.toString() || '',
      visceral_fat_level: composition.visceral_fat_level?.toString() || '',
      target_weight_kg: composition.target_weight_kg?.toString() || '',
      weight_control_kg: composition.weight_control_kg?.toString() || '',
      fat_control_kg: composition.fat_control_kg?.toString() || '',
      muscle_control_kg: composition.muscle_control_kg?.toString() || '',
      notes: composition.notes || ''
    })
    setEditingId(composition.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteBodyComposition(id)
      if (error) {
        alert('Error deleting: ' + error)
        return
      }
      await loadClientData()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete measurement')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) return

    // Check for duplicate date when adding new
    if (!editingId) {
      const existingForDate = compositions.find(
        c => c.measurement_date === formData.measurement_date
      )
      if (existingForDate) {
        alert('A measurement already exists for this date. Please edit the existing one or choose a different date.')
        return
      }
    }

    setSaving(true)
    try {
      // Convert string values to numbers
      const measurement: any = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '') {
          measurement[key] = null
        } else if (key === 'measurement_date' || key === 'gender' || key === 'notes') {
          measurement[key] = value
        } else {
          measurement[key] = parseFloat(value as string)
        }
      })

      let result
      if (editingId) {
        result = await updateBodyComposition(editingId, measurement)
      } else {
        result = await addBodyComposition(selectedClient, measurement)
      }
      
      if (result.error) {
        alert('Error: ' + result.error)
        return
      }

      // Reload data and close form
      await loadClientData()
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save body composition')
    } finally {
      setSaving(false)
    }
  }

  const latestComposition = compositions[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Activity className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Body Analysis</h1>
              <p className="text-white/80">Professional InBody-style body composition tracking</p>
            </div>
          </div>
          {selectedClient && (
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white/20 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('tracker')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewMode === 'tracker' ? 'bg-white text-rose-600' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Tracker
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewMode === 'table' ? 'bg-white text-rose-600' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Table
                </button>
              </div>
              
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Measurement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Client
        </label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full md:w-80 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
        >
          <option value="">Choose a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.full_name} ({client.email})
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {!selectedClient ? (
        <div className="bg-white rounded-2xl p-16 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Client</h3>
          <p className="text-gray-500">Choose a client to view or add body composition data</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
        </div>
      ) : (
        <>
          {viewMode === 'tracker' ? (
            /* Professional Body Measurement Tracker */
            <BodyMeasurementTracker 
              compositions={compositions}
              clientName={selectedClientData?.full_name || 'Client'}
              gender={selectedClientData?.gender === 'female' ? 'female' : 'male'}
            />
          ) : (
            /* Table View with Edit/Delete */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Measurement History</h2>
                <span className="text-sm text-gray-500">{compositions.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Height</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body Fat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Muscle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BMR</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {compositions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No measurements recorded yet
                        </td>
                      </tr>
                    ) : (
                      compositions.map((comp) => (
                        <tr key={comp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {formatDate(comp.measurement_date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {comp.weight_kg?.toFixed(1) || '--'} kg
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {comp.height_cm?.toFixed(0) || '--'} cm
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-medium ${comp.bmi ? getBMICategory(comp.bmi).color : 'text-gray-400'}`}>
                              {comp.bmi?.toFixed(1) || '--'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {comp.percent_body_fat?.toFixed(1) || '--'}%
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {comp.skeletal_muscle_mass_kg?.toFixed(1) || '--'} kg
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {comp.basal_metabolic_rate || '--'} kcal
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(comp)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === comp.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(comp.id)}
                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(comp.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Measurement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Body Composition' : 'Add Body Composition'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.measurement_date}
                      onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="100"
                      max="250"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Body Composition */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  Body Composition Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Body Water (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.total_body_water_l}
                      onChange={(e) => setFormData({ ...formData, total_body_water_l: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.protein_kg}
                      onChange={(e) => setFormData({ ...formData, protein_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minerals (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.minerals_kg}
                      onChange={(e) => setFormData({ ...formData, minerals_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Fat Mass (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.body_fat_mass_kg}
                      onChange={(e) => setFormData({ ...formData, body_fat_mass_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Muscle-Fat Analysis */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-purple-600" />
                  </div>
                  Muscle-Fat Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skeletal Muscle Mass (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.skeletal_muscle_mass_kg}
                      onChange={(e) => setFormData({ ...formData, skeletal_muscle_mass_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Fat %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.percent_body_fat}
                      onChange={(e) => setFormData({ ...formData, percent_body_fat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat Free Mass (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fat_free_mass_kg}
                      onChange={(e) => setFormData({ ...formData, fat_free_mass_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Segmental Lean Analysis */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Ruler className="w-4 h-4 text-orange-600" />
                  </div>
                  Segmental Lean Analysis (kg)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Arm</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.left_arm_lean_kg}
                      onChange={(e) => setFormData({ ...formData, left_arm_lean_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Arm</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.right_arm_lean_kg}
                      onChange={(e) => setFormData({ ...formData, right_arm_lean_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trunk</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.trunk_lean_kg}
                      onChange={(e) => setFormData({ ...formData, trunk_lean_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Leg</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.left_leg_lean_kg}
                      onChange={(e) => setFormData({ ...formData, left_leg_lean_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Leg</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.right_leg_lean_kg}
                      onChange={(e) => setFormData({ ...formData, right_leg_lean_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Research Parameters */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-600" />
                  </div>
                  Research Parameters
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BMR (kcal)</label>
                    <input
                      type="number"
                      value={formData.basal_metabolic_rate}
                      onChange={(e) => setFormData({ ...formData, basal_metabolic_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waist-Hip Ratio</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.waist_hip_ratio}
                      onChange={(e) => setFormData({ ...formData, waist_hip_ratio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visceral Fat Level</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.visceral_fat_level}
                      onChange={(e) => setFormData({ ...formData, visceral_fat_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Control */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-emerald-600" />
                  </div>
                  Weight Control Recommendations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.target_weight_kg}
                      onChange={(e) => setFormData({ ...formData, target_weight_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight Control (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight_control_kg}
                      onChange={(e) => setFormData({ ...formData, weight_control_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat Control (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fat_control_kg}
                      onChange={(e) => setFormData({ ...formData, fat_control_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Control (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.muscle_control_kg}
                      onChange={(e) => setFormData({ ...formData, muscle_control_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Additional notes about this measurement..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingId ? 'Update Measurement' : 'Save Measurement'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
