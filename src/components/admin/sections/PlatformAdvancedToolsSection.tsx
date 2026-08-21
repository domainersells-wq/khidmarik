'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Bot, 
  Send, 
  Key, 
  Link as LinkIcon, 
  Activity, 
  Cpu, 
  Lock, 
  Plus, 
  Trash2,
  Settings,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';

export function PlatformAdvancedToolsSection() {
  const { toast } = useToast();
  
  // Tab controller state
  const [activeTab, setActiveTab] = useState<'ai' | 'api'>('ai');

  // AI chat input
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: 'user' | 'ai', text: string }>>([
    { sender: 'ai', text: 'Hello Platform Admin! I can compute revenue growth, fetch active merchant metrics, or trace Yalidine delivery logs. Ask me anything.' }
  ]);

  // API states
  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'Yalidine Webhook Key', value: 'kh_live_9d8s2j...71s', created: '2026-07-01', status: 'Active' },
    { id: 'key-2', name: 'Mobile App Client', value: 'kh_live_1u9a3n...44x', created: '2026-06-15', status: 'Active' }
  ]);
  const [isNewKeyOpen, setIsNewKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // OAuth state
  const [oauthClients, setOauthClients] = useState([
    { id: 'oa-1', name: 'Google Single Sign-On', clientId: '8102371-goog.apps.googleusercontent.com', status: 'Connected' },
    { id: 'oa-2', name: 'Facebook Login API', clientId: 'fb_app_901827391028301', status: 'Connected' }
  ]);

  // Webhooks state
  const [webhooks, setWebhooks] = useState([
    { id: 'wh-1', event: 'order.created', target: 'https://api.my-crm.com/v1/orders', status: '200 OK', time: '1 min ago' },
    { id: 'wh-2', event: 'store.registered', target: 'https://analytics-tracker.net/webhook', status: '201 Created', time: '15 mins ago' },
    { id: 'wh-3', event: 'withdrawal.approved', target: 'https://finance-service.dz/api/events', status: '500 Server Error', time: '1 hour ago' }
  ]);

  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim()) return;
    
    const userQuery = aiChatInput.trim();
    const nextChat = [...aiChatHistory, { sender: 'user' as const, text: userQuery }];
    setAiChatHistory(nextChat);
    setAiChatInput('');

    // Generate smart mock answers
    setTimeout(() => {
      let reply = "I've scanned the database. Currently we have 320 active stores and 156 service providers. Daily volume is healthy with 48 orders processed.";
      if (userQuery.toLowerCase().includes('revenue') || userQuery.toLowerCase().includes('money')) {
        reply = "Daily processed revenue is 95,000 DA across 48 checkout actions. Commissions net profit is approximately 14,250 DA.";
      } else if (userQuery.toLowerCase().includes('error') || userQuery.toLowerCase().includes('fail')) {
        reply = "System logs show 1 failed webhook target to finance-service.dz. CPU and database metrics are healthy at 14% usage.";
      }
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 800);
  };

  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) return;
    const randomKey = `kh_live_${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 5)}`;
    const newEntry = {
      id: 'key-' + Date.now(),
      name: newKeyName,
      value: randomKey,
      created: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    setApiKeys([...apiKeys, newEntry]);
    setNewKeyName('');
    setIsNewKeyOpen(false);
    toast({
      title: "API Key Generated",
      description: `Bearer credential successfully registered for ${newKeyName}.`,
    });
  };

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast({
      title: "API Key Revoked",
      description: "Credential deactivated and removed from access pools.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI assistant & API integrations
          </h1>
          <p className="text-xs text-muted-foreground">Engage with AI analytical models, configure OAuth login gateways, and generate system integration webhooks.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'ai' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Assistant
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'api' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('api')}
          >
            API & Webhooks
          </Button>
        </div>
      </header>

      {/* AI Assistant Tab */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border rounded-2xl shadow-sm bg-card flex flex-col min-h-[400px]">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Bot className="h-4.5 w-4.5 text-primary" /> AI Admin Assistant</CardTitle>
              <CardDescription className="text-xs">Ask natural questions to fetch summaries, logs, database reports, or system statistics.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="flex-grow space-y-3 max-h-[260px] overflow-y-auto custom-sidebar-scrollbar p-1">
                {aiChatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      chat.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-900/50 border text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAiChatSubmit} className="flex gap-2">
                <Input 
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Ask for site logs, commissioning statistics..."
                  className="rounded-xl h-10 border-input text-xs"
                />
                <Button type="submit" className="rounded-xl h-10 px-4 bg-primary text-primary-foreground"><Send className="h-4.5 w-4.5" /></Button>
              </form>
            </CardContent>
          </Card>

          {/* Performance stats sidebar */}
          <Card className="border rounded-2xl shadow-sm bg-card">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-800">Scoring & Benchmarks</CardTitle>
              <CardDescription className="text-xs">Metrics configured automatically based on customer feedback and response latencies.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>Tech Universe store:</span>
                  <strong className="text-primary font-bold">95/100 (Top)</strong>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Rapid Plumbing service:</span>
                  <strong className="text-primary font-bold">92/100</strong>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Average provider response:</span>
                  <strong>4.2 minutes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Checkout conversion rate:</span>
                  <strong>3.8%</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API & Webhooks Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* API Keys Table */}
          <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Key className="h-4.5 w-4.5 text-primary" /> Authorized Integration API Keys</CardTitle>
                <CardDescription className="text-xs">Generate bearer secret credentials for server side checkouts and inventory integrations.</CardDescription>
              </div>
              <Button onClick={() => setIsNewKeyOpen(true)} className="rounded-xl h-10 text-xs flex items-center gap-1.5 bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Create API Key
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs font-bold">Client Name</TableHead>
                    <TableHead className="text-xs font-bold">Secret Key Value</TableHead>
                    <TableHead className="text-xs font-bold">Issued Date</TableHead>
                    <TableHead className="text-xs font-bold">Access Status</TableHead>
                    <TableHead className="text-right text-xs font-bold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="text-xs font-semibold text-slate-800">{item.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{item.value}</TableCell>
                      <TableCell className="text-xs">{item.created}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" onClick={() => handleDeleteApiKey(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Webhooks Trigger Log & OAuth Gateways */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webhooks */}
            <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><LinkIcon className="h-4.5 w-4.5 text-primary" /> Active Webhook Event Streams</CardTitle>
                <CardDescription className="text-xs">Platform dispatch events sent to registered third party developer URL endpoints.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-xs font-bold">Event Type</TableHead>
                      <TableHead className="text-xs font-bold">Target URL Endpoint</TableHead>
                      <TableHead className="text-xs font-bold">Server Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <TableCell className="text-xs font-mono font-semibold">{item.event}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground max-w-[180px] truncate" title={item.target}>{item.target}</TableCell>
                        <TableCell className="text-[10px]">
                          <Badge variant="outline" className={item.status.includes('Error') ? 'bg-red-50 text-red-700 border-red-150' : 'bg-green-50 text-green-700 border-green-150'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* OAuth Single Sign-on Clients */}
            <Card className="border rounded-2xl shadow-sm bg-card">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Lock className="h-4.5 w-4.5 text-primary" /> Single Sign-on OAuth Providers</CardTitle>
                <CardDescription className="text-xs">Authenticate client credentials using Google and Facebook developer applications.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {oauthClients.map((client) => (
                  <div key={client.id} className="flex justify-between items-center border rounded-xl p-3 bg-slate-50/50">
                    <div className="space-y-0.5 max-w-[80%] text-left rtl:text-right">
                      <h4 className="text-xs font-bold text-slate-800">{client.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">{client.clientId}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] shrink-0">{client.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* New API Key Dialog */}
      <Dialog open={isNewKeyOpen} onOpenChange={setIsNewKeyOpen}>
        <DialogContent className="rounded-2xl max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Generate API Key Credential</DialogTitle>
            <DialogDescription className="text-xs">Create a bearer token credentials to write database records securely via HTTP APIs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 text-left rtl:text-right my-2">
            <Label className="text-[11px] font-bold text-slate-700">Client Description Name</Label>
            <Input 
              value={newKeyName} 
              onChange={(e) => setNewKeyName(e.target.value)} 
              placeholder="e.g. ERP Inventory Sync" 
              className="rounded-xl text-xs h-10" 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsNewKeyOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-xs h-9 bg-primary" onClick={handleGenerateApiKey}>Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
