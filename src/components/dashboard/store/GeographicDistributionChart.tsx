
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapIcon } from 'lucide-react';
import { getOrdersPerWilaya } from '@/lib/firebase';
import type { GeographicOrderData } from '@/types';

type TimePeriod = 'day' | 'week' | 'month';

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border border-border rounded-md shadow-lg text-sm">
        <p className="font-bold">{label}</p>
        <p className="text-muted-foreground">Orders: <span className="font-medium text-foreground">{data.count.toLocaleString()}</span></p>
        <p className="text-muted-foreground">Sales: <span className="font-medium text-foreground">{data.total.toLocaleString()} DA</span></p>
      </div>
    );
  }
  return null;
};

export function GeographicDistributionChart() {
  const [data, setData] = useState<GeographicOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const geoData = await getOrdersPerWilaya(devMode, timePeriod);
        // Sort data in descending order by count
        const sortedData = geoData.sort((a, b) => b.count - a.count);
        setData(sortedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching geographic data.');
        }
        console.warn('Error fetching or displaying geographic chart data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [devMode, timePeriod]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[250px] w-full" />;
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10">
          <p>There is no sales data to display currently.</p>
        </div>
      );
    }

    return (
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="wilaya"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center"><MapIcon className="mr-2 h-5 w-5 text-primary"/> Geographic Sales Distribution</CardTitle>
            <CardDescription>Number of orders per Wilaya.</CardDescription>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Label htmlFor="devMode-toggle-geo" className="text-xs text-muted-foreground">Test Mode</Label>
            <Switch id="devMode-toggle-geo" checked={devMode} onCheckedChange={setDevMode} />
          </div>
        </div>
         <div className="flex items-center gap-2 mt-4">
            <Button variant={timePeriod === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setTimePeriod('day')}>Day</Button>
            <Button variant={timePeriod === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setTimePeriod('week')}>Week</Button>
            <Button variant={timePeriod === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setTimePeriod('month')}>Month</Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    