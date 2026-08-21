'use client';

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PerformanceDataPoint {
  name: string;
  revenue: number;
  views: number;
}

interface AnalyticsPerformanceChartProps {
  timePeriod: string; // 'month' | '6months' | 'year'
}

const dataMonth: PerformanceDataPoint[] = [
  { name: 'Week 1', revenue: 220000, views: 1200 },
  { name: 'Week 2', revenue: 310000, views: 1800 },
  { name: 'Week 3', revenue: 280000, views: 1400 },
  { name: 'Week 4', revenue: 440340, views: 2500 }
];

const data6Months: PerformanceDataPoint[] = [
  { name: 'Jan', revenue: 950000, views: 6000 },
  { name: 'Feb', revenue: 1100000, views: 7200 },
  { name: 'Mar', revenue: 850000, views: 5100 },
  { name: 'Apr', revenue: 1300000, views: 8900 },
  { name: 'May', revenue: 1200000, views: 7800 },
  { name: 'Jun', revenue: 1550340, views: 9200 }
];

const dataYear: PerformanceDataPoint[] = [
  { name: 'Q1', revenue: 2900000, views: 18300 },
  { name: 'Q2', revenue: 3850000, views: 24900 },
  { name: 'Q3', revenue: 3100000, views: 20100 },
  { name: 'Q4', revenue: 4750000, views: 31000 }
];

export default function AnalyticsPerformanceChart({ timePeriod }: AnalyticsPerformanceChartProps) {
  let chartData = dataMonth;
  if (timePeriod === '6months') {
    chartData = data6Months;
  } else if (timePeriod === 'year') {
    chartData = dataYear;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{
          top: 10,
          right: 20,
          left: 10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={11} tickLine={false} />
        <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" fontSize={11} tickLine={false} unit=" DA" width={70} />
        <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} unit=" views" width={60} />
        <Tooltip
          formatter={(value: any, name: any) => {
            if (name === 'Revenue') return [`${value.toLocaleString()} DA`, name];
            return [`${value.toLocaleString()} views`, name];
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <Bar yAxisId="left" dataKey="revenue" fill="#4f46e5" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={45} />
        <Line yAxisId="right" type="monotone" dataKey="views" stroke="#10b981" name="Page Views" strokeWidth={2} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
