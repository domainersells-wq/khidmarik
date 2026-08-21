
'use client';

import { useState, useEffect } from 'react';
import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, PieChart } from 'lucide-react';
import { getConversionFunnelData } from '@/lib/firebase';
import type { ConversionFunnelData } from '@/types';

export function ConversionFunnelChart() {
  const [data, setData] = useState<ConversionFunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const funnelData = await getConversionFunnelData(devMode);
        setData(funnelData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
        console.warn('Error fetching or displaying chart data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [devMode]);

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
          <p>No data yet. Ensure events are enabled in Firebase.</p>
        </div>
      );
    }

    return (
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="count" data={data.sort((a, b) => b.count - a.count)} isAnimationActive>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList position="right" fill="#000" stroke="none" dataKey="step" className="text-xs font-semibold"/>
              <LabelList position="center" fill="#fff" stroke="none" dataKey="count" className="text-sm font-bold"/>
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5 text-primary"/> Conversion Funnel</CardTitle>
                <CardDescription>Customer journey from visit to purchase.</CardDescription>
            </div>
            <div className="flex items-center space-x-2 pt-1">
                <Label htmlFor="devMode-toggle" className="text-xs text-muted-foreground">Test Mode</Label>
                <Switch id="devMode-toggle" checked={devMode} onCheckedChange={setDevMode} />
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderContent()}
        {data.length > 0 && (
          <p className="text-center text-lg font-bold">Visits &rarr; Signed Up &rarr; Purchased</p>
        )}
      </CardContent>
    </Card>
  );
}
