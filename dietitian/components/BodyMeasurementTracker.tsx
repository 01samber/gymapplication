'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  User, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { BodyComposition } from '@/lib/supabase'

interface BodyMeasurementTrackerProps {
  compositions: BodyComposition[]
  clientName?: string
  gender?: 'male' | 'female'
}

export default function BodyMeasurementTracker({ 
  compositions, 
  clientName = 'Client',
  gender = 'male' 
}: BodyMeasurementTrackerProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [selectedComparison, setSelectedComparison] = useState<{
    before: BodyComposition | null
    after: BodyComposition | null
  }>({ before: null, after: null })

  useEffect(() => {
    if (compositions.length >= 2) {
      setSelectedComparison({
        before: compositions[compositions.length - 1], // Oldest
        after: compositions[0] // Latest
      })
    } else if (compositions.length === 1) {
      setSelectedComparison({
        before: compositions[0],
        after: compositions[0]
      })
    }
  }, [compositions])

  const measurements = [
    { key: 'weight_kg', label: 'WEIGHT', unit: 'kg' },
    { key: 'height_cm', label: 'HEIGHT', unit: 'cm' },
    { key: 'bmi', label: 'BMI', unit: '' },
    { key: 'percent_body_fat', label: 'BODY FAT', unit: '%' },
    { key: 'skeletal_muscle_mass_kg', label: 'MUSCLE', unit: 'kg' },
    { key: 'body_fat_mass_kg', label: 'FAT MASS', unit: 'kg' },
    { key: 'waist_hip_ratio', label: 'WAIST/HIP', unit: '' },
    { key: 'basal_metabolic_rate', label: 'BMR', unit: 'kcal' },
  ]

  const segmentalMeasurements = [
    { key: 'left_arm_lean_kg', label: 'L. ARM', unit: 'kg' },
    { key: 'right_arm_lean_kg', label: 'R. ARM', unit: 'kg' },
    { key: 'trunk_lean_kg', label: 'TRUNK', unit: 'kg' },
    { key: 'left_leg_lean_kg', label: 'L. LEG', unit: 'kg' },
    { key: 'right_leg_lean_kg', label: 'R. LEG', unit: 'kg' },
  ]

  const getValue = (comp: BodyComposition | null, key: string): string => {
    if (!comp) return '--'
    const value = (comp as any)[key]
    if (value === null || value === undefined) return '--'
    if (typeof value === 'number') {
      return key === 'basal_metabolic_rate' ? value.toString() : value.toFixed(1)
    }
    return value
  }

  const getChange = (key: string): { value: number; direction: 'up' | 'down' | 'same' } | null => {
    if (!selectedComparison.before || !selectedComparison.after) return null
    const before = (selectedComparison.before as any)[key]
    const after = (selectedComparison.after as any)[key]
    if (before === null || after === null || before === undefined || after === undefined) return null
    const change = after - before
    return {
      value: Math.abs(change),
      direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'same'
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('Please allow popups to print the report')
      return
    }

    // Get the content to print
    const printContent = printRef.current.innerHTML

    // Write the print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Body Measurement Report - ${clientName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .no-print { display: none !important; }
            .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
            .from-slate-800 { --tw-gradient-from: #1e293b; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, #1e293b); }
            .to-slate-700 { --tw-gradient-to: #334155; }
            .from-slate-700 { --tw-gradient-from: #334155; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
            .to-slate-600 { --tw-gradient-to: #475569; }
            .from-slate-600 { --tw-gradient-from: #475569; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
            .to-slate-500 { --tw-gradient-to: #64748b; }
            .from-emerald-600 { --tw-gradient-from: #059669; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
            .to-emerald-500 { --tw-gradient-to: #10b981; }
            .bg-white { background: white; }
            .bg-slate-50 { background: #f8fafc; }
            .bg-gray-50 { background: #f9fafb; }
            .bg-blue-50 { background: #eff6ff; }
            .bg-purple-50 { background: #faf5ff; }
            .bg-orange-50 { background: #fff7ed; }
            .bg-emerald-50 { background: #ecfdf5; }
            .text-white { color: white; }
            .text-gray-900 { color: #111827; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-slate-300 { color: #cbd5e1; }
            .text-green-500 { color: #22c55e; }
            .text-red-500 { color: #ef4444; }
            .text-blue-600 { color: #2563eb; }
            .text-amber-600 { color: #d97706; }
            .text-rose-600 { color: #e11d48; }
            .text-emerald-600 { color: #059669; }
            .text-emerald-800 { color: #065f46; }
            .text-purple-600 { color: #9333ea; }
            .text-orange-600 { color: #ea580c; }
            .rounded-2xl { border-radius: 1rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .border { border: 1px solid #e5e7eb; }
            .border-gray-100 { border-color: #f3f4f6; }
            .border-gray-200 { border-color: #e5e7eb; }
            .divide-x > * + * { border-left: 1px solid #e5e7eb; }
            .divide-y > * + * { border-top: 1px solid #e5e7eb; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .gap-2 { gap: 0.5rem; }
            .gap-4 { gap: 1rem; }
            .gap-8 { gap: 2rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .pb-6 { padding-bottom: 1.5rem; }
            .pt-2 { padding-top: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .tracking-wide { letter-spacing: 0.025em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .overflow-hidden { overflow: hidden; }
            .overflow-x-auto { overflow-x: auto; }
            .w-full { width: 100%; }
            .w-16 { width: 4rem; }
            .w-24 { width: 6rem; }
            .h-32 { height: 8rem; }
            .h-48 { height: 12rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 0.75rem 1rem; text-align: left; }
            thead { background: #f9fafb; }
            tbody tr:hover { background: #f9fafb; }
            svg { display: inline-block; vertical-align: middle; }
            @page { size: A4; margin: 1cm; }
            @media print {
              body { padding: 0; }
              .rounded-2xl { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="space-y-6">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Get weekly data (last 5 measurements)
  const weeklyData = compositions.slice(0, 5).reverse()

  return (
    <div className="space-y-6 print-container" ref={printRef}>
      {/* Header with Print Button */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-xl font-bold text-gray-900">Body Measurement Tracker</h2>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      {/* Main Comparison Card - Before/After Layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border">
        {/* Client Name Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 text-center print:bg-slate-800">
          <h3 className="text-lg font-bold tracking-wider">BODY MEASUREMENT</h3>
          <p className="text-slate-300 text-sm">{clientName}</p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Before Column */}
          <div className="p-6">
            <div className="text-center mb-6">
              <span className="text-xs font-semibold text-gray-400 tracking-widest">BEFORE</span>
              {selectedComparison.before && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedComparison.before.measurement_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Body Silhouette */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-48">
                {gender === 'male' ? (
                  <MaleSilhouette className="w-full h-full text-slate-300" />
                ) : (
                  <FemaleSilhouette className="w-full h-full text-slate-300" />
                )}
              </div>
            </div>

            {/* Measurements */}
            <div className="space-y-3">
              {measurements.map((m) => (
                <div key={m.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 tracking-wide">{m.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {getValue(selectedComparison.before, m.key)} {m.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* After Column */}
          <div className="p-6 bg-slate-50">
            <div className="text-center mb-6">
              <span className="text-xs font-semibold text-gray-400 tracking-widest">AFTER</span>
              {selectedComparison.after && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedComparison.after.measurement_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Body Silhouette */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-48">
                {gender === 'male' ? (
                  <MaleSilhouette className="w-full h-full text-slate-700" />
                ) : (
                  <FemaleSilhouette className="w-full h-full text-slate-700" />
                )}
              </div>
            </div>

            {/* Measurements with Change Indicators */}
            <div className="space-y-3">
              {measurements.map((m) => {
                const change = getChange(m.key)
                return (
                  <div key={m.key} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {getValue(selectedComparison.after, m.key)} {m.unit}
                      </span>
                      {change && change.direction !== 'same' && (
                        <span className={`flex items-center text-xs ${
                          // For weight/fat, down is good. For muscle/BMR, up is good
                          (m.key.includes('fat') || m.key === 'weight_kg' || m.key === 'bmi')
                            ? (change.direction === 'down' ? 'text-green-500' : 'text-red-500')
                            : (change.direction === 'up' ? 'text-green-500' : 'text-red-500')
                        }`}>
                          {change.direction === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Segmental Analysis Card */}
      {(selectedComparison.after?.left_arm_lean_kg || selectedComparison.after?.trunk_lean_kg) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border">
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white p-4 text-center">
            <h3 className="text-sm font-bold tracking-wider">SEGMENTAL LEAN ANALYSIS</h3>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-center gap-8">
              {/* Left Side */}
              <div className="space-y-4 text-right">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">L. ARM</p>
                  <p className="font-bold text-gray-900">{getValue(selectedComparison.after, 'left_arm_lean_kg')} kg</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">L. LEG</p>
                  <p className="font-bold text-gray-900">{getValue(selectedComparison.after, 'left_leg_lean_kg')} kg</p>
                </div>
              </div>

              {/* Center Body */}
              <div className="text-center">
                <div className="p-4 bg-purple-50 rounded-lg mb-4">
                  <p className="text-xs text-gray-500">TRUNK</p>
                  <p className="font-bold text-gray-900">{getValue(selectedComparison.after, 'trunk_lean_kg')} kg</p>
                </div>
                <div className="w-16 h-32 mx-auto">
                  {gender === 'male' ? (
                    <MaleSilhouette className="w-full h-full text-slate-400" />
                  ) : (
                    <FemaleSilhouette className="w-full h-full text-slate-400" />
                  )}
                </div>
              </div>

              {/* Right Side */}
              <div className="space-y-4 text-left">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">R. ARM</p>
                  <p className="font-bold text-gray-900">{getValue(selectedComparison.after, 'right_arm_lean_kg')} kg</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">R. LEG</p>
                  <p className="font-bold text-gray-900">{getValue(selectedComparison.after, 'right_leg_lean_kg')} kg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Progress Table */}
      {weeklyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border">
          <div className="bg-gradient-to-r from-slate-600 to-slate-500 text-white p-4">
            <h3 className="text-sm font-bold tracking-wider text-center">WEEKLY PROGRESS TRACKER</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 tracking-wider"></th>
                  {weeklyData.map((comp, idx) => (
                    <th key={comp.id} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 tracking-wider">
                      WEEK {idx + 1}
                      <div className="text-[10px] font-normal text-gray-400">
                        {new Date(comp.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { key: 'weight_kg', label: 'WEIGHT' },
                  { key: 'percent_body_fat', label: 'BODY FAT %' },
                  { key: 'skeletal_muscle_mass_kg', label: 'MUSCLE' },
                  { key: 'bmi', label: 'BMI' },
                  { key: 'body_fat_mass_kg', label: 'FAT MASS' },
                  { key: 'basal_metabolic_rate', label: 'BMR' },
                ].map((m) => (
                  <tr key={m.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-medium text-gray-600 tracking-wide">
                      {m.label}
                    </td>
                    {weeklyData.map((comp) => (
                      <td key={comp.id} className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {getValue(comp, m.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weight Control Recommendations */}
      {selectedComparison.after && (
        selectedComparison.after.target_weight_kg || 
        selectedComparison.after.weight_control_kg ||
        selectedComparison.after.fat_control_kg ||
        selectedComparison.after.muscle_control_kg
      ) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4">
            <h3 className="text-sm font-bold tracking-wider text-center">BODY COMPOSITION CONTROL</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-xs text-emerald-600 font-medium mb-1">TARGET WEIGHT</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getValue(selectedComparison.after, 'target_weight_kg')}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 font-medium mb-1">WEIGHT CONTROL</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getValue(selectedComparison.after, 'weight_control_kg')}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-xs text-orange-600 font-medium mb-1">FAT CONTROL</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getValue(selectedComparison.after, 'fat_control_kg')}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-xs text-purple-600 font-medium mb-1">MUSCLE CONTROL</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getValue(selectedComparison.after, 'muscle_control_kg')}
                </p>
                <p className="text-xs text-gray-500">kg</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything first */
          body > * {
            display: none !important;
          }
          
          /* Hide navigation, sidebar, and buttons */
          nav, aside, header, footer, .no-print, button {
            display: none !important;
          }
          
          /* Show only the print container and its parents */
          body.printing-report,
          body.printing-report > div,
          body.printing-report > div > div,
          body.printing-report > div > div > div,
          body.printing-report > div > div > div > main,
          body.printing-report > div > div > div > main > div,
          body.printing-report .print-container,
          body.printing-report .print-container * {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Override display for flex/grid layouts in print */
          body.printing-report .grid {
            display: grid !important;
          }
          body.printing-report .flex {
            display: flex !important;
          }
          body.printing-report .divide-x > * + * {
            border-left-width: 1px !important;
          }
          
          /* Ensure colors print */
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page settings */
          @page {
            size: A4;
            margin: 1cm;
          }
          
          /* Ensure backgrounds print */
          .bg-gradient-to-r, .bg-slate-800, .bg-slate-700, .bg-slate-600, 
          .bg-emerald-600, .bg-emerald-500, .bg-blue-50, .bg-purple-50, 
          .bg-orange-50, .bg-emerald-50, .bg-gray-50, .bg-slate-50 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Avoid page breaks inside cards */
          .rounded-2xl {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Reset margins for print */
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}

// Male Silhouette SVG Component
function MaleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 200" className={className} fill="currentColor">
      {/* Head */}
      <ellipse cx="50" cy="20" rx="15" ry="18" />
      {/* Neck */}
      <rect x="44" y="38" width="12" height="10" />
      {/* Torso */}
      <path d="M30 48 L70 48 L75 100 L65 140 L35 140 L25 100 Z" />
      {/* Left Arm */}
      <path d="M30 48 L20 55 L15 95 L22 97 L28 60 L30 48" />
      {/* Right Arm */}
      <path d="M70 48 L80 55 L85 95 L78 97 L72 60 L70 48" />
      {/* Left Leg */}
      <path d="M35 140 L32 180 L28 195 L42 195 L45 180 L48 140" />
      {/* Right Leg */}
      <path d="M52 140 L55 180 L58 195 L72 195 L68 180 L65 140" />
    </svg>
  )
}

// Female Silhouette SVG Component
function FemaleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 200" className={className} fill="currentColor">
      {/* Head */}
      <ellipse cx="50" cy="18" rx="14" ry="16" />
      {/* Neck */}
      <rect x="45" y="34" width="10" height="8" />
      {/* Torso - more curved for female */}
      <path d="M35 42 L65 42 L68 55 L72 75 L68 95 L65 115 L62 140 L38 140 L35 115 L32 95 L28 75 L32 55 Z" />
      {/* Left Arm */}
      <path d="M35 42 L25 50 L20 90 L26 92 L30 55 L35 42" />
      {/* Right Arm */}
      <path d="M65 42 L75 50 L80 90 L74 92 L70 55 L65 42" />
      {/* Left Leg */}
      <path d="M38 140 L36 175 L33 195 L45 195 L47 175 L48 140" />
      {/* Right Leg */}
      <path d="M52 140 L53 175 L55 195 L67 195 L64 175 L62 140" />
    </svg>
  )
}
