'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { MessageSquareWarning, Search, ListFilter, FilePlus2, LifeBuoy, BookOpen, Video, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultTickets = [
  { id: 'tkt1', ticketNumber: 'TKT-001', subject: 'Issue with payment withdrawal', category: 'billing', description: 'My withdrawal request from last week is still pending.', status: 'Open', lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), replies: [{ sender: 'support', text: 'We are looking into this. Please allow 3-5 business days.', time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }] },
  { id: 'tkt2', ticketNumber: 'TKT-002', subject: 'Cannot upload service images', category: 'technical', description: 'When I try to upload images for my service listing, I get an error.', status: 'Resolved', lastUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), replies: [{ sender: 'support', text: 'This has been fixed. Please try again.', time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }] },
];

export function SupportResolutionSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingTicket, setViewingTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  // New ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_support_tickets');
    if (saved) {
      try { setTickets(JSON.parse(saved)); } catch { setTickets(defaultTickets); }
    } else {
      setTickets(defaultTickets);
      localStorage.setItem('khidmatik_support_tickets', JSON.stringify(defaultTickets));
    }
  }, []);

  const persist = (updated: any[]) => {
    setTickets(updated);
    localStorage.setItem('khidmatik_support_tickets', JSON.stringify(updated));
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketCategory || !ticketDescription.trim()) {
      toast({ title: translate('validationError', 'Error'), description: translate('fillRequiredFields', 'Please fill all required fields.'), variant: 'destructive' });
      return;
    }
    const newTicket = {
      id: 'tkt_' + Date.now(),
      ticketNumber: 'TKT-' + String(tickets.length + 1).padStart(3, '0'),
      subject: ticketSubject.trim(),
      category: ticketCategory,
      description: ticketDescription.trim(),
      status: 'Open',
      lastUpdate: new Date().toISOString(),
      replies: [],
    };
    const updated = [newTicket, ...tickets];
    persist(updated);
    setTicketSubject('');
    setTicketCategory('');
    setTicketDescription('');
    toast({ title: translate('ticketSubmitted', 'Ticket Submitted'), description: translate('ticketSubmittedDesc', 'Your support request has been sent. We\'ll get back to you soon.') });
  };

  const handleReply = () => {
    if (!replyText.trim() || !viewingTicket) return;
    const updated = tickets.map(t => {
      if (t.id === viewingTicket.id) {
        const newReplies = [...t.replies, { sender: 'user', text: replyText.trim(), time: new Date().toISOString() }];
        return { ...t, replies: newReplies, lastUpdate: new Date().toISOString() };
      }
      return t;
    });
    persist(updated);
    setViewingTicket({ ...viewingTicket, replies: [...viewingTicket.replies, { sender: 'user', text: replyText.trim(), time: new Date().toISOString() }] });
    setReplyText('');
    toast({ title: translate('replySent', 'Reply Sent') });
  };

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return translate('justNow', 'Just now');
    if (hours < 24) return `${hours}h ${translate('ago', 'ago')}`;
    const days = Math.floor(hours / 24);
    return `${days}d ${translate('ago', 'ago')}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center"><LifeBuoy className="mr-3 h-8 w-8 text-primary" />{translate('helpSupport', 'Help & Support Center')}</h1>
        <p className="text-muted-foreground">{translate('getHelp', 'Get help, find answers, and manage your support requests.')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FilePlus2 className="mr-2 h-5 w-5" />{translate('submitRequest', 'Submit a New Support Request')}</CardTitle>
          <CardDescription>{translate('needHelp', 'Need help with the platform or have an issue? Let us know.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <Label htmlFor="ticket-subject">{translate('subject', 'Subject')}</Label>
              <Input id="ticket-subject" placeholder={translate('subjectPlaceholder', 'e.g., Issue with payment withdrawal')} value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ticket-category">{translate('category', 'Category')}</Label>
              <Select value={ticketCategory} onValueChange={setTicketCategory}>
                <SelectTrigger id="ticket-category"><SelectValue placeholder={translate('selectCategory', 'Select issue category...')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">{translate('technicalIssue', 'Technical Issue')}</SelectItem>
                  <SelectItem value="billing">{translate('billingPayment', 'Billing/Payment')}</SelectItem>
                  <SelectItem value="listing">{translate('serviceListing', 'Service Listing')}</SelectItem>
                  <SelectItem value="account">{translate('accountHelp', 'Account Help')}</SelectItem>
                  <SelectItem value="other">{translate('other', 'Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticket-description">{translate('describeIssue', 'Describe your issue')}</Label>
              <Textarea id="ticket-description" placeholder={translate('provideDetails', 'Please provide as much detail as possible...')} rows={5} value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} />
            </div>
            <Button type="submit">{translate('submitTicket', 'Submit Ticket')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5" />{translate('myTickets', 'My Support Tickets')}</CardTitle>
          <CardDescription>{translate('trackTickets', 'Track the status of your submitted support requests.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={translate('searchTickets', 'Search my tickets...')} className="ps-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('ticketId', 'Ticket ID')}</TableHead>
                  <TableHead>{translate('subject', 'Subject')}</TableHead>
                  <TableHead>{translate('lastUpdate', 'Last Update')}</TableHead>
                  <TableHead>{translate('tableStatusHeader', 'Status')}</TableHead>
                  <TableHead className="text-right">{translate('tableActionsHeader', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell className="truncate max-w-xs">{ticket.subject}</TableCell>
                    <TableCell>{formatTimeAgo(ticket.lastUpdate)}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'Open' ? 'default' : 'secondary'} className={ticket.status === 'Open' ? 'bg-orange-500 text-white' : ticket.status === 'Resolved' ? 'bg-green-500 text-white' : ''}>
                        {ticket.status === 'Open' ? translate('open', 'Open') : translate('resolved', 'Resolved')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setViewingTicket(ticket); setReplyText(''); }}>{translate('viewReply', 'View/Reply')}</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTickets.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{translate('noTickets', 'You have no support tickets.')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpen className="mr-2 h-5 w-5" />{translate('knowledgeBase', 'Knowledge Base & FAQs')}</CardTitle>
          <CardDescription>{translate('findAnswers', 'Find answers to common questions and learn how to use platform features.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: translate('browseFaqs', 'Browse FAQs'), description: translate('faqsContent', 'FAQ section coming soon with detailed guides.') })}><BookOpen className="mr-2 h-4 w-4" />{translate('browseAllFaqs', 'Browse All FAQs')}</Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: translate('videoTutorials', 'Video Tutorials'), description: translate('videosContent', 'Video tutorial library coming soon.') })}><Video className="mr-2 h-4 w-4" />{translate('watchTutorials', 'Watch Video Tutorials')}</Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">{translate('liveChatSoon', 'Live chat support coming soon for Pro members.')}</p>
        </CardFooter>
      </Card>

      {/* View/Reply Ticket Dialog */}
      <Dialog open={!!viewingTicket} onOpenChange={() => setViewingTicket(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingTicket?.ticketNumber} - {viewingTicket?.subject}</DialogTitle>
            <DialogDescription>{translate('category', 'Category')}: {viewingTicket?.category} | {translate('tableStatusHeader', 'Status')}: {viewingTicket?.status}</DialogDescription>
          </DialogHeader>
          {viewingTicket && (
            <div className="space-y-3 overflow-y-auto flex-grow">
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                <p className="font-medium text-xs text-muted-foreground mb-1">{translate('originalMessage', 'Original Message')}:</p>
                {viewingTicket.description}
              </div>
              {viewingTicket.replies.map((reply: any, idx: number) => (
                <div key={idx} className={`p-3 rounded-md text-sm ${reply.sender === 'user' ? 'bg-primary/10 ms-4' : 'bg-muted/30 me-4'}`}>
                  <p className="font-medium text-xs text-muted-foreground mb-1">{reply.sender === 'user' ? translate('you', 'You') : translate('supportTeam', 'Support Team')}:</p>
                  {reply.text}
                  <p className="text-[10px] text-muted-foreground mt-1">{formatTimeAgo(reply.time)}</p>
                </div>
              ))}
              {viewingTicket.status === 'Open' && (
                <div className="border-t pt-3">
                  <Label>{translate('yourReply', 'Your Reply')}</Label>
                  <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={translate('typeReply', 'Type your reply...')} rows={3} className="mt-1" />
                  <Button size="sm" className="mt-2" onClick={handleReply} disabled={!replyText.trim()}>{translate('sendReply', 'Send Reply')}</Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{translate('close', 'Close')}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
