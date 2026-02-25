'use client'

const trainers = [
  { name: 'Coach Ahmad', utilization: 85, sessions: 18, color: '#c1272d' },
  { name: 'Coach Sarah', utilization: 72, sessions: 14, color: '#00a651' },
  { name: 'Coach Mike', utilization: 65, sessions: 12, color: '#00a651' },
]

export default function TrainerUtilization() {
  return (
    <div className="space-y-6">
      {trainers.map((trainer) => (
        <div key={trainer.name}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: trainer.color }}
              >
                {trainer.name.split(' ')[1][0]}
              </div>
              <span className="font-medium text-white">{trainer.name}</span>
            </div>
            <span className="text-sm text-gray-500">{trainer.sessions} sessions</span>
          </div>
          
          <div className="h-2 bg-black/20 rounded overflow-hidden">
            <div 
              className="h-full rounded transition-all duration-500"
              style={{ 
                width: `${trainer.utilization}%`,
                backgroundColor: trainer.color 
              }}
            />
          </div>
          
          <p className="text-xs text-gray-500 mt-1 text-right">
            {trainer.utilization}% utilized
          </p>
        </div>
      ))}
      
      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Average utilization</span>
          <span className="font-semibold text-white">74%</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-500">Total sessions</span>
          <span className="font-semibold text-white">44</span>
        </div>
      </div>
    </div>
  )
}
