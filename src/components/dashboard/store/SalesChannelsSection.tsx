'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Share2, RefreshCw, CheckCircle2, AlertCircle, 
  Settings, Globe, Facebook, MessageCircle, BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SalesChannel {
  id: string;
  name: string;
  platform: string;
  type: 'native' | 'social' | 'external';
  isConnected: boolean;
  syncedProducts: number;
  syncedOrders: number;
  lastSync: string;
}

const initialChannels: SalesChannel[] = [
  { id: 'chan1', name: 'Khidmatik Native Store App', platform: 'Khidmatik', type: 'native', isConnected: true, syncedProducts: 45, syncedOrders: 1024, lastSync: 'Real-time' },
  { id: 'chan2', name: 'Facebook Catalog Integration', platform: 'Facebook Meta', type: 'social', isConnected: true, syncedProducts: 40, syncedOrders: 312, lastSync: '10 mins ago' },
  { id: 'chan3', name: 'Instagram Shopping Feed', platform: 'Instagram Meta', type: 'social', isConnected: false, syncedProducts: 0, syncedOrders: 0, lastSync: 'Never' },
  { id: 'chan4', name: 'Ouedkniss Sync Engine', platform: 'Ouedkniss.com', type: 'external', isConnected: true, syncedProducts: 12, syncedOrders: 89, lastSync: '2 hours ago' },
  { id: 'chan5', name: 'Retail Store POS Terminal', platform: 'Custom POS API', type: 'external', isConnected: false, syncedProducts: 45, syncedOrders: 0, lastSync: 'Never' },
];

export function SalesChannelsSection() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<SalesChannel[]>(initialChannels);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const toggleConnection = (id: string, currentStatus: boolean) => {
    setChannels(prev => prev.map(chan => {
      if (chan.id === id) {
        toast({
          title: currentStatus ? 'Channel Disabled' : 'Channel Enabled',
          description: `"${chan.name}" has been ${currentStatus ? 'disconnected' : 'connected'} successfully.`,
        });
        return { 
          ...chan, 
          isConnected: !currentStatus,
          syncedProducts: !currentStatus ? 45 : 0,
          lastSync: !currentStatus ? 'Just now' : 'Never'
        };
      }
      return chan;
    }));
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      setChannels(prev => prev.map(chan => {
        if (chan.isConnected) {
          return { ...chan, lastSync: 'Just now' };
        }
        return chan;
      }));
      toast({
        title: 'All Active Channels Synced',
        description: 'Products, catalog updates, and order queues are fully up to date.',
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Share2 className="h-8 w-8 text-primary" /> Sales Channels (قنوات البيع)
          </h1>
          <p className="text-muted-foreground">Manage multi-channel selling, sync catalogs to social media, and download orders from Ouedkniss or POS.</p>
        </div>
        <Button 
          onClick={handleSyncAll} 
          disabled={isSyncingAll}
          className="bg-primary text-white flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
          {isSyncingAll ? 'Syncing Catalog...' : 'Force Sync All Channels'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Active Channels</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono">
              {channels.filter(c => c.isConnected).length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Simultaneously synchronized</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Synced Products</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-primary">
              {channels.reduce((acc, curr) => acc + curr.syncedProducts, 0)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Catalog items listed</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>External Orders</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600">
              {channels.reduce((acc, curr) => acc + curr.syncedOrders, 0)}
            </div>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Imported automatically</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>API Status</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-6 w-6 text-green-500" /> ONLINE
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sync engines operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid of channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channels.map(chan => (
          <Card key={chan.id} className="shadow border overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-4 flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center text-slate-500 font-bold shadow-sm">
                  {chan.platform === 'Khidmatik' && <Globe className="h-5 w-5 text-primary" />}
                  {chan.platform === 'Facebook Meta' && <Facebook className="h-5 w-5 text-blue-600" />}
                  {chan.platform === 'Instagram Meta' && <Share2 className="h-5 w-5 text-pink-600" />}
                  {chan.platform === 'Ouedkniss.com' && <Globe className="h-5 w-5 text-yellow-600" />}
                  {chan.platform === 'Custom POS API' && <BarChart3 className="h-5 w-5 text-slate-600" />}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{chan.name}</CardTitle>
                  <CardDescription className="text-[11px] font-mono">{chan.platform}</CardDescription>
                </div>
              </div>
              <Switch 
                checked={chan.isConnected} 
                onCheckedChange={() => toggleConnection(chan.id, chan.isConnected)}
              />
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded border">
                  <p className="text-[10px] text-muted-foreground uppercase">Products</p>
                  <p className="font-mono font-bold mt-0.5">{chan.syncedProducts}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border">
                  <p className="text-[10px] text-muted-foreground uppercase">Synced Orders</p>
                  <p className="font-mono font-bold mt-0.5">{chan.syncedOrders}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border">
                  <p className="text-[10px] text-muted-foreground uppercase">Sync Status</p>
                  <Badge variant={chan.isConnected ? 'default' : 'secondary'} className={`mt-1 text-[9px] ${chan.isConnected ? 'bg-green-500 text-white' : ''}`}>
                    {chan.isConnected ? 'CONNECTED' : 'OFFLINE'}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                <span>Sync frequency: <strong>{chan.type === 'native' ? 'Instant API push' : 'Every 15 mins'}</strong></span>
                <span>Last updated: <strong>{chan.lastSync}</strong></span>
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t bg-slate-50/20 flex justify-end gap-2">
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground flex items-center gap-1">
                <Settings className="h-3.5 w-3.5" /> Channel Config
              </Button>
              {chan.isConnected && (
                <Button size="sm" variant="outline" className="text-xs flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Sync Now
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
