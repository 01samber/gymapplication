import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}

export default function StatsCard({ title, value, change, changeType, icon }: StatsCardProps) {
  return (
    <div className="glass-card rounded-lg border border-white/10 p-6 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          <p className={cn(
            'text-sm mt-2 font-medium',
            changeType === 'positive' && 'text-primary',
            changeType === 'negative' && 'text-red-400',
            changeType === 'neutral' && 'text-gray-500'
          )}>
            {change}
          </p>
        </div>
        <div className="p-3 bg-primary/20 border border-primary/40 rounded text-primary">
          {icon}
        </div>
      </div>
    </div>
  )
}
