'use client'

import { useEffect, useState } from 'react'
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Loader2, 
  Clock,
  Mail,
  Phone,
  Target,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Bell
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type RegistrationRequest = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: 'client' | 'trainer'
  requested_plan: string
  fitness_goal: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
}

export default function RegistrationsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null)
  const [processing, setProcessing] = useState(false)

  async function fetchRequests() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      let filtered = data || []
      if (filter !== 'all') {
        filtered = filtered.filter(r => r.status === filter)
      }
      
      setRequests(filtered)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [filter])

  // SIMPLIFIED: Admin only updates status - mobile app creates profiles on login
  async function handleApprove(request: RegistrationRequest, adminNotes: string) {
    setProcessing(true)
    try {
      // Just update the status to approved
      const { error } = await supabase
        .from('registration_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (error) throw error

      setSelectedRequest(null)
      fetchRequests()
      alert(`${request.full_name} has been approved! They can now login with their email and password.`)
    } catch (error: any) {
      console.error('Error approving:', error)
      alert('Error approving: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(request: RegistrationRequest, adminNotes: string) {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('registration_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || 'Registration rejected by admin.',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (error) throw error

      setSelectedRequest(null)
      fetchRequests()
      alert(`${request.full_name}'s registration has been rejected.`)
    } catch (error: any) {
      console.error('Error rejecting:', error)
      alert('Error rejecting: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const allRequests = requests
  const pendingCount = allRequests.filter(r => r.status === 'pending').length

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
                <UserPlus className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white tracking-wide">Registration Requests</h1>
                <p className="text-gray-400">Approve or reject new member registrations</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-3 px-6 py-3 bg-accent-red/20 border border-accent-red/40 rounded-lg animate-pulse">
                <Bell className="w-6 h-6 text-accent-red-light" />
                <div>
                  <p className="text-2xl font-bold text-white">{pendingCount}</p>
                  <p className="text-xs text-gray-500">Awaiting Review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-lg border border-white/10 p-2 inline-flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-2 rounded text-sm font-medium transition-all ${
              filter === tab 
                ? 'bg-primary text-white' 
                : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-accent-red/30 rounded text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="glass-card rounded-lg border border-white/10 p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card rounded-lg border border-white/10 p-16 text-center">
          <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No {filter === 'all' ? '' : filter} requests</h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'New registration requests will appear here' 
              : `No ${filter} requests to show`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onView={() => setSelectedRequest(request)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          processing={processing}
        />
      )}
    </div>
  )
}

function RequestCard({ request, onView }: { request: RegistrationRequest; onView: () => void }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  }

  const config = statusConfig[request.status]
  const StatusIcon = config.icon

  return (
    <div className="glass-card rounded-lg border border-white/10 border border-white/10 shadow-sm hover:shadow-lg transition-all p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
            request.role === 'trainer' 
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
              : 'bg-gradient-to-br from-red-500 to-orange-500'
          }`}>
            {request.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{request.full_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.bg} ${config.text}`}>
                <StatusIcon className="w-3 h-3" />
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                request.role === 'trainer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {request.role === 'trainer' ? 'Trainer' : 'Client'}
              </span>
              {request.role === 'client' && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {request.requested_plan === 'with_pt' ? 'PT $200' : 'Gym $75'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-gray-500">
            <p>{new Date(request.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onView}
            className="p-3 bg-gray-100 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          <span>{request.email}</span>
        </div>
        {request.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{request.phone}</span>
          </div>
        )}
        {request.fitness_goal && (
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{request.fitness_goal.replace('_', ' ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RequestDetailModal({ 
  request, 
  onClose, 
  onApprove, 
  onReject,
  processing 
}: { 
  request: RegistrationRequest
  onClose: () => void
  onApprove: (request: RegistrationRequest, notes: string) => void
  onReject: (request: RegistrationRequest, notes: string) => void
  processing: boolean
}) {
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-lg border border-white/10 w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-white ${
          request.role === 'trainer' 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
            : 'bg-gradient-to-r from-red-500 to-orange-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {request.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{request.full_name}</h2>
                <p className="text-white/80 text-sm">
                  {request.role === 'trainer' ? 'Trainer Application' : 'Member Registration'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-surface-light rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-medium text-sm">{request.email}</p>
            </div>
            <div className="p-3 bg-surface-light rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="font-medium text-sm">{request.phone || 'N/A'}</p>
            </div>
          </div>

          {request.role === 'client' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface-light rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Plan</p>
                <p className="font-medium text-sm">
                  {request.requested_plan === 'with_pt' ? 'PT Package ($200/mo)' : 'Open Gym ($75/mo)'}
                </p>
              </div>
              <div className="p-3 bg-surface-light rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Goal</p>
                <p className="font-medium text-sm">{request.fitness_goal?.replace('_', ' ') || 'Not set'}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-surface-light rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Requested</p>
            <p className="font-medium text-sm">
              {new Date(request.created_at).toLocaleString()}
            </p>
          </div>

          {/* Admin Notes */}
          {request.status === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
                className="w-full px-4 py-3 bg-surface-light border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none text-sm"
                rows={2}
              />
            </div>
          )}

          {/* Show notes if already processed */}
          {request.status !== 'pending' && request.admin_notes && (
            <div className="p-3 bg-surface-light rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Admin Notes</p>
              <p className="text-sm">{request.admin_notes}</p>
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' ? (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onReject(request, adminNotes)}
                disabled={processing}
                className="flex-1 px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => onApprove(request, adminNotes)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
            </div>
          ) : (
            <div className={`p-4 rounded-xl text-center font-medium ${
              request.status === 'approved' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {request.status === 'approved' 
                ? 'Approved - User can now login' 
                : 'Registration was rejected'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
