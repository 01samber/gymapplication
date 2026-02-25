'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Aug', revenue: 9500, pt: 6200, membership: 3300 },
  { month: 'Sep', revenue: 10200, pt: 6800, membership: 3400 },
  { month: 'Oct', revenue: 11800, pt: 7500, membership: 4300 },
  { month: 'Nov', revenue: 12100, pt: 7800, membership: 4300 },
  { month: 'Dec', revenue: 13200, pt: 8400, membership: 4800 },
  { month: 'Jan', revenue: 14250, pt: 9000, membership: 5250 },
]

export default function RevenueChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c1272d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c1272d" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00a651" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00a651" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Area
            type="monotone"
            dataKey="pt"
            name="PT Revenue"
            stroke="#00a651"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPT)"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Total Revenue"
            stroke="#c1272d"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-red"></div>
          <span className="text-sm text-gray-400">Total Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-gray-400">PT Revenue</span>
        </div>
      </div>
    </div>
  )
}
