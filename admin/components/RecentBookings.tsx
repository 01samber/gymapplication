'use client'

const bookings = [
  {
    id: '1',
    client: 'John Smith',
    trainer: 'Coach Ahmad',
    time: '10:00 AM',
    date: 'Today',
    status: 'confirmed',
  },
  {
    id: '2',
    client: 'Sarah Johnson',
    trainer: 'Coach Ahmad',
    time: '11:30 AM',
    date: 'Today',
    status: 'pending',
  },
  {
    id: '3',
    client: 'Mike Davis',
    trainer: 'Coach Ahmad',
    time: '2:00 PM',
    date: 'Today',
    status: 'confirmed',
  },
  {
    id: '4',
    client: 'Lisa Brown',
    trainer: 'Coach Ahmad',
    time: '4:00 PM',
    date: 'Today',
    status: 'cancelled',
  },
  {
    id: '5',
    client: 'David Wilson',
    trainer: 'Coach Ahmad',
    time: '9:00 AM',
    date: 'Tomorrow',
    status: 'confirmed',
  },
]

const statusStyles = {
  confirmed: 'badge-success',
  pending: 'badge-warning',
  cancelled: 'badge-error',
  completed: 'badge-info',
}

export default function RecentBookings() {
  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="flex items-center justify-between p-4 rounded glass-subtle border border-slate-700/50 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {booking.client.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="font-medium text-white">{booking.client}</p>
              <p className="text-sm text-gray-500">
                {booking.trainer} • {booking.time}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{booking.date}</span>
            <span className={`badge ${statusStyles[booking.status as keyof typeof statusStyles]}`}>
              {booking.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
