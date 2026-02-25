'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Loader2, 
  X, 
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  UserCog,
  ArrowRight,
  Clock,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Request = {
  id: string
  trainer_id: string
  client_id: string
  request_type: 'terminate_client' | 'transfer_client' | 'upgrade_subscription' | 'downgrade_subscription' | 'freeze_subscription' | 'cancel_subscription'
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  trainer_name?: string
  client_name?: string
}

export default function RequestsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [filterStatus, setFilterStatus] = useState('pending')
  const [showTransferModal, setShowTransferModal] = useState<Request | null>(null)
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchRequests()
    fetchTrainers()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const trainerIds = Array.from(new Set(data?.map(r => r.trainer_id) || []))
      const clientIds = Array.from(new Set(data?.map(r => r.client_id) || []))

      let trainerNames: Record<string, string> = {}
      let clientNames: Record<string, string> = {}

      if (trainerIds.length > 0) {
        const { data: trainerProfiles } = await supabase
          .from('trainer_profiles')
          .select('id, user_id')
          .in('id', trainerIds)

        if (trainerProfiles) {
          const userIds = trainerProfiles.map(tp => tp.user_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          trainerProfiles.forEach(tp => {
            const profile = profiles?.find(p => p.id === tp.user_id)
            trainerNames[tp.id] = profile?.full_name || 'Unknown'
          })
        }
      }

      if (clientIds.length > 0) {
        const { data: clientProfiles } = await supabase
          .from('client_profiles')
          .select('id, user_id')
          .in('id', clientIds)

        if (clientProfiles) {
          const userIds = clientProfiles.map(cp => cp.user_id)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          clientProfiles.forEach(cp => {
            const profile = profiles?.find(p => p.id === cp.user_id)
            clientNames[cp.id] = profile?.full_name || 'Unknown'
          })
        }
      }

      const requestsWithNames = (data || []).map(r => ({
        ...r,
        trainer_name: trainerNames[r.trainer_id] || 'Unknown',
        client_name: clientNames[r.client_id] || 'Unknown'
      }))

      setRequests(requestsWithNames)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTrainers() {
    try {
      const { data: trainerProfiles } = await supabase
        .from('trainer_profiles')
        .select('id, user_id')

      if (trainerProfiles) {
        const userIds = trainerProfiles.map(tp => tp.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const trainerList = trainerProfiles.map(tp => ({
          id: tp.id,
          name: profiles?.find(p => p.id === tp.user_id)?.full_name || 'Unknown'
        }))
        setTrainers(trainerList)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function handleApprove(request: Request) {
    try {
      if (request.request_type === 'transfer_client') {
        setShowTransferModal(request)
        return
      }

      // Handle other request types
      if (request.request_type === 'terminate_client') {
        await supabase.from('client_profiles').update({ trainer_id: null }).eq('id', request.client_id)
      } else if (request.request_type === 'freeze_subscription') {
        await supabase.from('subscriptions').update({ status: 'frozen' }).eq('client_id', request.client_id).eq('status', 'active')
      } else if (request.request_type === 'cancel_subscription') {
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('client_id', request.client_id).eq('status', 'active')
      }

      await supabase.from('client_requests').update({ status: 'approved' }).eq('id', request.id)
      fetchRequests()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function handleReject(id: string) {
    try {
      await supabase.from('client_requests').update({ status: 'rejected' }).eq('id', id)
      fetchRequests()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function handleTransfer(request: Request, newTrainerId: string) {
    try {
      await supabase.from('client_profiles').update({ trainer_id: newTrainerId }).eq('id', request.client_id)
      await supabase.from('client_requests').update({ status: 'approved' }).eq('id', request.id)
      setShowTransferModal(null)
      fetchRequests()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredRequests = requests.filter(r => !filterStatus || r.status === filterStatus)

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      terminate_client: 'Terminate Client',
      transfer_client: 'Transfer Client',
      upgrade_subscription: 'Upgrade Subscription',
      downgrade_subscription: 'Downgrade Subscription',
      freeze_subscription: 'Freeze Subscription',
      cancel_subscription: 'Cancel Subscription'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      terminate_client: 'bg-red-100 text-red-700',
      transfer_client: 'bg-blue-100 text-blue-700',
      upgrade_subscription: 'bg-green-100 text-green-700',
      downgrade_subscription: 'bg-orange-100 text-orange-700',
      freeze_subscription: 'bg-cyan-100 text-cyan-700',
      cancel_subscription: 'bg-slate-700/50 text-gray-700'
    }
    return colors[type] || 'bg-slate-700/50 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - UFC/FIFA theme */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">Requests</h1>
              <p className="text-gray-400">Manage trainer requests for clients</p>
            </div>
          </div>

          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
                <p className="text-xs text-gray-400">Approved</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 glass-subtle rounded-lg">
                <XCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                <p className="text-xs text-gray-400">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card rounded-lg p-4 shadow-sm">
        <div className="flex glass-subtle rounded-xl p-1 w-fit">
          {['pending', 'approved', 'rejected', ''].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="glass-card rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="glass-card rounded-lg p-16 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No requests found</h3>
          <p className="text-gray-500">Trainer requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="glass-card rounded-lg shadow-sm hover:shadow-md transition-all p-5">
              <div className="flex items-center gap-4">
                {/* Request Type */}
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getTypeColor(request.request_type)}`}>
                  {getTypeLabel(request.request_type)}
                </span>

                {/* Trainer & Client */}
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <UserCog className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">{request.trainer_name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{request.client_name}</span>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {new Date(request.created_at).toLocaleDateString()}
                </div>

                {/* Status & Actions */}
                {request.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request)}
                      className="px-4 py-2 bg-green-100 text-green-600 rounded-xl font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                )}
              </div>

              {request.reason && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600"><strong>Reason:</strong> {request.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          request={showTransferModal}
          trainers={trainers.filter(t => t.id !== showTransferModal.trainer_id)}
          onClose={() => setShowTransferModal(null)}
          onTransfer={(newTrainerId) => handleTransfer(showTransferModal, newTrainerId)}
        />
      )}
    </div>
  )
}

function TransferModal({ request, trainers, onClose, onTransfer }: {
  request: Request
  trainers: { id: string; name: string }[]
  onClose: () => void
  onTransfer: (trainerId: string) => void
}) {
  const [selectedTrainer, setSelectedTrainer] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedTrainer) return
    setLoading(true)
    await onTransfer(selectedTrainer)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/30 to-accent-red/30 p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Transfer Client</h2>
                <p className="text-white/70 text-sm">Select new trainer for {request.client_name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Trainer</label>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="w-full px-4 py-3 glass-input border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a trainer</option>
              {trainers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-600/50 rounded-xl text-gray-700 hover:glass-input transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTrainer || loading}
              className="flex-1 px-4 py-3 glass-button text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Transfer Client
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
