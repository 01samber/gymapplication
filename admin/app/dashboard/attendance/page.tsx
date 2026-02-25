'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Loader2, 
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  LogIn,
  LogOut,
  Activity,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AttendanceRecord = {
  id: string
  client_id: string
  check_in: string
  check_in_date: string
  check_out: string | null
  full_name?: string
}

type MemberStats = {
  user_id: string
  full_name: string
  monthly_visits: number
  total_visits: number
  last_visit: string | null
}

export default function AttendancePage() {
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [memberStats, setMemberStats] = useState<MemberStats[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'daily' | 'stats'>('daily')

  useEffect(() => {
    fetchAttendance()
    fetchMemberStats()
  }, [selectedDate])

  async function fetchAttendance() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('check_in_date', selectedDate)
        .order('check_in', { ascending: false })

      if (error) throw error

      const clientIds = Array.from(new Set(data?.map(a => a.client_id) || []))
      let names: Record<string, string> = {}

      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds)

        profiles?.forEach(p => {
          names[p.id] = p.full_name
        })
      }

      const recordsWithNames = (data || []).map(a => ({
        ...a,
        full_name: names[a.client_id] || 'Unknown'
      }))

      setAttendanceRecords(recordsWithNames)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMemberStats() {
    try {
      const { data: clientProfiles } = await supabase
        .from('client_profiles')
        .select('id, user_id')

      if (!clientProfiles) return

      const clientIds = clientProfiles.map(cp => cp.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', clientIds)

      // Get current month's attendance
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthlyAttendance } = await supabase
        .from('attendance')
        .select('client_id, check_in_date')
        .in('client_id', clientIds)
        .gte('check_in_date', startOfMonth.toISOString().split('T')[0])

      const { data: allAttendance } = await supabase
        .from('attendance')
        .select('client_id, check_in_date')
        .in('client_id', clientIds)
        .order('check_in_date', { ascending: false })

      const stats: MemberStats[] = clientIds.map(cid => {
        const profile = profiles?.find(p => p.id === cid)
        const monthly = monthlyAttendance?.filter(a => a.client_id === cid).length || 0
        const total = allAttendance?.filter(a => a.client_id === cid).length || 0
        const lastRecord = allAttendance?.find(a => a.client_id === cid)

        return {
          user_id: cid,
          full_name: profile?.full_name || 'Unknown',
          monthly_visits: monthly,
          total_visits: total,
          last_visit: lastRecord?.check_in_date || null
        }
      })

      setMemberStats(stats.sort((a, b) => b.monthly_visits - a.monthly_visits))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const navigateDate = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const currentlyIn = attendanceRecords.filter(a => !a.check_out).length
  const todayTotal = attendanceRecords.length

  const filteredRecords = attendanceRecords.filter(a =>
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStats = memberStats.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return '--:--'
    }
  }

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'Active'
    try {
      const start = new Date(checkIn)
      const end = new Date(checkOut)
      const diff = Math.abs(end.getTime() - start.getTime())
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${mins}m`
    } catch {
      return '--'
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - UFC/FIFA theme */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
                <ClipboardCheck className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Attendance</h1>
                <p className="text-gray-400">Track gym check-ins and visits</p>
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{currentlyIn}</p>
                <p className="text-xs text-gray-400">Currently In</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <LogIn className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{todayTotal}</p>
                <p className="text-xs text-gray-400">Today&apos;s Visits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{memberStats.length}</p>
                <p className="text-xs text-gray-400">Total Members</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex glass-subtle rounded-xl p-1">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'daily' ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'stats' ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
                }`}
              >
                Member Stats
              </button>
            </div>

            {viewMode === 'daily' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 glass-input rounded-lg font-medium"
                />
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-input border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading attendance...</p>
        </div>
      ) : viewMode === 'daily' ? (
        filteredRecords.length === 0 ? (
          <div className="glass-card rounded-lg p-16 text-center">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No check-ins for this date</h3>
            <p className="text-gray-500">Members will appear here when they check in</p>
          </div>
        ) : (
          <div className="glass-card rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="glass-input border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Member</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check In</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check Out</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:glass-input transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/30 border border-primary/40 text-primary flex items-center justify-center text-white font-bold">
                            {record.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{record.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LogIn className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{formatTime(record.check_in)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{formatTime(record.check_out)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{calculateDuration(record.check_in, record.check_out)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.check_out ? (
                          <span className="px-3 py-1 bg-slate-700/50 text-gray-700 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium animate-pulse">
                            In Gym
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStats.map((member) => (
            <div key={member.user_id} className="glass-card rounded-lg shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/30 border border-primary/40 text-primary flex items-center justify-center text-white text-xl font-bold">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{member.full_name}</h3>
                  {member.last_visit && (
                    <p className="text-sm text-gray-500">Last visit: {new Date(member.last_visit).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-teal-600">{member.monthly_visits}</p>
                  <p className="text-sm text-teal-700">This Month</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{member.total_visits}</p>
                  <p className="text-sm text-blue-700">All Time</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
