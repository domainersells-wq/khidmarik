'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  LifeBuoy, 
  Search, 
  MessageSquare, 
  Send, 
  Archive, 
  Users, 
  BookOpen, 
  Plus, 
  Trash2, 
  FileText,
  ShieldAlert,
  Headset,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export function PlatformSupportSection() {
  const { toast } = useToast();
  
  // Tab controller state
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'chats'>('tickets');

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            user:profiles(name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = data.map((t: any) => ({
          id: t.id,
          ticketNumber: t.id.split('-')[0].toUpperCase(),
          professionalName: t.user?.name || 'User',
          issueSummary: t.subject,
          description: t.description,
          category: 'Platform Support',
          status: t.status === 'open' ? 'Open' : t.status === 'resolved' ? 'Resolved' : 'Closed',
          priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
          lastUpdate: t.created_at,
        }));
        
        setTickets(mapped.length > 0 ? mapped : [
          {
            id: '1',
            ticketNumber: 'TCK-9281',
            professionalName: 'Mounir Plumber',
            issueSummary: 'Payment Gateway Connection Delay',
            description: 'Customer completed plumbing booking, but the Escrow amount did not show in pending balance.',
            category: 'Financials',
            status: 'Open',
            priority: 'High',
            lastUpdate: new Date().toISOString()
          },
          {
            id: '2',
            ticketNumber: 'TCK-8219',
            professionalName: 'Karim Brahimi',
            issueSummary: 'Banner image upload dimensions mismatch',
            description: 'Shop dashboard rejects banner upload of size 1920x1080.',
            category: 'Uploads',
            status: 'Resolved',
            priority: 'Medium',
            lastUpdate: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      } catch (err) {
        console.error('Error fetching support tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // FAQ state
  const [faqs, setFaqs] = useState([
    { id: 'faq-1', question: 'How do I withdraw my earnings?', answer: 'Earnings are transferred to CCP bank accounts upon request in the Payouts tab.', role: 'vendor' },
    { id: 'faq-2', question: 'What is the platform checkout commission?', answer: 'Platform deducts 10% commission on product sales, and 15% on booking reservations.', role: 'general' }
  ]);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqRole, setNewFaqRole] = useState('general');

  // Live chats state (for moderation / inspection)
  const [activeChats, setActiveChats] = useState([
    { id: 'chat-1', client: 'Mourad Client', merchant: 'DzTech Electronics', lastMsg: 'Is the product available in store?', time: '2 mins ago', status: 'Active' },
    { id: 'chat-2', client: 'Karim Brahimi', merchant: 'Yacine Plumber', lastMsg: 'I have arrived at the location.', time: '1 hour ago', status: 'Closed' }
  ]);
  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setReplyText('');
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    toast({
      title: "Reply Sent Successfully",
      description: `Notification sent to client regarding ticket #${selectedTicket.ticketNumber}.`,
    });
    setReplyText('');
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const dbStatus = newStatus === 'Open' ? 'open' : newStatus === 'Resolved' ? 'resolved' : 'closed';
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: dbStatus })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets((prev: any[]) => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Status Updated",
        description: `Ticket status has been updated to ${newStatus}.`,
      });
    } catch (e: any) {
      toast({
        title: "Error updating status",
        description: e.message,
        variant: "destructive"
      });
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const newEntry = {
      id: 'faq-' + Date.now(),
      question: newFaqQuestion,
      answer: newFaqAnswer,
      role: newFaqRole
    };
    setFaqs([...faqs, newEntry]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setIsFaqOpen(false);
    toast({
      title: "FAQ Article Added",
      description: "Knowledge Base article registered and visible to target roles.",
    });
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
    toast({
      title: "FAQ Article Deleted",
      description: "Removed article from help desk archives.",
      variant: "destructive"
    });
  };

  const filteredTickets = tickets.filter(t => 
    t.issueSummary.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.professionalName.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.ticketNumber.includes(ticketSearch)
  );

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" /> Support & Resolution Center
          </h1>
          <p className="text-xs text-muted-foreground">Manage user support threads, update tutorial archives, and inspect client-merchant live message rooms.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'tickets' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('tickets')}
          >
            Support Tickets
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'faq' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ Builder
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg text-xs font-semibold px-3 h-8 ${activeTab === 'chats' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('chats')}
          >
            Live Chats Log
          </Button>
        </div>
      </header>

      {/* Support Tickets tab */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets list */}
          <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Headset className="h-4.5 w-4.5 text-primary" /> Inbox Queue</CardTitle>
              <CardDescription className="text-xs">Search or reply to ticket conversations.</CardDescription>
              <div className="relative w-full flex items-center bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-2.5 py-1 mt-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-1.5" />
                <Input 
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Filter tickets..."
                  className="border-none bg-transparent h-8 p-0 text-xs w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1 max-h-[360px] overflow-y-auto custom-sidebar-scrollbar">
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  onClick={() => handleViewTicket(ticket)}
                  className={`p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all ${
                    selectedTicket?.id === ticket.id ? 'bg-primary/5 border border-primary/20 shadow-sm' : 'border border-transparent'
                  }`}
                >
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{ticket.issueSummary}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">From: {ticket.professionalName} (#{ticket.ticketNumber})</p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant={ticket.status === 'Open' ? 'default' : 'secondary'} className="text-[9px] font-bold">
                      {ticket.status}
                    </Badge>
                    <span className="text-[9px] text-slate-400 font-semibold">{formatDistanceToNow(new Date(ticket.lastUpdate), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat thread */}
          <Card className="lg:col-span-2 border rounded-2xl shadow-sm bg-card flex flex-col justify-between min-h-[400px]">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-primary" /> Conversation Thread
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedTicket ? `Ticket #${selectedTicket.ticketNumber} • ${selectedTicket.professionalName}` : 'Select a ticket to review issue logs.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 flex-grow space-y-3 max-h-[220px] overflow-y-auto custom-sidebar-scrollbar">
              {selectedTicket ? (
                <>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl space-y-1 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Issue summary: {selectedTicket.issueSummary}</p>
                    <p className="text-[10px] text-muted-foreground">Category: {selectedTicket.category} • Priority: {selectedTicket.priority}</p>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-xs text-slate-800 dark:text-slate-200">
                      Hello support team, I have been attempting to update my shop description and banner image but the Yalidine API returns an internal error. Please advise.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[80%] text-xs">
                      We have traced the request logs. The error occurs due to character limits in the API callback address. Adjusting it resolves the synchronization delay.
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-12">No ticket selected.</p>
              )}
            </CardContent>

            {selectedTicket && (
              <CardFooter className="border-t p-3.5 flex flex-col gap-3">
                <Textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Compose reply email alert to applicant..."
                  className="rounded-xl text-xs min-h-[70px] border-input"
                />
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-2">
                    <Select onValueChange={(val) => handleTicketStatusChange(selectedTicket.id, val)}>
                      <SelectTrigger className="w-32 rounded-xl h-9 text-xs bg-slate-50 dark:bg-slate-900 border-input font-semibold text-slate-600 dark:text-slate-300">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Ticket archived' })} className="rounded-xl h-9 text-xs bg-white dark:bg-slate-900 border-input hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">Archive</Button>
                  </div>
                  <Button onClick={handleSendReply} className="rounded-xl h-9 text-xs px-4 bg-primary text-primary-foreground flex items-center gap-1"><Send className="h-4 w-4" /> Send Reply</Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      )}

      {/* FAQ Builder Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><BookOpen className="h-4.5 w-4.5 text-primary" /> Frequently Asked Questions (FAQ)</CardTitle>
                <CardDescription className="text-xs">Update self-service articles visible on merchant and customer help tabs.</CardDescription>
              </div>
              <Button onClick={() => setIsFaqOpen(true)} className="rounded-xl h-10 text-xs flex items-center gap-1.5 bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Add FAQ Article
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="border p-3.5 rounded-xl flex justify-between items-start gap-4 hover:shadow-sm transition-shadow">
                  <div className="space-y-1.5 text-xs text-left rtl:text-right">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">{faq.role}</Badge>
                      <h4 className="font-bold text-slate-800">{faq.question}</h4>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-lg" onClick={() => handleDeleteFaq(faq.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live chats list tab */}
      {activeTab === 'chats' && (
        <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-primary" /> Active Platform Conversations</CardTitle>
            <CardDescription className="text-xs">Audit active direct chat rooms between platform clients and service/store merchants.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead className="text-xs font-bold">Client</TableHead>
                  <TableHead className="text-xs font-bold">Merchant Partner</TableHead>
                  <TableHead className="text-xs font-bold">Last Transmitted Message</TableHead>
                  <TableHead className="text-xs font-bold">Sent</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeChats.map((chat) => (
                  <TableRow key={chat.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                    <TableCell className="text-xs font-semibold">{chat.client}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">{chat.merchant}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{chat.lastMsg}</TableCell>
                    <TableCell className="text-xs">{chat.time}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={chat.status === 'Active' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40 text-[10px]' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 text-[10px]'}>
                        {chat.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" size="sm" onClick={() => toast({ title: 'Accessing chat log logs' })} className="text-xs font-semibold text-primary">View Log Logs</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New FAQ Modal */}
      <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
        <DialogContent className="rounded-2xl max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add FAQ Article</DialogTitle>
            <DialogDescription className="text-xs">Create a knowledge base article entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2 text-left rtl:text-right text-xs">
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">FAQ Question</Label>
              <Input value={newFaqQuestion} onChange={(e) => setNewFaqQuestion(e.target.value)} placeholder="Question details..." className="rounded-xl h-10 border-input" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">FAQ Answer</Label>
              <Textarea value={newFaqAnswer} onChange={(e) => setNewFaqAnswer(e.target.value)} placeholder="Answer summary..." className="rounded-xl border-input min-h-[80px]" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold text-slate-700">Target Role Audience</Label>
              <Select value={newFaqRole} onValueChange={setNewFaqRole}>
                <SelectTrigger className="rounded-xl h-10 border-input">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="general">General Public</SelectItem>
                  <SelectItem value="vendor">Store Owners</SelectItem>
                  <SelectItem value="provider">Service Providers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setIsFaqOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-xs h-9 bg-primary" onClick={handleAddFaq}>Create FAQ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
