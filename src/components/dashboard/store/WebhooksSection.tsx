'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Webhook, Send, Code, Terminal, CheckCircle2, 
  HelpCircle, RefreshCw, Plus, Trash2, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  endpoint: string;
  statusCode: number;
  durationMs: number;
}

const initialLogs: WebhookLog[] = [
  { id: 'wh_evt_9081', timestamp: '2026-07-07 11:15:22', event: 'order.created', endpoint: 'https://mycrm.com/api/webhooks', statusCode: 200, durationMs: 145 },
  { id: 'wh_evt_9075', timestamp: '2026-07-07 10:45:00', event: 'order.shipped', endpoint: 'https://mycrm.com/api/webhooks', statusCode: 200, durationMs: 220 },
  { id: 'wh_evt_9022', timestamp: '2026-07-06 14:15:10', event: 'order.failed', endpoint: 'https://mycrm.com/api/webhooks', statusCode: 500, durationMs: 1200 },
];

export function WebhooksSection() {
  const { toast } = useToast();
  const [endpointUrl, setEndpointUrl] = useState('https://mycrm.com/api/webhooks');
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEvent, setTestEvent] = useState('order.created');
  const [testPayload, setTestPayload] = useState<string | null>(null);

  // Active triggers
  const [triggers, setTriggers] = useState({
    created: true,
    shipped: true,
    failed: true,
    refunded: false,
    inventoryLow: false
  });

  const handleSaveEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Webhook Saved', description: `Webhook endpoint URL updated to ${endpointUrl}.` });
  };

  const triggerTestPayload = () => {
    setIsSendingTest(true);
    
    // Generate beautiful mock JSON payload based on event selection
    let sampleData: any = {
      event: testEvent,
      timestamp: new Date().toISOString(),
      storeId: 'store_kh_9021',
      data: {}
    };

    if (testEvent === 'order.created') {
      sampleData.data = {
        orderId: 'ORD-1092',
        customer: { name: 'Amine Belkaid', phone: '0550123456', email: 'amine@mail.dz' },
        items: [{ sku: 'OLIV-001', name: 'Organic Olive Oil (1L)', qty: 2, price: 1500 }],
        shippingCost: 600,
        totalAmount: 3600,
        courier: 'Yalidine',
        city: 'Algiers'
      };
    } else if (testEvent === 'order.shipped') {
      sampleData.data = {
        orderId: 'ORD-1013',
        trackingNumber: 'YAL-TRK-7728109',
        courier: 'Yalidine',
        dispatchDate: new Date().toISOString().split('T')[0]
      };
    } else {
      sampleData.data = {
        orderId: 'ORD-1002',
        failureReason: 'Buyer Unreachable',
        failedAttempts: 3,
        courier: 'Yalidine'
      };
    }

    setTestPayload(JSON.stringify(sampleData, null, 2));

    setTimeout(() => {
      setIsSendingTest(false);
      const newLog: WebhookLog = {
        id: 'wh_evt_' + Math.floor(Math.random() * 9000 + 1000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        event: testEvent,
        endpoint: endpointUrl,
        statusCode: 200,
        durationMs: Math.floor(Math.random() * 200 + 50)
      };
      setLogs([newLog, ...logs]);
      toast({ title: 'Test Webhook Triggered', description: 'Endpoint responded with Status 200 OK.' });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Webhook className="h-8 w-8 text-primary animate-pulse" /> Webhooks & Dev Tools (الويب هوك)
          </h1>
          <p className="text-muted-foreground">Subscribe to real-time e-commerce events, sync CRM software, and dispatch order payloads dynamically.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Active Webhook Target</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm font-semibold truncate font-mono text-primary mt-1">{endpointUrl}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Single destination endpoint</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Delivered (30 Days)</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono">1,424</div>
            <p className="text-[10px] text-muted-foreground mt-1">Total triggered events</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Success Rate</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-green-600">99.2%</div>
            <p className="text-[10px] text-green-600 font-semibold mt-1">Status 2xx response codes</p>
          </CardContent>
        </Card>
        <Card className="shadow border">
          <CardHeader className="p-4 pb-2"><CardDescription>Avg Response Time</CardDescription></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-blue-600">180 ms</div>
            <p className="text-[10px] text-muted-foreground mt-1">HTTP request latency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Config Endpoint */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow border">
            <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-1.5"><Webhook className="h-4 w-4 text-primary" /> Endpoint Configuration</CardTitle>
              <CardDescription>Setup the destination URL that will receive JSON payloads.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveEndpoint}>
              <CardContent className="p-4 pt-0 space-y-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="webhookUrl">Target Endpoint URL *</Label>
                  <Input 
                    id="webhookUrl" 
                    placeholder="https://yourdomain.com/webhooks" 
                    className="font-mono text-xs"
                    value={endpointUrl} 
                    onChange={e => setEndpointUrl(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Event Subscriptions</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="c1" checked={triggers.created} onCheckedChange={(val: any) => setTriggers({ ...triggers, created: !!val })} />
                      <Label htmlFor="c1" className="text-xs">`order.created` (New checkout order)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="c2" checked={triggers.shipped} onCheckedChange={(val: any) => setTriggers({ ...triggers, shipped: !!val })} />
                      <Label htmlFor="c2" className="text-xs">`order.shipped` (In transit waybill)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="c3" checked={triggers.failed} onCheckedChange={(val: any) => setTriggers({ ...triggers, failed: !!val })} />
                      <Label htmlFor="c3" className="text-xs">`order.failed` (Delivery incident)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="c4" checked={triggers.refunded} onCheckedChange={(val: any) => setTriggers({ ...triggers, refunded: !!val })} />
                      <Label htmlFor="c4" className="text-xs">`order.refunded` (Return refund)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="c5" checked={triggers.inventoryLow} onCheckedChange={(val: any) => setTriggers({ ...triggers, inventoryLow: !!val })} />
                      <Label htmlFor="c5" className="text-xs">`inventory.low` (Out of stock warning)</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-end bg-slate-50/50">
                <Button type="submit" className="bg-primary text-white">Save Webhook Subscription</Button>
              </CardFooter>
            </form>
          </Card>

          {/* Webhook History Logs */}
          <Card className="shadow border">
            <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-1.5"><Terminal className="h-4 w-4 text-primary" /> Delivery Logs (Recent 24 Hours)</CardTitle>
              <CardDescription>Track status codes returned by your endpoint server.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery ID</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Response Code</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead>Executed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-[11px] text-slate-700">{log.id}</TableCell>
                      <TableCell className="font-mono text-[11px] font-semibold text-primary">{log.event}</TableCell>
                      <TableCell>
                        <Badge className={log.statusCode === 200 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                          HTTP {log.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{log.durationMs} ms</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Webhook Tester tool */}
        <div>
          <Card className="shadow border bg-slate-900 text-slate-100 overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="p-4 border-b border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-100"><Code className="h-4 w-4 text-primary" /> Instant Webhook Tester</CardTitle>
              <CardDescription className="text-slate-400 text-[11px]">Generate and dispatch custom event JSON templates directly into your API.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-4">
              <div className="space-y-1">
                <Label htmlFor="testEventSelect" className="text-slate-300">Choose Event template</Label>
                <Select value={testEvent} onValueChange={setTestEvent}>
                  <SelectTrigger id="testEventSelect" className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 text-slate-100 border-slate-700">
                    <SelectItem value="order.created">`order.created` (New order)</SelectItem>
                    <SelectItem value="order.shipped">`order.shipped` (In transit)</SelectItem>
                    <SelectItem value="order.failed">`order.failed` (Delivery failed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {testPayload && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">JSON Payload:</span>
                  <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] overflow-auto max-h-[220px] font-mono text-green-400">
                    {testPayload}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <Button 
                onClick={triggerTestPayload} 
                disabled={isSendingTest}
                className="w-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 text-xs py-2 h-9"
              >
                {isSendingTest ? 'Dispatching HTTP POST...' : <><Send className="h-3.5 w-3.5" /> Dispatch Test Event</>}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
