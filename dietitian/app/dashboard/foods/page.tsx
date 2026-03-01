'use client'

import { useEffect, useState } from 'react'
import { 
  Apple, 
  Plus, 
  Search,
  X,
  Loader2,
  Save,
  Edit2,
  Flame
} from 'lucide-react'
import { searchFoods, addFood } from '@/lib/edge-functions'
import type { Food } from '@/lib/supabase'

// Must match food_category enum in database
const FOOD_CATEGORIES = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'protein', label: 'Protein' },
  { value: 'grains', label: 'Grains & Carbohydrates' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruits' },
  { value: 'fats', label: 'Fats & Oils' },
  { value: 'nuts', label: 'Nuts & Seeds' },
  { value: 'legumes', label: 'Legumes' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'snack', label: 'Snacks' },
  { value: 'condiment', label: 'Condiments' },
  { value: 'prepared', label: 'Prepared Foods' },
  { value: 'other', label: 'Other' },
]

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    category: 'other',
    calories_per_serving: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    fiber_g: '',
    sugar_g: '',
    sodium_mg: '',
    serving_size: '100',
    serving_unit: 'g'
  })

  useEffect(() => {
    loadFoods()
  }, [searchQuery, selectedCategory])

  async function loadFoods() {
    setLoading(true)
    try {
      const { data } = await searchFoods(
        searchQuery || undefined, 
        selectedCategory || undefined, 
        50
      )
      if (data) {
        setFoods(data as Food[])
      }
    } catch (error) {
      console.error('Error loading foods:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const foodData: any = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        description: formData.description || null,
        category: formData.category,
        serving_size: parseFloat(formData.serving_size) || 100,
        serving_unit: formData.serving_unit || 'g'
      }

      // Add numeric fields if provided
      if (formData.calories_per_serving) foodData.calories_per_serving = parseFloat(formData.calories_per_serving)
      if (formData.protein_g) foodData.protein_g = parseFloat(formData.protein_g)
      if (formData.carbs_g) foodData.carbs_g = parseFloat(formData.carbs_g)
      if (formData.fat_g) foodData.fat_g = parseFloat(formData.fat_g)
      if (formData.fiber_g) foodData.fiber_g = parseFloat(formData.fiber_g)
      if (formData.sugar_g) foodData.sugar_g = parseFloat(formData.sugar_g)
      if (formData.sodium_mg) foodData.sodium_mg = parseFloat(formData.sodium_mg)

      const { data, error } = await addFood(foodData)

      if (error) {
        alert('Error: ' + error)
        return
      }

      // Reload and close form
      await loadFoods()
      setShowForm(false)
      resetForm()
    } catch (error) {
      console.error('Error saving food:', error)
      alert('Failed to save food')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      category: 'other',
      calories_per_serving: '',
      protein_g: '',
      carbs_g: '',
      fat_g: '',
      fiber_g: '',
      sugar_g: '',
      sodium_mg: '',
      serving_size: '100',
      serving_unit: 'g'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header - flipbook cover style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 p-8 text-amber-50 paper-stack">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-400/10 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-600/30 rounded-2xl border border-amber-500/30">
              <Apple className="w-10 h-10 text-amber-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Food Database</h1>
              <p className="text-amber-100/90">Manage foods and nutritional information</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-amber-600/40 hover:bg-amber-600/50 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-amber-500/30"
          >
            <Plus className="w-5 h-5" />
            Add Food
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            className="w-full pl-12 pr-4 py-3 bg-paper border border-amber-900/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-ink placeholder-ink-muted"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-paper border border-amber-900/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-ink"
        >
          <option value="">All Categories</option>
          {FOOD_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Foods Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : foods.length === 0 ? (
        <div className="page-card rounded-2xl p-16 text-center paper-stack">
          <Apple className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink mb-2">No foods found</h3>
          <p className="text-ink-muted">
            {searchQuery || selectedCategory ? 'Try different search criteria' : 'Start by adding foods to the database'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => (
            <div 
              key={food.id}
              className="page-card rounded-2xl p-6 card-hover paper-stack"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-ink">{food.name}</h3>
                  {food.name_ar && (
                    <p className="text-sm text-ink-muted mt-0.5">{food.name_ar}</p>
                  )}
                  <span className="inline-block px-2 py-1 bg-amber-900/10 text-ink-muted text-xs rounded-lg mt-2">
                    {FOOD_CATEGORIES.find(c => c.value === food.category)?.label || food.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 rounded-lg">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">
                    {food.calories_per_serving || 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-primary/10 rounded-lg">
                  <p className="text-xs text-primary">Protein</p>
                  <p className="font-semibold text-ink">{food.protein_g || 0}g</p>
                </div>
                <div className="text-center p-2 bg-amber-100 rounded-lg">
                  <p className="text-xs text-amber-700">Carbs</p>
                  <p className="font-semibold text-ink">{food.carbs_g || 0}g</p>
                </div>
                <div className="text-center p-2 bg-amber-200/50 rounded-lg">
                  <p className="text-xs text-amber-800">Fat</p>
                  <p className="font-semibold text-ink">{food.fat_g || 0}g</p>
                </div>
              </div>

              <p className="text-xs text-ink-muted mt-3 text-center">
                Per {food.serving_size}{food.serving_unit}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Food Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-paper-light rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto paper-stack border border-amber-900/20">
            <div className="sticky top-0 bg-paper-light p-6 border-b border-amber-900/10 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-ink">Add New Food</h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="p-2 hover:bg-amber-900/10 rounded-xl transition-colors text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-900/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-paper text-ink"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-900/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-paper text-ink"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-900/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-paper text-ink"
                >
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Nutrition Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Nutrition (per 100g)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.calories_per_serving}
                      onChange={(e) => setFormData({ ...formData, calories_per_serving: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.protein_g}
                      onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.carbs_g}
                      onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fat_g}
                      onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fiber_g}
                      onChange={(e) => setFormData({ ...formData, fiber_g: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sugar (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.sugar_g}
                      onChange={(e) => setFormData({ ...formData, sugar_g: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sodium (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.sodium_mg}
                      onChange={(e) => setFormData({ ...formData, sodium_mg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Serving Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                  <input
                    type="number"
                    value={formData.serving_size}
                    onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.serving_unit}
                    onChange={(e) => setFormData({ ...formData, serving_unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="cup">Cup</option>
                    <option value="tbsp">Tablespoon</option>
                    <option value="tsp">Teaspoon</option>
                    <option value="piece">Piece</option>
                    <option value="slice">Slice</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Food
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
