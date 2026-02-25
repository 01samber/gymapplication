import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for the dietitian dashboard
export type UserRole = 'client' | 'trainer' | 'admin' | 'dietitian'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  gender: string | null
  date_of_birth: string | null
  created_at: string
}

export interface DietitianProfile {
  id: string
  user_id: string
  specializations: string[]
  certifications: string[]
  license_number: string | null
  bio: string | null
  experience_years: number
  is_active: boolean
}

export interface BodyComposition {
  id: string
  client_id: string
  recorded_by_id: string | null
  measurement_date: string
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  gender: string | null
  total_body_water_l: number | null
  protein_kg: number | null
  minerals_kg: number | null
  body_fat_mass_kg: number | null
  skeletal_muscle_mass_kg: number | null
  bmi: number | null
  percent_body_fat: number | null
  left_arm_lean_kg: number | null
  left_arm_lean_percent: number | null
  right_arm_lean_kg: number | null
  right_arm_lean_percent: number | null
  trunk_lean_kg: number | null
  trunk_lean_percent: number | null
  left_leg_lean_kg: number | null
  left_leg_lean_percent: number | null
  right_leg_lean_kg: number | null
  right_leg_lean_percent: number | null
  left_arm_fat_kg: number | null
  left_arm_fat_percent: number | null
  right_arm_fat_kg: number | null
  right_arm_fat_percent: number | null
  trunk_fat_kg: number | null
  trunk_fat_percent: number | null
  left_leg_fat_kg: number | null
  left_leg_fat_percent: number | null
  right_leg_fat_kg: number | null
  right_leg_fat_percent: number | null
  fat_free_mass_kg: number | null
  basal_metabolic_rate: number | null
  waist_hip_ratio: number | null
  visceral_fat_level: number | null
  metabolic_age: number | null
  target_weight_kg: number | null
  weight_control_kg: number | null
  fat_control_kg: number | null
  muscle_control_kg: number | null
  notes: string | null
  created_at: string
}

export interface Food {
  id: string
  name: string
  name_ar: string | null
  brand: string | null
  description: string | null
  category: string
  serving_size: number | null
  serving_unit: string | null
  calories_per_serving: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
  is_verified: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DietPlan {
  id: string
  client_id: string
  dietitian_id: string | null
  name: string
  description: string | null
  plan_type: 'weekly' | 'monthly'
  start_date: string
  end_date: string | null
  status: 'active' | 'completed' | 'paused' | 'draft'
  target_calories: number | null
  target_protein_g: number | null
  target_carbs_g: number | null
  target_fat_g: number | null
  target_fiber_g: number | null
  target_water_l: number | null
  cheat_days: string[] | null // Array of date strings (YYYY-MM-DD) for cheat days
  notes: string | null
  created_at: string
  updated_at?: string
  meals?: DietPlanMeal[]
  daily_tracking?: DailyPlanTracking[]
}

export interface DietPlanMeal {
  id: string
  plan_id: string
  meal_type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack'
  scheduled_time: string | null
  day_of_week: number | null
  day_number: number | null // Day 1, 2, 3... for the plan
  specific_date: string | null // Specific date if assigned
  name: string | null
  description: string | null
  total_calories: number | null
  total_protein_g: number | null
  total_carbs_g: number | null
  total_fat_g: number | null
  notes: string | null
  order_index: number
  items?: DietPlanMealItem[]
  commitments?: MealCommitment[]
}

export interface MealCommitment {
  id: string
  client_id: string
  plan_id: string
  meal_id: string
  commitment_date: string
  is_committed: boolean
  committed_at: string | null
  notes: string | null
}

export interface DailyPlanTracking {
  id: string
  client_id: string
  plan_id: string
  tracking_date: string
  total_calories_consumed: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  meals_completed: number
  total_meals: number
  completion_percentage: number
  is_cheat_day: boolean
  notes: string | null
}

export interface DietPlanMealItem {
  id: string
  meal_id: string
  food_id: string | null
  custom_item_name: string | null
  custom_item_name_ar: string | null
  quantity: number
  unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  alternatives: string | null
  notes: string | null
  food?: Food
}

export interface MealLog {
  id: string
  client_id: string
  diet_plan_meal_id: string | null
  meal_type: string
  logged_at: string
  meal_date: string
  status: 'followed' | 'modified' | 'skipped' | 'pending'
  total_calories: number | null
  total_protein_g: number | null
  total_carbs_g: number | null
  total_fat_g: number | null
  notes: string | null
  photo_url: string | null
  items?: MealLogItem[]
}

export interface MealLogItem {
  id: string
  log_id: string
  food_id: string | null
  custom_name: string | null
  quantity: number
  unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  food?: Food
}

export interface ClientAssignment {
  id: string
  client_id: string
  dietitian_id: string
  assigned_at: string
  is_active: boolean
  client?: Profile
}
