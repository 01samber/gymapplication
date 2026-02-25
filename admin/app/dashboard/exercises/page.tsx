'use client'

import { useEffect, useState } from 'react'
import { Search, Loader2, Eye, X, Check, ChevronDown, ChevronUp, Dumbbell, Flame, Target, Zap, Star, Activity, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Exercise = {
  id: string
  name: string
  description: string | null
  muscle_group: string
  equipment: string
  difficulty: number
  is_cardio: boolean
  is_active: boolean
  instructions: string[] | null
  tips: string[] | null
}

const muscleGroups = [
  { value: 'chest', label: 'Chest', icon: '💪', color: 'from-red-500 to-rose-600', bg: 'bg-red-500', light: 'bg-red-50 text-red-700' },
  { value: 'back', label: 'Back', icon: '🔙', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
  { value: 'shoulders', label: 'Shoulders', icon: '🏋️', color: 'from-orange-500 to-amber-600', bg: 'bg-orange-500', light: 'bg-orange-50 text-orange-700' },
  { value: 'biceps', label: 'Biceps', icon: '💪', color: 'from-purple-500 to-violet-600', bg: 'bg-purple-500', light: 'bg-purple-50 text-purple-700' },
  { value: 'triceps', label: 'Triceps', icon: '🦾', color: 'from-pink-500 to-rose-600', bg: 'bg-pink-500', light: 'bg-pink-50 text-pink-700' },
  { value: 'quadriceps', label: 'Quadriceps', icon: '🦵', color: 'from-green-500 to-emerald-600', bg: 'bg-green-500', light: 'bg-green-50 text-green-700' },
  { value: 'hamstrings', label: 'Hamstrings', icon: '🦿', color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-500', light: 'bg-teal-50 text-teal-700' },
  { value: 'glutes', label: 'Glutes', icon: '🍑', color: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-500', light: 'bg-yellow-50 text-yellow-700' },
  { value: 'calves', label: 'Calves', icon: '🦶', color: 'from-lime-500 to-green-600', bg: 'bg-lime-500', light: 'bg-lime-50 text-lime-700' },
  { value: 'abs', label: 'Abs', icon: '🔥', color: 'from-red-500 to-orange-600', bg: 'bg-red-500', light: 'bg-red-50 text-red-700' },
  { value: 'obliques', label: 'Obliques', icon: '↔️', color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-500', light: 'bg-cyan-50 text-cyan-700' },
  { value: 'cardio', label: 'Cardio', icon: '❤️', color: 'from-rose-500 to-red-600', bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-700' },
]

const equipmentTypes = [
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'dumbbell', label: 'Dumbbells', icon: '🔩' },
  { value: 'cable', label: 'Cables', icon: '⚡' },
  { value: 'machine', label: 'Machines', icon: '⚙️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🧍' },
  { value: 'cardio_machine', label: 'Cardio', icon: '🏃' },
  { value: 'other', label: 'Other', icon: '🎯' },
]

export default function ExercisesPage() {
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMuscle, setFilterMuscle] = useState<string>('')
  const [filterEquipment, setFilterEquipment] = useState<string>('')
  const [showViewModal, setShowViewModal] = useState<Exercise | null>(null)
  const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'muscle' | 'equipment'>('muscle')

  useEffect(() => {
    fetchExercises()
  }, [])

  async function fetchExercises() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, description, muscle_group, equipment, difficulty, is_cardio, is_active, instructions, tips')
        .order('muscle_group')
        .order('name')

      if (error) throw error
      setExercises(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      await supabase
        .from('exercises')
        .update({ is_active: !currentStatus })
        .eq('id', id)
      fetchExercises()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMuscle = !filterMuscle || e.muscle_group === filterMuscle
    const matchesEquipment = !filterEquipment || e.equipment === filterEquipment
    return matchesSearch && matchesMuscle && matchesEquipment
  })

  const groupedByMuscle = filteredExercises.reduce((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {} as Record<string, Exercise[]>)

  const groupedByEquipment = filteredExercises.reduce((acc, ex) => {
    if (!acc[ex.equipment]) acc[ex.equipment] = []
    acc[ex.equipment].push(ex)
    return acc
  }, {} as Record<string, Exercise[]>)

  const getMuscleInfo = (muscle: string) => {
    return muscleGroups.find(m => m.value === muscle) || { value: muscle, label: muscle, icon: '💪', color: 'from-gray-500 to-gray-600', bg: 'bg-gray-500', light: 'glass-subtle text-gray-300' }
  }

  const getEquipmentInfo = (eq: string) => {
    return equipmentTypes.find(e => e.value === eq) || { value: eq, label: eq, icon: '🏋️' }
  }

  const totalActive = exercises.filter(e => e.is_active).length
  const totalExercises = exercises.length

  return (
    <div className="space-y-6">
      {/* Hero Header - UFC/FIFA theme */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
              <Dumbbell className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">Exercise Library</h1>
              <p className="text-gray-400">Complete collection of gym exercises</p>
            </div>
          </div>
          
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalExercises}</p>
                <p className="text-xs text-gray-400">Total Exercises</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalActive}</p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Object.keys(groupedByMuscle).length}</p>
                <p className="text-xs text-gray-400">Muscle Groups</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-lg border border-white/10 p-4 border border-white/10 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex glass-subtle rounded-xl p-1">
            <button
              onClick={() => setViewMode('muscle')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'muscle' ? 'glass-button text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              By Muscle
            </button>
            <button
              onClick={() => setViewMode('equipment')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'equipment' ? 'glass-button text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              By Equipment
            </button>
          </div>

          <select
            value={filterMuscle}
            onChange={(e) => setFilterMuscle(e.target.value)}
            className="px-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Muscles</option>
            {muscleGroups.map(mg => (
              <option key={mg.value} value={mg.value}>{mg.icon} {mg.label}</option>
            ))}
          </select>

          <select
            value={filterEquipment}
            onChange={(e) => setFilterEquipment(e.target.value)}
            className="px-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map(eq => (
              <option key={eq.value} value={eq.value}>{eq.icon} {eq.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card rounded-lg border border-white/10 p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading exercise library...</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="glass-card rounded-lg border border-white/10 p-16 text-center">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No exercises found</h3>
          <p className="text-gray-500">Run the SQL migration to populate the exercise library.</p>
        </div>
      ) : viewMode === 'muscle' ? (
        <div className="space-y-4">
          {Object.entries(groupedByMuscle).map(([muscle, exs]) => {
            const muscleInfo = getMuscleInfo(muscle)
            const isExpanded = expandedMuscle === muscle

            return (
              <div key={muscle} className="glass-card rounded-lg border border-white/10 border border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedMuscle(isExpanded ? null : muscle)}
                >
                  <div className={`h-2 bg-gradient-to-r ${muscleInfo.color}`} />
                  <div className="flex items-center gap-4 p-5">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${muscleInfo.color} flex items-center justify-center text-3xl shadow-lg`}>
                      {muscleInfo.icon}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 capitalize">
                        {muscleInfo.label}
                      </h2>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {exs.length} exercise{exs.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {exs.filter(e => e.is_active).length} active
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.from(new Set(exs.map(e => e.equipment))).map(eq => (
                          <span key={eq} className="px-2 py-1 bg-slate-700/50 text-gray-600 text-xs rounded-lg capitalize">
                            {getEquipmentInfo(eq).icon} {eq.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-primary/10' : 'bg-slate-700/50'}`}>
                      {isExpanded ? (
                        <ChevronUp className={`w-6 h-6 ${isExpanded ? 'text-primary' : 'text-gray-400'}`} />
                      ) : (
                        <ChevronDown className={`w-6 h-6 ${isExpanded ? 'text-primary' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exs.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          muscleInfo={muscleInfo}
                          onView={() => setShowViewModal(exercise)}
                          onToggle={() => toggleActive(exercise.id, exercise.is_active)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByEquipment).map(([equipment, exs]) => {
            const eqInfo = getEquipmentInfo(equipment)
            const isExpanded = expandedMuscle === equipment

            return (
              <div key={equipment} className="glass-card rounded-lg border border-white/10 border border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedMuscle(isExpanded ? null : equipment)}
                >
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-3xl shadow-lg">
                      {eqInfo.icon}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 capitalize">
                        {eqInfo.label}
                      </h2>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {exs.length} exercise{exs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.from(new Set(exs.map(e => e.muscle_group))).map(mg => {
                          const mInfo = getMuscleInfo(mg)
                          return (
                            <span key={mg} className={`px-2 py-1 bg-gradient-to-r ${mInfo.color} text-white text-xs rounded-lg`}>
                              {mInfo.icon} {mInfo.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-primary/10' : 'bg-slate-700/50'}`}>
                      {isExpanded ? (
                        <ChevronUp className={`w-6 h-6 ${isExpanded ? 'text-primary' : 'text-gray-400'}`} />
                      ) : (
                        <ChevronDown className={`w-6 h-6 ${isExpanded ? 'text-primary' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exs.map((exercise) => {
                        const muscleInfo = getMuscleInfo(exercise.muscle_group)
                        return (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            muscleInfo={muscleInfo}
                            onView={() => setShowViewModal(exercise)}
                            onToggle={() => toggleActive(exercise.id, exercise.is_active)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && (
        <ExerciseViewModal
          exercise={showViewModal}
          onClose={() => setShowViewModal(null)}
        />
      )}
    </div>
  )
}

function ExerciseCard({ exercise, muscleInfo, onView, onToggle }: { 
  exercise: Exercise
  muscleInfo: { icon: string; color: string; label: string; light: string }
  onView: () => void
  onToggle: () => void 
}) {
  const getDifficultyInfo = (d: number) => {
    const info = [
      { label: 'Beginner', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' },
      { label: 'Easy', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
      { label: 'Intermediate', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50' },
      { label: 'Advanced', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50' },
      { label: 'Expert', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' },
    ]
    return info[d - 1] || info[0]
  }

  const diffInfo = getDifficultyInfo(exercise.difficulty)
  const eqInfo = equipmentTypes.find(e => e.value === exercise.equipment) || { icon: '🏋️', label: exercise.equipment }

  return (
    <div className={`group relative rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg hover:-translate-y-1 ${
      exercise.is_active ? 'border-gray-100 bg-white' : 'border-red-200 bg-red-50/50 opacity-70'
    }`}>
      {/* Colored Header with Icon */}
      <div className={`relative h-28 bg-gradient-to-br ${muscleInfo.color} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative">
          <span className="text-5xl filter drop-shadow-lg">{muscleInfo.icon}</span>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {!exercise.is_active && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-lg shadow">
              Disabled
            </span>
          )}
          {exercise.is_cardio && (
            <span className="px-2 py-1 bg-white/90 text-rose-600 text-xs font-medium rounded-lg flex items-center gap-1 shadow">
              <Flame className="w-3 h-3" /> Cardio
            </span>
          )}
        </div>

        {/* Difficulty Stars */}
        <div className="absolute top-3 right-3 bg-white/90 rounded-lg px-2 py-1 shadow">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= exercise.difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Equipment Badge */}
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-lg shadow capitalize">
            {eqInfo.icon} {exercise.equipment.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{exercise.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[40px]">
          {exercise.description || 'No description available'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${diffInfo.bgLight}`}>
            <span className={`w-2 h-2 rounded-full ${diffInfo.color}`} />
            <span className={`text-xs font-medium ${diffInfo.textColor}`}>{diffInfo.label}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onView}
              className="p-2 bg-slate-700/50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                exercise.is_active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {exercise.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExerciseViewModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const muscleInfo = muscleGroups.find(m => m.value === exercise.muscle_group) || { 
    icon: '💪', color: 'from-gray-500 to-gray-600', label: exercise.muscle_group 
  }
  
  const eqInfo = equipmentTypes.find(e => e.value === exercise.equipment) || { 
    icon: '🏋️', label: exercise.equipment 
  }

  const getDifficultyInfo = (d: number) => {
    const info = [
      { label: 'Beginner', color: 'from-green-400 to-green-600' },
      { label: 'Easy', color: 'from-blue-400 to-blue-600' },
      { label: 'Intermediate', color: 'from-yellow-400 to-yellow-600' },
      { label: 'Advanced', color: 'from-orange-400 to-orange-600' },
      { label: 'Expert', color: 'from-red-400 to-red-600' },
    ]
    return info[d - 1] || info[0]
  }

  const diffInfo = getDifficultyInfo(exercise.difficulty)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-lg border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header with Gradient */}
        <div className={`relative h-56 bg-gradient-to-br ${muscleInfo.color} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Large Icon */}
          <div className="relative z-10 text-center">
            <span className="text-8xl filter drop-shadow-2xl">{muscleInfo.icon}</span>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 bg-gradient-to-r ${diffInfo.color} text-white text-sm font-medium rounded-full`}>
                {diffInfo.label}
              </span>
              {exercise.is_cardio && (
                <span className="px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full flex items-center gap-1">
                  <Flame className="w-4 h-4" /> Cardio
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-white">{exercise.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full capitalize">
                {muscleInfo.icon} {muscleInfo.label}
              </span>
              <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full capitalize">
                {eqInfo.icon} {exercise.equipment.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-14rem)]">
          <p className="text-gray-600 text-lg leading-relaxed">{exercise.description}</p>

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                How to Perform
              </h3>
              <div className="space-y-3">
                {exercise.instructions.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start glass-subtle rounded-xl p-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {i + 1}
                    </span>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exercise.tips && exercise.tips.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                Pro Tips
              </h3>
              <div className="grid gap-3">
                {exercise.tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start bg-green-50 rounded-xl p-4 border border-green-100">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Stars */}
          <div className="mt-8 flex items-center gap-4 p-4 glass-subtle rounded-xl">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Difficulty:</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= exercise.difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className={`ml-2 px-3 py-1 bg-gradient-to-r ${diffInfo.color} text-white text-sm font-medium rounded-full`}>
              {diffInfo.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
