'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DailyDataPoint {
  date: string;
  revenue: number;
}

interface MonthlyDataPoint {
  month: string;
  revenue: number;
}

const dailyData: DailyDataPoint[] = [
  { date: 'Mon', revenue: 15000 },
  { date: 'Tue', revenue: 22000 },
  { date: 'Wed', revenue: 18000 },
  { date: 'Thu', revenue: 32000 },
  { date: 'Fri', revenue: 28000 },
  { date: 'Sat', revenue: 45000 },
  { date: 'Sun', revenue: 38000 }
];

const monthlyData: MonthlyDataPoint[] = [
  { month: 'Jan', revenue: 95000 },
  { month: 'Feb', revenue: 120000 },
  { month: 'Mar', revenue: 110000 },
  { month: 'Apr', revenue: 145000 },
  { month: 'May', revenue: 130000 },
  { month: 'Jun', revenue: 165000 }
];

export function FinancialsRevenueChart() {
  return (
    <div className="grid md:grid-cols-2 gap-6 w-full">
      {/* Daily Revenue Area Chart */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase text-center">Daily Revenue Trend (DZD)</h4>
        <div className="h-[250px] w-full border rounded-lg p-2 bg-card">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} width={50} />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} DA`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase text-center">Monthly Revenue Trend (DZD)</h4>
        <div className="h-[250px] w-full border rounded-lg p-2 bg-card">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} width={55} />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} DA`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default FinancialsRevenueChart;
