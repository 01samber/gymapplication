import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
  if (bmi < 25) return { label: 'Normal', color: 'text-green-500' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' }
  return { label: 'Obese', color: 'text-red-500' }
}

export function getBodyFatCategory(percentage: number, gender: 'male' | 'female'): { label: string; color: string } {
  if (gender === 'male') {
    if (percentage < 6) return { label: 'Essential', color: 'text-red-500' }
    if (percentage < 14) return { label: 'Athletes', color: 'text-blue-500' }
    if (percentage < 18) return { label: 'Fitness', color: 'text-green-500' }
    if (percentage < 25) return { label: 'Average', color: 'text-yellow-500' }
    return { label: 'Obese', color: 'text-red-500' }
  } else {
    if (percentage < 14) return { label: 'Essential', color: 'text-red-500' }
    if (percentage < 21) return { label: 'Athletes', color: 'text-blue-500' }
    if (percentage < 25) return { label: 'Fitness', color: 'text-green-500' }
    if (percentage < 32) return { label: 'Average', color: 'text-yellow-500' }
    return { label: 'Obese', color: 'text-red-500' }
  }
}

export function getMealTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Breakfast',
    morning_snack: 'Morning Snack',
    lunch: 'Lunch',
    afternoon_snack: 'Afternoon Snack',
    dinner: 'Dinner',
    evening_snack: 'Evening Snack'
  }
  return labels[type] || type
}

export function getMealTypeTime(type: string): string {
  const times: Record<string, string> = {
    breakfast: '08:00',
    morning_snack: '11:00',
    lunch: '13:00',
    afternoon_snack: '16:00',
    dinner: '19:00',
    evening_snack: '21:00'
  }
  return times[type] || '12:00'
}

export function getComplianceColor(rate: number): string {
  if (rate >= 80) return 'text-green-500'
  if (rate >= 60) return 'text-yellow-500'
  return 'text-red-500'
}

export function formatNumber(num: number, decimals = 1): string {
  return num.toFixed(decimals)
}
