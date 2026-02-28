'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Utensils, 
  Plus, 
  User,
  Clock,
  Flame,
  X,
  Loader2,
  Save,
  Coffee,
  Sun,
  Moon,
  Apple,
  Calendar,
  Edit2,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  CheckCircle2,
  Circle,
  CalendarDays,
  CalendarRange,
  BarChart3,
  Target
} from 'lucide-react'
import { 
  getMyClients, 
  getClientDietPlans, 
  createDietPlan, 
  updateDietPlan,
  deleteDietPlan,
  addMealToPlan, 
  searchFoods, 
  addItemToMeal,
  deleteMeal,
  deleteMealItem,
  getMealCommitments,
  calculateDayTotals,
  calculatePlanTotals
} from '@/lib/edge-functions'
import { formatDate, getMealTypeLabel, getMealTypeTime } from '@/lib/utils'
import type { DietPlan, Food, DietPlanMeal } from '@/lib/supabase'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee, time: '08:00', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  { value: 'morning_snack', label: 'Morning Snack', icon: Apple, time: '10:30', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  { value: 'lunch', label: 'Lunch', icon: Sun, time: '13:00', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { value: 'afternoon_snack', label: 'Afternoon Snack', icon: Apple, time: '16:00', color: 'bg-lime-100 text-lime-700', border: 'border-lime-200' },
  { value: 'dinner', label: 'Dinner', icon: Moon, time: '19:00', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
  { value: 'evening_snack', label: 'Evening Snack', icon: Apple, time: '21:00', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
]

// Extra meal type for client-added meals
const EXTRA_MEAL_TYPE = { value: 'extra', label: 'Extra Meal', icon: PartyPopper, time: '12:00', color: 'bg-rose-100 text-rose-700', border: 'border-rose-200' }

// All meal types including extra for the dropdown
const ALL_MEAL_TYPES = [...MEAL_TYPES, EXTRA_MEAL_TYPE]

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function DietPlansPage() {
  const searchParams = useSearchParams()
  const preselectedClient = searchParams.get('client')
  
  // Core state
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>(preselectedClient || '')
  const [selectedClientData, setSelectedClientData] = useState<any>(null)
  const [plans, setPlans] = useState<DietPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Modal states
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [showEditPlan, setShowEditPlan] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  // Selection state
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<DietPlanMeal | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [viewMonth, setViewMonth] = useState(new Date())
  
  // Commitments state
  const [commitments, setCommitments] = useState<Record<string, boolean>>({})
  
  // Food search
  const [foodSearch, setFoodSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [itemForm, setItemForm] = useState({
    food_id: '',
    custom_item_name: '',
    quantity: '1',
    unit: 'serving',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: ''
  })

  // Plan form
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    plan_type: 'weekly' as 'weekly' | 'monthly',
    start_date: '',
    end_date: '',
    target_calories: '',
    target_protein_g: '',
    target_carbs_g: '',
    target_fat_g: '',
    cheat_days: [] as string[],
    notes: ''
  })

  // Meal form
  const [mealForm, setMealForm] = useState({
    meal_type: 'breakfast',
    scheduled_time: '08:00',
    day_number: 1,
    name: '',
    notes: ''
  })

  // Load clients
  useEffect(() => {
    async function loadClients() {
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
    loadClients()
  }, [])

  // Load plans when client changes
  useEffect(() => {
    if (selectedClient) {
      loadClientPlans()
      const client = clients.find(c => c.id === selectedClient)
      setSelectedClientData(client)
    } else {
      setPlans([])
      setSelectedClientData(null)
    }
  }, [selectedClient, clients])

  async function loadClientPlans() {
    setLoading(true)
    try {
      const { data } = await getClientDietPlans(selectedClient)
      if (data) {
        setPlans(data)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate plan duration in days
  function getPlanDays(plan: DietPlan): number {
    if (!plan.start_date || !plan.end_date) return 7
    const start = new Date(plan.start_date)
    const end = new Date(plan.end_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  // Get meals for a specific day
  function getMealsForDay(plan: DietPlan, dayNumber: number): DietPlanMeal[] {
    if (!plan.meals) return []
    return plan.meals.filter(m => (m.day_number || 1) === dayNumber)
  }

  // Get date for a specific day number
  function getDateForDay(plan: DietPlan, dayNumber: number): Date {
    const start = new Date(plan.start_date)
    start.setDate(start.getDate() + dayNumber - 1)
    return start
  }

  // Check if a date is a cheat day
  function isCheatDay(plan: DietPlan, dayNumber: number): boolean {
    if (!plan.cheat_days) return false
    const date = getDateForDay(plan, dayNumber)
    const dateStr = date.toISOString().split('T')[0]
    return plan.cheat_days.includes(dateStr)
  }

  // Calculate totals for a day
  function getDayTotals(meals: DietPlanMeal[]) {
    return calculateDayTotals(meals)
  }

  // Calculate plan totals
  function getPlanSummary(plan: DietPlan) {
    return calculatePlanTotals(plan)
  }

  // Format date string
  function formatDateString(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Toggle cheat day in form
  function toggleCheatDay(dateStr: string) {
    setPlanForm(prev => {
      const cheatDays = prev.cheat_days || []
      if (cheatDays.includes(dateStr)) {
        return { ...prev, cheat_days: cheatDays.filter(d => d !== dateStr) }
      } else {
        return { ...prev, cheat_days: [...cheatDays, dateStr] }
      }
    })
  }

  // Initialize form for creating plan
  function initCreatePlan(type: 'weekly' | 'monthly') {
    const now = new Date()
    let startDate: Date, endDate: Date, name: string
    
    if (type === 'weekly') {
      // Start from next Sunday
      const dayOfWeek = now.getDay()
      startDate = new Date(now)
      startDate.setDate(now.getDate() + (7 - dayOfWeek))
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      name = `Week ${Math.ceil(startDate.getDate() / 7)} - ${MONTHS[startDate.getMonth()]} ${startDate.getFullYear()}`
    } else {
      // Start from 1st of next month
      startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      name = `${MONTHS[startDate.getMonth()]} ${startDate.getFullYear()} Diet Plan`
    }
    
    setPlanForm({
      name,
      description: '',
      plan_type: type,
      start_date: formatDateString(startDate),
      end_date: formatDateString(endDate),
      target_calories: '2000',
      target_protein_g: '150',
      target_carbs_g: '200',
      target_fat_g: '65',
      cheat_days: [],
      notes: ''
    })
    setViewMonth(startDate)
    setShowCreatePlan(true)
  }

  // Initialize form for editing
  function initEditPlan(plan: DietPlan) {
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      plan_type: plan.plan_type || 'weekly',
      start_date: plan.start_date,
      end_date: plan.end_date || '',
      target_calories: plan.target_calories?.toString() || '',
      target_protein_g: plan.target_protein_g?.toString() || '',
      target_carbs_g: plan.target_carbs_g?.toString() || '',
      target_fat_g: plan.target_fat_g?.toString() || '',
      cheat_days: plan.cheat_days || [],
      notes: plan.notes || ''
    })
    setSelectedPlan(plan)
    setViewMonth(new Date(plan.start_date))
    setShowEditPlan(true)
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) return

    setSaving(true)
    try {
      const plan: any = {
        client_id: selectedClient,
        name: planForm.name,
        description: planForm.description || null,
        plan_type: planForm.plan_type,
        start_date: planForm.start_date,
        end_date: planForm.end_date || null,
        status: 'draft',
        target_calories: planForm.target_calories ? parseInt(planForm.target_calories) : null,
        target_protein_g: planForm.target_protein_g ? parseInt(planForm.target_protein_g) : null,
        target_carbs_g: planForm.target_carbs_g ? parseInt(planForm.target_carbs_g) : null,
        target_fat_g: planForm.target_fat_g ? parseInt(planForm.target_fat_g) : null,
        cheat_days: planForm.cheat_days.length > 0 ? planForm.cheat_days : null,
        notes: planForm.notes || null
      }

      const { error } = await createDietPlan(plan)
      
      if (error) {
        alert('Error: ' + error)
        return
      }

      await loadClientPlans()
      setShowCreatePlan(false)
      resetPlanForm()
    } catch (error) {
      console.error('Error creating plan:', error)
      alert('Failed to create plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePlan(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlan) return

    setSaving(true)
    try {
      const updates: any = {
        name: planForm.name,
        description: planForm.description || null,
        plan_type: planForm.plan_type,
        start_date: planForm.start_date,
        end_date: planForm.end_date || null,
        target_calories: planForm.target_calories ? parseInt(planForm.target_calories) : null,
        target_protein_g: planForm.target_protein_g ? parseInt(planForm.target_protein_g) : null,
        target_carbs_g: planForm.target_carbs_g ? parseInt(planForm.target_carbs_g) : null,
        target_fat_g: planForm.target_fat_g ? parseInt(planForm.target_fat_g) : null,
        cheat_days: planForm.cheat_days.length > 0 ? planForm.cheat_days : null,
        notes: planForm.notes || null
      }

      const { error } = await updateDietPlan(selectedPlan.id, updates)
      
      if (error) {
        alert('Error: ' + error)
        return
      }

      await loadClientPlans()
      setShowEditPlan(false)
      setSelectedPlan(null)
      resetPlanForm()
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Failed to update plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePlan(planId: string) {
    setSaving(true)
    try {
      const { error } = await deleteDietPlan(planId)
      if (error) {
        alert('Error: ' + error)
        return
      }
      await loadClientPlans()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Failed to delete plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(plan: DietPlan, newStatus: string) {
    setSaving(true)
    try {
      await updateDietPlan(plan.id, { status: newStatus as any })
      await loadClientPlans()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlan) return

    setSaving(true)
    try {
      const meal = {
        meal_type: mealForm.meal_type,
        scheduled_time: mealForm.scheduled_time,
        day_number: mealForm.day_number,
        name: mealForm.name || getMealTypeLabel(mealForm.meal_type),
        notes: mealForm.notes || null
      }

      const { error } = await addMealToPlan(selectedPlan.id, meal)
      
      if (error) {
        alert('Error: ' + error)
        return
      }

      const { data: updatedPlans } = await getClientDietPlans(selectedClient)
      if (updatedPlans) {
        setPlans(updatedPlans)
        const updated = updatedPlans.find(p => p.id === selectedPlan.id)
        if (updated) setSelectedPlan(updated)
      }
      
      setShowAddMeal(false)
      resetMealForm()
    } catch (error) {
      console.error('Error adding meal:', error)
      alert('Failed to add meal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMeal(mealId: string) {
    if (!confirm('Delete this meal?')) return
    
    setSaving(true)
    try {
      const { error } = await deleteMeal(mealId)
      if (error) {
        alert('Error deleting meal: ' + error)
        return
      }
      
      // Refresh plans and update selected plan
      const { data: updatedPlans } = await getClientDietPlans(selectedClient)
      if (updatedPlans) {
        setPlans(updatedPlans)
        if (selectedPlan) {
          const updated = updatedPlans.find(p => p.id === selectedPlan.id)
          if (updated) setSelectedPlan(updated)
        }
      }
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('Failed to delete meal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Delete this food item?')) return
    
    setSaving(true)
    try {
      const { error } = await deleteMealItem(itemId)
      if (error) {
        alert('Error deleting item: ' + error)
        return
      }
      
      // Refresh plans and update selected plan
      const { data: updatedPlans } = await getClientDietPlans(selectedClient)
      if (updatedPlans) {
        setPlans(updatedPlans)
        if (selectedPlan) {
          const updated = updatedPlans.find(p => p.id === selectedPlan.id)
          if (updated) setSelectedPlan(updated)
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setSaving(false)
    }
  }

  async function handleSearchFoods(query: string) {
    setFoodSearch(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setSearchLoading(true)
    try {
      const { data } = await searchFoods(query)
      if (data) setSearchResults(data)
    } catch (error) {
      console.error('Error searching foods:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  function selectFood(food: Food) {
    setItemForm({
      ...itemForm,
      food_id: food.id,
      custom_item_name: food.name,
      calories: food.calories_per_serving?.toString() || '',
      protein_g: food.protein_g?.toString() || '',
      carbs_g: food.carbs_g?.toString() || '',
      fat_g: food.fat_g?.toString() || ''
    })
    setFoodSearch(food.name)
    setSearchResults([])
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMeal) return

    setSaving(true)
    try {
      const item: any = {
        quantity: parseFloat(itemForm.quantity) || 1,
        unit: itemForm.unit || 'serving'
      }

      if (itemForm.food_id) {
        item.food_id = itemForm.food_id
      } else if (itemForm.custom_item_name) {
        item.custom_item_name = itemForm.custom_item_name
      } else {
        alert('Please select a food or enter a custom item name')
        setSaving(false)
        return
      }

      if (itemForm.calories) item.calories = parseInt(itemForm.calories)
      if (itemForm.protein_g) item.protein_g = parseFloat(itemForm.protein_g)
      if (itemForm.carbs_g) item.carbs_g = parseFloat(itemForm.carbs_g)
      if (itemForm.fat_g) item.fat_g = parseFloat(itemForm.fat_g)

      const { error } = await addItemToMeal(selectedMeal.id, item)
      
      if (error) {
        alert('Error: ' + error)
        return
      }

      const { data: updatedPlans } = await getClientDietPlans(selectedClient)
      if (updatedPlans) {
        setPlans(updatedPlans)
        if (selectedPlan) {
          const updated = updatedPlans.find(p => p.id === selectedPlan.id)
          if (updated) setSelectedPlan(updated)
        }
      }
      
      setShowAddItem(false)
      resetItemForm()
      setSelectedMeal(null)
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  function resetPlanForm() {
    setPlanForm({
      name: '',
      description: '',
      plan_type: 'weekly',
      start_date: '',
      end_date: '',
      target_calories: '',
      target_protein_g: '',
      target_carbs_g: '',
      target_fat_g: '',
      cheat_days: [],
      notes: ''
    })
  }

  function resetMealForm() {
    setMealForm({
      meal_type: 'breakfast',
      scheduled_time: '08:00',
      day_number: selectedDay,
      name: '',
      notes: ''
    })
  }

  function resetItemForm() {
    setItemForm({
      food_id: '',
      custom_item_name: '',
      quantity: '1',
      unit: 'serving',
      calories: '',
      protein_g: '',
      carbs_g: '',
      fat_g: ''
    })
    setFoodSearch('')
    setSearchResults([])
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'paused': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Professional Print Function
  function handlePrintPlan(plan: DietPlan) {
    const clientName = selectedClientData?.full_name || 'Client'
    const planDays = getPlanDays(plan)
    const summary = getPlanSummary(plan)
    
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      alert('Please allow popups to print the plan')
      return
    }

    // Meal type colors for print
    const mealColors: Record<string, { bg: string; text: string }> = {
      breakfast: { bg: '#fef3c7', text: '#b45309' },
      morning_snack: { bg: '#dcfce7', text: '#15803d' },
      lunch: { bg: '#ffedd5', text: '#c2410c' },
      afternoon_snack: { bg: '#ecfccb', text: '#4d7c0f' },
      dinner: { bg: '#e0e7ff', text: '#4338ca' },
      evening_snack: { bg: '#f3e8ff', text: '#7c3aed' },
      extra: { bg: '#ffe4e6', text: '#be123c' }
    }

    // Generate days HTML with full schedule
    let daysHtml = ''
    for (let day = 1; day <= planDays; day++) {
      const dayMeals = getMealsForDay(plan, day)
      const dayDate = getDateForDay(plan, day)
      const isCheat = isCheatDay(plan, day)
      const dayTotals = getDayTotals(dayMeals)
      
      // Generate meal slots for all standard meal types
      const mealSlotsHtml = MEAL_TYPES.map(mealType => {
        const existingMeal = dayMeals.find(m => m.meal_type === mealType.value)
        const colors = mealColors[mealType.value] || { bg: '#f9fafb', text: '#374151' }
        
        if (existingMeal) {
          const mealTotals = existingMeal.items ? getDayTotals([existingMeal]) : { calories: existingMeal.total_calories || 0 }
          const itemsHtml = (existingMeal.items || []).map(item => `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;">
              <span>• ${item.food?.name || item.custom_item_name || 'Item'}</span>
              <span style="color: #6b7280;">${item.calories || 0} cal</span>
            </div>
          `).join('')

          return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${colors.bg};">
                <div>
                  <strong style="color: ${colors.text};">${mealType.label}</strong>
                  <span style="color: #6b7280; font-size: 11px; margin-left: 8px;">${mealType.time}</span>
                </div>
                <strong style="color: ${colors.text};">${mealTotals.calories} kcal</strong>
              </div>
              <div style="padding: 8px 12px; background: white;">
                ${itemsHtml || '<span style="color: #9ca3af; font-style: italic; font-size: 12px;">No items</span>'}
              </div>
            </div>
          `
        } else {
          return `
            <div style="border: 1px dashed #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 8px; background: #fafafa;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #9ca3af;">${mealType.label}</span>
                <span style="color: #d1d5db; font-size: 11px;">${mealType.time}</span>
              </div>
            </div>
          `
        }
      }).join('')

      // Get extra meals
      const extraMeals = dayMeals.filter(m => m.meal_type === 'extra' || !MEAL_TYPES.find(t => t.value === m.meal_type))
      const extraMealsHtml = extraMeals.length > 0 ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #fecaca;">
          <p style="font-size: 11px; color: #be123c; margin-bottom: 8px; font-weight: bold;">🎉 Extra/Cheat Meals:</p>
          ${extraMeals.map(meal => {
            const mealTotals = meal.items ? getDayTotals([meal]) : { calories: meal.total_calories || 0 }
            return `
              <div style="background: #fff1f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #be123c; font-weight: bold;">${meal.name || 'Extra Meal'}</span>
                  <span style="color: #be123c;">${mealTotals.calories} kcal</span>
                </div>
                ${(meal.items || []).map(item => `
                  <div style="font-size: 11px; color: #6b7280;">• ${item.food?.name || item.custom_item_name}</div>
                `).join('')}
              </div>
            `
          }).join('')}
        </div>
      ` : ''

      daysHtml += `
        <div style="page-break-inside: avoid; margin-bottom: 20px; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: ${isCheat ? '#fef2f2' : 'linear-gradient(to right, #f8fafc, #f1f5f9)'}; border-bottom: 2px solid #e5e7eb;">
            <div>
              <strong style="font-size: 16px;">Day ${day} - ${DAYS_OF_WEEK[dayDate.getDay()]}</strong>
              <span style="color: #6b7280; margin-left: 12px;">${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              ${isCheat ? '<span style="margin-left: 12px; padding: 2px 8px; background: #fecaca; color: #dc2626; border-radius: 9999px; font-size: 11px;">🎉 CHEAT DAY</span>' : ''}
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 18px;">${dayTotals.calories} kcal</strong>
              <p style="font-size: 11px; color: #6b7280;">P:${Math.round(dayTotals.protein)}g | C:${Math.round(dayTotals.carbs)}g | F:${Math.round(dayTotals.fat)}g</p>
            </div>
          </div>
          <div style="padding: 16px;">
            ${mealSlotsHtml}
            ${extraMealsHtml}
          </div>
        </div>
      `
    }

    // Commitment tracking section for client
    const commitmentSection = `
      <div style="page-break-before: always; margin-top: 30px;">
        <h2 style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Daily Commitment Tracker</h2>
        <p style="color: #6b7280; margin-bottom: 16px;">Check the box for each day you complete all your meals as planned.</p>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
          ${Array.from({ length: planDays }, (_, i) => {
            const date = getDateForDay(plan, i + 1)
            const isCheat = isCheatDay(plan, i + 1)
            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; text-align: center; ${isCheat ? 'background: #fef2f2;' : ''}">
                <div style="font-size: 11px; color: #6b7280;">${DAYS_SHORT[date.getDay()]}</div>
                <div style="font-weight: bold;">${date.getDate()}</div>
                <div style="margin-top: 8px; width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 4px; margin: 8px auto 0;"></div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${plan.name} - ${clientName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; font-size: 14px; }
            @media print { body { padding: 0; } @page { margin: 1.5cm; size: A4; } }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #10b981;">
            <h1 style="color: #10b981; margin-bottom: 4px;">SweatBox Nutrition</h1>
            <p style="color: #6b7280;">Personalized Diet Plan</p>
          </div>
          
          <!-- Plan Info -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 12px;">
            <div>
              <h2 style="margin-bottom: 4px;">${plan.name}</h2>
              <p style="color: #6b7280;">Prepared for: <strong>${clientName}</strong></p>
              <p style="color: #6b7280; font-size: 13px;">
                ${new Date(plan.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
                ${plan.end_date ? new Date(plan.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                (${planDays} days)
              </p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Daily Targets</p>
              <p style="font-size: 20px; font-weight: bold;">${plan.target_calories || 0} kcal</p>
              <p style="font-size: 12px;">
                <span style="color: #2563eb;">P: ${plan.target_protein_g || 0}g</span> | 
                <span style="color: #d97706;">C: ${plan.target_carbs_g || 0}g</span> | 
                <span style="color: #dc2626;">F: ${plan.target_fat_g || 0}g</span>
              </p>
            </div>
          </div>

          ${plan.description ? `<p style="padding: 12px; background: #fefce8; border-radius: 8px; margin-bottom: 20px;">${plan.description}</p>` : ''}

          <!-- Plan Summary -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="text-align: center; padding: 16px; background: #ecfdf5; border-radius: 12px;">
              <p style="font-size: 24px; font-weight: bold; color: #059669;">${summary.totalCalories.toLocaleString()}</p>
              <p style="font-size: 12px; color: #6b7280;">Total Calories</p>
            </div>
            <div style="text-align: center; padding: 16px; background: #eff6ff; border-radius: 12px;">
              <p style="font-size: 24px; font-weight: bold; color: #2563eb;">${Math.round(summary.totalProtein)}g</p>
              <p style="font-size: 12px; color: #6b7280;">Total Protein</p>
            </div>
            <div style="text-align: center; padding: 16px; background: #fffbeb; border-radius: 12px;">
              <p style="font-size: 24px; font-weight: bold; color: #d97706;">${Math.round(summary.totalCarbs)}g</p>
              <p style="font-size: 12px; color: #6b7280;">Total Carbs</p>
            </div>
            <div style="text-align: center; padding: 16px; background: #fef2f2; border-radius: 12px;">
              <p style="font-size: 24px; font-weight: bold; color: #dc2626;">${Math.round(summary.totalFat)}g</p>
              <p style="font-size: 12px; color: #6b7280;">Total Fat</p>
            </div>
          </div>

          ${(plan.cheat_days || []).length > 0 ? `
            <div style="margin-bottom: 20px; padding: 12px; background: #fef2f2; border-radius: 8px;">
              <strong style="color: #dc2626;">🎉 Cheat Days:</strong> 
              ${plan.cheat_days?.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })).join(', ')}
            </div>
          ` : ''}

          <!-- Daily Plans -->
          <h2 style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Daily Meal Schedule</h2>
          ${daysHtml}

          ${commitmentSection}

          ${plan.notes ? `
            <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 12px;">
              <h3 style="margin-bottom: 8px;">Notes & Instructions</h3>
              <p style="color: #4b5563;">${plan.notes}</p>
            </div>
          ` : ''}

          <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p>Generated by SweatBox Nutrition on ${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 4px;">Questions? Contact your dietitian.</p>
          </div>

          <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diet Plans</h1>
          <p className="text-gray-500">Create weekly or monthly diet plans with daily schedules</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="flex gap-2">
              <button
                onClick={() => initCreatePlan('weekly')}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <CalendarDays className="w-4 h-4" />
                Weekly
              </button>
              <button
                onClick={() => initCreatePlan('monthly')}
                className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <CalendarRange className="w-4 h-4" />
                Monthly
              </button>
            </div>
          )}
        </div>
      </div>

      {/* No Client Selected */}
      {!selectedClient && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Client</h3>
          <p className="text-gray-500">Choose a client to view or create their diet plans</p>
        </div>
      )}

      {/* Plans List */}
      {selectedClient && (
        <>
          {/* Client Info */}
          {selectedClientData && (
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedClientData.full_name}</h2>
                  <p className="text-white/80">{selectedClientData.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-white/80 text-sm">Diet Plans</p>
                  <p className="text-3xl font-bold">{plans.length}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Diet Plans Yet</h3>
              <p className="text-gray-500 mb-6">Create a weekly or monthly diet plan</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => initCreatePlan('weekly')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 inline-flex items-center gap-2"
                >
                  <CalendarDays className="w-5 h-5" />
                  Create Weekly Plan
                </button>
                <button
                  onClick={() => initCreatePlan('monthly')}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark inline-flex items-center gap-2"
                >
                  <CalendarRange className="w-5 h-5" />
                  Create Monthly Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {plans.map((plan) => {
                const planDays = getPlanDays(plan)
                const summary = getPlanSummary(plan)
                
                return (
                  <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Plan Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${plan.plan_type === 'weekly' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {plan.plan_type === 'weekly' ? 'Weekly' : 'Monthly'}
                            </span>
                            <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                            <select
                              value={plan.status}
                              onChange={(e) => handleStatusChange(plan, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(plan.status)}`}
                            >
                              <option value="draft">Draft</option>
                              <option value="active">Active</option>
                              <option value="paused">Paused</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(plan.start_date)} - {plan.end_date ? formatDate(plan.end_date) : 'Ongoing'}
                              <span className="text-gray-400">({planDays} days)</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {plan.target_calories || 0} kcal/day
                            </span>
                            {(plan.cheat_days || []).length > 0 && (
                              <span className="flex items-center gap-1 text-rose-500">
                                <PartyPopper className="w-4 h-4" />
                                {plan.cheat_days?.length} cheat days
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePrintPlan(plan)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Print Plan"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => initEditPlan(plan)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(plan.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Plan Summary Stats */}
                    <div className="grid grid-cols-5 border-b border-gray-100">
                      <div className="p-4 text-center border-r border-gray-100">
                        <p className="text-2xl font-bold text-emerald-600">{summary.totalCalories.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total Calories</p>
                      </div>
                      <div className="p-4 text-center border-r border-gray-100">
                        <p className="text-2xl font-bold text-blue-600">{Math.round(summary.totalProtein)}g</p>
                        <p className="text-xs text-gray-500">Total Protein</p>
                      </div>
                      <div className="p-4 text-center border-r border-gray-100">
                        <p className="text-2xl font-bold text-amber-600">{Math.round(summary.totalCarbs)}g</p>
                        <p className="text-xs text-gray-500">Total Carbs</p>
                      </div>
                      <div className="p-4 text-center border-r border-gray-100">
                        <p className="text-2xl font-bold text-rose-600">{Math.round(summary.totalFat)}g</p>
                        <p className="text-xs text-gray-500">Total Fat</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-2xl font-bold text-gray-700">{summary.totalMeals}</p>
                        <p className="text-xs text-gray-500">Total Meals</p>
                      </div>
                    </div>

                    {/* Day Tabs */}
                    <div className="border-b border-gray-100 overflow-x-auto">
                      <div className="flex">
                        {Array.from({ length: Math.min(planDays, 14) }, (_, i) => {
                          const dayNum = i + 1
                          const dayMeals = getMealsForDay(plan, dayNum)
                          const isCheat = isCheatDay(plan, dayNum)
                          const dayDate = getDateForDay(plan, dayNum)
                          const isSelected = selectedPlan?.id === plan.id && selectedDay === dayNum
                          
                          return (
                            <button
                              key={dayNum}
                              onClick={() => { setSelectedPlan(plan); setSelectedDay(dayNum) }}
                              className={`flex-shrink-0 px-4 py-3 text-center border-b-2 transition-colors ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-transparent hover:bg-gray-50'
                              } ${isCheat ? 'bg-rose-50' : ''}`}
                            >
                              <p className="text-xs text-gray-500">{DAYS_SHORT[dayDate.getDay()]}</p>
                              <p className={`font-semibold ${isSelected ? 'text-primary' : ''}`}>Day {dayNum}</p>
                              <p className="text-xs text-gray-400">{dayMeals.length} meals</p>
                              {isCheat && <PartyPopper className="w-3 h-3 text-rose-500 mx-auto mt-1" />}
                            </button>
                          )
                        })}
                        {planDays > 14 && (
                          <div className="flex-shrink-0 px-4 py-3 text-center text-gray-400">
                            +{planDays - 14} more days
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Day Content - Full Daily Schedule */}
                    {selectedPlan?.id === plan.id && (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Day {selectedDay} - {DAYS_OF_WEEK[getDateForDay(plan, selectedDay).getDay()]}
                              {isCheatDay(plan, selectedDay) && (
                                <span className="ml-2 px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-full">Cheat Day</span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {getDateForDay(plan, selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Day's Meals - Full Schedule */}
                        {(() => {
                          const dayMeals = getMealsForDay(plan, selectedDay)
                          const dayTotals = getDayTotals(dayMeals)
                          
                          // Get extra meals (client added - not in standard meal types)
                          const standardMealTypes = MEAL_TYPES.map(m => m.value)
                          const extraMeals = dayMeals.filter(m => !standardMealTypes.includes(m.meal_type) || m.meal_type === 'extra')
                          
                          return (
                            <>
                              {/* Day Totals Summary */}
                              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-gray-900">{dayTotals.calories}</p>
                                  <p className="text-xs text-gray-500">Calories</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">{Math.round(dayTotals.protein)}g</p>
                                  <p className="text-xs text-gray-500">Protein</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-amber-600">{Math.round(dayTotals.carbs)}g</p>
                                  <p className="text-xs text-gray-500">Carbs</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-rose-600">{Math.round(dayTotals.fat)}g</p>
                                  <p className="text-xs text-gray-500">Fat</p>
                                </div>
                              </div>

                              {/* Full Daily Meal Schedule - All Slots */}
                              <div className="space-y-4">
                                {MEAL_TYPES.map((mealType) => {
                                  const MealIcon = mealType.icon
                                  const existingMeal = dayMeals.find(m => m.meal_type === mealType.value)
                                  
                                  // Calculate meal totals from items
                                  const mealTotals = existingMeal?.items && existingMeal.items.length > 0 
                                    ? existingMeal.items.reduce((acc, item) => ({
                                        calories: acc.calories + (item.calories || 0),
                                        protein: acc.protein + (item.protein_g || 0),
                                        carbs: acc.carbs + (item.carbs_g || 0),
                                        fat: acc.fat + (item.fat_g || 0)
                                      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
                                    : { calories: existingMeal?.total_calories || 0, protein: 0, carbs: 0, fat: 0 }
                                  
                                  return (
                                    <div key={mealType.value} className={`rounded-xl border-2 ${existingMeal ? mealType.border : 'border-dashed border-gray-200'} overflow-hidden`}>
                                      {/* Meal Header */}
                                      <div className={`flex items-center justify-between p-4 ${existingMeal ? mealType.color.replace('text-', 'bg-').replace('-700', '-50') : 'bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                          <div className={`p-2.5 rounded-xl ${mealType.color}`}>
                                            <MealIcon className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <h4 className="font-bold text-gray-900">{mealType.label}</h4>
                                            <p className="text-sm text-gray-500">{mealType.time}</p>
                                          </div>
                                        </div>
                                        
                                        {existingMeal ? (
                                          <div className="flex items-center gap-4">
                                            <div className="text-right">
                                              <p className="text-lg font-bold text-gray-900">{mealTotals.calories} kcal</p>
                                              <p className="text-xs text-gray-500">
                                                P: {Math.round(mealTotals.protein || 0)}g | C: {Math.round(mealTotals.carbs || 0)}g | F: {Math.round(mealTotals.fat || 0)}g
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => handleDeleteMeal(existingMeal.id)}
                                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => { 
                                              setMealForm({ 
                                                meal_type: mealType.value, 
                                                scheduled_time: mealType.time, 
                                                day_number: selectedDay,
                                                name: mealType.label,
                                                notes: ''
                                              }); 
                                              setShowAddMeal(true) 
                                            }}
                                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
                                          >
                                            <Plus className="w-4 h-4" />
                                            Add {mealType.label}
                                          </button>
                                        )}
                                      </div>
                                      
                                      {/* Meal Content - Food Items */}
                                      {existingMeal && (
                                        <div className="p-4 bg-white">
                                          {existingMeal.items && existingMeal.items.length > 0 ? (
                                            <div className="space-y-2">
                                              {existingMeal.items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg group">
                                                  <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                    <span className="font-medium text-gray-800">{item.food?.name || item.custom_item_name}</span>
                                                    <span className="text-sm text-gray-400">{item.quantity} {item.unit}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-gray-600">{item.calories || 0} cal</span>
                                                    <span className="text-blue-600">P: {item.protein_g || 0}g</span>
                                                    <span className="text-amber-600">C: {item.carbs_g || 0}g</span>
                                                    <span className="text-rose-600">F: {item.fat_g || 0}g</span>
                                                    <button
                                                      onClick={() => handleDeleteItem(item.id)}
                                                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      title="Delete item"
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-center text-gray-400 py-2 italic">No food items added yet</p>
                                          )}
                                          
                                          <button
                                            onClick={() => { setSelectedMeal(existingMeal); setShowAddItem(true) }}
                                            className="mt-3 w-full py-2.5 text-sm text-primary bg-primary/5 hover:bg-primary/10 rounded-lg font-medium flex items-center justify-center gap-2 border border-primary/20"
                                          >
                                            <Plus className="w-4 h-4" />
                                            Add Food Item
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}

                                {/* Extra/Cheat Meals Section - Client Added */}
                                <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <PartyPopper className="w-5 h-5 text-rose-500" />
                                      <h4 className="font-bold text-gray-900">Extra Meals / Cheat Foods</h4>
                                      <span className="text-sm text-gray-500">(Client added)</span>
                                    </div>
                                    <button
                                      onClick={() => { 
                                        setMealForm({ 
                                          meal_type: 'extra', 
                                          scheduled_time: '12:00', 
                                          day_number: selectedDay,
                                          name: 'Extra Meal',
                                          notes: ''
                                        }); 
                                        setShowAddMeal(true) 
                                      }}
                                      className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-medium hover:bg-rose-100 flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Log Extra Meal
                                    </button>
                                  </div>
                                  
                                  {extraMeals.length > 0 ? (
                                    <div className="space-y-3">
                                      {extraMeals.map((meal) => {
                                        const mealTotals = meal.items ? getDayTotals([meal]) : { calories: meal.total_calories || 0 }
                                        return (
                                          <div key={meal.id} className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/50">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                                                  <PartyPopper className="w-5 h-5" />
                                                </div>
                                                <div>
                                                  <p className="font-semibold text-gray-900">{meal.name || 'Extra Meal'}</p>
                                                  <p className="text-xs text-gray-500">{meal.scheduled_time?.slice(0, 5) || 'No time set'}</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="font-bold text-rose-600">{mealTotals.calories} kcal</span>
                                                <button
                                                  onClick={() => handleDeleteMeal(meal.id)}
                                                  className="p-1.5 text-gray-400 hover:text-red-500"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                            
                                            {meal.items && meal.items.length > 0 ? (
                                              <div className="space-y-1">
                                                {meal.items.map((item) => (
                                                  <div key={item.id} className="flex items-center justify-between text-sm py-1 group">
                                                    <span className="text-gray-700">{item.food?.name || item.custom_item_name}</span>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-gray-500">{item.calories || 0} cal</span>
                                                      <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-400 italic">No items</p>
                                            )}
                                            
                                            <button
                                              onClick={() => { setSelectedMeal(meal); setShowAddItem(true) }}
                                              className="mt-3 w-full py-2 text-sm text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-lg flex items-center justify-center gap-1"
                                            >
                                              <Plus className="w-4 h-4" />
                                              Add Food
                                            </button>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                      <PartyPopper className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                      <p className="text-gray-500 text-sm">No extra meals logged for this day</p>
                                      <p className="text-gray-400 text-xs mt-1">Clients can log any extra food they ate here</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Diet Plan?</h3>
            <p className="text-gray-500 mb-6">This will permanently delete this plan and all its meals.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => handleDeletePlan(deleteConfirm)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {(showCreatePlan || showEditPlan) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {showEditPlan ? 'Edit Diet Plan' : `Create ${planForm.plan_type === 'weekly' ? 'Weekly' : 'Monthly'} Plan`}
                </h2>
              </div>
              <button onClick={() => { setShowCreatePlan(false); setShowEditPlan(false); resetPlanForm(); setSelectedPlan(null) }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showEditPlan ? handleUpdatePlan : handleCreatePlan} className="p-6 space-y-6">
              {/* Plan Type Toggle */}
              {!showEditPlan && (
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => initCreatePlan('weekly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${planForm.plan_type === 'weekly' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                  >
                    <CalendarDays className="w-4 h-4 inline mr-2" />
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => initCreatePlan('monthly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${planForm.plan_type === 'monthly' ? 'bg-white shadow text-emerald-600' : 'text-gray-600'}`}
                  >
                    <CalendarRange className="w-4 h-4 inline mr-2" />
                    Monthly
                  </button>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={planForm.start_date}
                    onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={planForm.end_date}
                    onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Daily Targets */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Daily Targets</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input type="number" value={planForm.target_calories} onChange={(e) => setPlanForm({ ...planForm, target_calories: e.target.value })} placeholder="2000" className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input type="number" value={planForm.target_protein_g} onChange={(e) => setPlanForm({ ...planForm, target_protein_g: e.target.value })} placeholder="150" className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input type="number" value={planForm.target_carbs_g} onChange={(e) => setPlanForm({ ...planForm, target_carbs_g: e.target.value })} placeholder="200" className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input type="number" value={planForm.target_fat_g} onChange={(e) => setPlanForm({ ...planForm, target_fat_g: e.target.value })} placeholder="65" className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Cheat Days */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-rose-500" />
                  Cheat Days <span className="text-sm font-normal text-gray-500">(click dates to toggle)</span>
                </h3>
                
                {planForm.start_date && planForm.end_date && (
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const start = new Date(planForm.start_date)
                      const end = new Date(planForm.end_date)
                      const days: Date[] = []
                      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        days.push(new Date(d))
                      }
                      return days.slice(0, 35).map((date, idx) => {
                        const dateStr = formatDateString(date)
                        const isCheat = planForm.cheat_days.includes(dateStr)
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleCheatDay(dateStr)}
                            className={`p-2 text-center rounded-lg border transition-colors ${isCheat ? 'bg-rose-100 border-rose-300 text-rose-700' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            <p className="text-xs text-gray-500">{DAYS_SHORT[date.getDay()]}</p>
                            <p className="font-semibold">{date.getDate()}</p>
                            {isCheat && <PartyPopper className="w-3 h-3 mx-auto mt-1" />}
                          </button>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Special instructions, restrictions..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setShowCreatePlan(false); setShowEditPlan(false); resetPlanForm() }} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {showEditPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAddMeal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Meal</h2>
                <p className="text-sm text-gray-500">Day {mealForm.day_number}</p>
              </div>
              <button onClick={() => { setShowAddMeal(false); resetMealForm() }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                <select
                  value={mealForm.meal_type}
                  onChange={(e) => {
                    const type = e.target.value
                    const mealType = ALL_MEAL_TYPES.find(m => m.value === type)
                    setMealForm({ ...mealForm, meal_type: type, scheduled_time: mealType?.time || '12:00' })
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                >
                  <optgroup label="Scheduled Meals">
                    {MEAL_TYPES.map((meal) => (
                      <option key={meal.value} value={meal.value}>{meal.label} ({meal.time})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Extra / Cheat">
                    <option value="extra">Extra Meal (Client Added)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                <input type="time" value={mealForm.scheduled_time} onChange={(e) => setMealForm({ ...mealForm, scheduled_time: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Name (optional)</label>
                <input type="text" value={mealForm.name} onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} placeholder="Leave empty to use meal type" className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddMeal(false); resetMealForm() }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Add Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Food Item Modal */}
      {showAddItem && selectedMeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Food Item</h2>
                <p className="text-sm text-gray-500">{selectedMeal.name || getMealTypeLabel(selectedMeal.meal_type)}</p>
              </div>
              <button onClick={() => { setShowAddItem(false); resetItemForm(); setSelectedMeal(null) }} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Foods</label>
                <div className="relative">
                  <input type="text" value={foodSearch} onChange={(e) => handleSearchFoods(e.target.value)} placeholder="Type to search..." className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                  {searchLoading && <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-gray-400" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                    {searchResults.map((food) => (
                      <button key={food.id} type="button" onClick={() => selectFood(food)} className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <p className="font-medium">{food.name}</p>
                        <p className="text-xs text-gray-500">{food.calories_per_serving || 0} cal</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-sm">or add custom item</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Item Name *</label>
                <input 
                  type="text" 
                  value={itemForm.custom_item_name} 
                  onChange={(e) => setItemForm({ ...itemForm, custom_item_name: e.target.value, food_id: '' })} 
                  placeholder="e.g., Grilled Chicken Breast, Rice, Salad..." 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" step="0.1" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                    <option value="serving">Serving</option>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="cup">Cup</option>
                    <option value="piece">Piece</option>
                    <option value="tbsp">Tablespoon</option>
                    <option value="tsp">Teaspoon</option>
                  </select>
                </div>
              </div>

              {/* Nutrition Values - Prominent Entry */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Nutrition Values
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Calories</label>
                    <input 
                      type="number" 
                      value={itemForm.calories} 
                      onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })} 
                      placeholder="0" 
                      className="w-full px-3 py-2.5 border border-orange-200 rounded-lg text-center font-semibold text-orange-600 bg-white focus:ring-2 focus:ring-orange-200"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">kcal</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Protein</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={itemForm.protein_g} 
                      onChange={(e) => setItemForm({ ...itemForm, protein_g: e.target.value })} 
                      placeholder="0" 
                      className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-center font-semibold text-blue-600 bg-white focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">grams</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Carbs</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={itemForm.carbs_g} 
                      onChange={(e) => setItemForm({ ...itemForm, carbs_g: e.target.value })} 
                      placeholder="0" 
                      className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-center font-semibold text-amber-600 bg-white focus:ring-2 focus:ring-amber-200"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">grams</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fat</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={itemForm.fat_g} 
                      onChange={(e) => setItemForm({ ...itemForm, fat_g: e.target.value })} 
                      placeholder="0" 
                      className="w-full px-3 py-2.5 border border-rose-200 rounded-lg text-center font-semibold text-rose-600 bg-white focus:ring-2 focus:ring-rose-200"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">grams</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddItem(false); resetItemForm(); setSelectedMeal(null) }} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving || (!itemForm.food_id && !itemForm.custom_item_name)} className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
