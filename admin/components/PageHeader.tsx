'use client'

interface PageHeaderProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  action?: React.ReactNode
  stats?: { label: string; value: string | number }[]
}

export default function PageHeader({ title, subtitle, icon, action, stats }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-700/50 bg-gradient-to-br from-surface-card via-surface-light to-surface-card p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-red/5" />
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-red/10 blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/20 border border-primary/40 rounded-lg">
              {icon}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">{title}</h1>
              <p className="text-gray-400">{subtitle}</p>
            </div>
          </div>
          {action}
        </div>

        {stats && stats.length > 0 && (
          <div className="flex gap-6 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded border border-slate-600/50">
                  {icon}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
