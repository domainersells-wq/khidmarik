'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock charts data
const ordersPerDayData = [
  { day: 'Mon', orders: 12 },
  { day: 'Tue', orders: 19 },
  { day: 'Wed', orders: 15 },
  { day: 'Thu', orders: 25 },
  { day: 'Fri', orders: 22 },
  { day: 'Sat', orders: 34 },
  { day: 'Sun', orders: 28 }
];

const revenueData = [
  { month: 'Jan', revenue: 95000 },
  { month: 'Feb', revenue: 120000 },
  { month: 'Mar', revenue: 110000 },
  { month: 'Apr', revenue: 145000 },
  { month: 'May', revenue: 130000 },
  { month: 'Jun', revenue: 165000 }
];

const returnsData = [
  { name: 'Completed', value: 85, fill: '#10b981' },
  { name: 'Returned', value: 10, fill: '#f59e0b' },
  { name: 'Cancelled', value: 5, fill: '#ef4444' }
];

const shippingPerfData = [
  { date: '06-25', onTime: 92 },
  { date: '06-26', onTime: 95 },
  { date: '06-27', onTime: 89 },
  { date: '06-28', onTime: 94 },
  { date: '06-29', onTime: 96 }
];

const topProductsData = [
  { name: 'Ceramic Mug', sales: 125 },
  { name: 'Leather Wallet', sales: 98 },
  { name: 'Harissa Paste', sales: 87 },
  { name: 'Olive Oil', sales: 64 }
];

const activeCitiesData = [
  { name: 'Algiers', value: 45, fill: '#4f46e5' },
  { name: 'Oran', value: 25, fill: '#3b82f6' },
  { name: 'Constantine', value: 18, fill: '#10b981' },
  { name: 'Sidi Bel Abbès', value: 12, fill: '#f59e0b' }
];

const courierPerfData = [
  { name: 'Yalidine', delivered: 94, pending: 6 },
  { name: 'EMS', delivered: 88, pending: 12 },
  { name: 'In-house', delivered: 98, pending: 2 }
];

export function OrdersAnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {/* Orders per Day */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">Orders per Day</h4>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ordersPerDayData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" fontSize={10} tickLine={false} />
              <YAxis fontSize={10} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="orders" stroke="#4f46e5" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">Monthly Revenue</h4>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={10} tickLine={false} />
              <YAxis fontSize={10} tickLine={false} width={45} />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} DA`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Returns & Cancellations */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">Order Returns Ratio</h4>
        <div className="h-[180px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie data={returnsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} labelLine={false}>
                {returnsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shipping Performance */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">On-Time Shipping %</h4>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={shippingPerfData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} tickLine={false} />
              <YAxis fontSize={10} tickLine={false} domain={[80, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'On Time']} />
              <Line type="monotone" dataKey="onTime" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">Top Selling Products</h4>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 5, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={10} tickLine={false} />
              <YAxis type="category" dataKey="name" fontSize={9} tickLine={false} width={75} />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" radius={[0, 3, 3, 0]} maxBarSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most Active Cities */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">Sales by City</h4>
        <div className="h-[180px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Pie data={activeCitiesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} labelLine={false}>
                {activeCitiesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Courier Performance */}
      <div className="space-y-2 border rounded-lg p-3 bg-card shadow-sm md:col-span-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase">Courier Delivery Success</h4>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courierPerfData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={10} tickLine={false} />
              <YAxis fontSize={10} tickLine={false} />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="delivered" stackId="a" fill="#10b981" name="Delivered (%)" />
              <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
