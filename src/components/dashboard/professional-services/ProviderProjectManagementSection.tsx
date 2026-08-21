'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ClipboardList, Eye, CheckCircle, XCircle, RotateCcw, Send, Search } from 'lucide-react';
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

const defaultProjects = [
  { id: 'proj001', clientName: 'Omar K.', serviceName: 'Full Website Redesign', startDate: '2024-06-15', deadline: '2024-08-15', status: 'In Progress', paymentStatus: 'Partially Paid' },
  { id: 'proj002', clientName: 'Leila A.', serviceName: 'Emergency Plumbing Fix', startDate: '2024-07-10', deadline: '2024-07-10', status: 'Completed', paymentStatus: 'Paid' },
  { id: 'proj003', clientName: 'Yasmine S.', serviceName: 'Monthly SEO Consulting', startDate: '2024-07-01', deadline: 'Ongoing', status: 'In Progress', paymentStatus: 'Awaiting Payment' },
  { id: 'proj004', clientName: 'Ali B.', serviceName: 'Logo & Branding Package', startDate: '2024-05-20', deadline: '2024-06-30', status: 'Awaiting Client Feedback', paymentStatus: 'Paid' },
  { id: 'proj005', clientName: 'Sarah M.', serviceName: 'Kitchen Renovation', startDate: '2024-08-01', deadline: '2024-09-30', status: 'Scheduled', paymentStatus: 'Deposit Paid' },
];

export function ProviderProjectManagementSection() {
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingProject, setViewingProject] = useState<any | null>(null);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('khidmatik_projects');
    if (saved) {
      try { setProjects(JSON.parse(saved)); } catch { setProjects(defaultProjects); }
    } else {
      setProjects(defaultProjects);
      localStorage.setItem('khidmatik_projects', JSON.stringify(defaultProjects));
    }
  }, []);

  const persist = (updated: any[]) => {
    setProjects(updated);
    localStorage.setItem('khidmatik_projects', JSON.stringify(updated));
  };

  const handleUpdateStatus = (projectId: string, newStatus: string) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p);
    persist(updated);
    toast({ title: translate('statusUpdated', 'Status Updated'), description: `${translate('projectStatus', 'Project status changed to')} ${newStatus}.` });
  };

  const handleSendUpdate = (projectId: string) => {
    if (!updateMessage.trim()) {
      toast({ title: translate('validationError', 'Error'), description: translate('enterMessage', 'Please enter a message.'), variant: 'destructive' });
      return;
    }
    toast({ title: translate('updateSent', 'Update Sent'), description: `${translate('updateSentTo', 'Update sent to client for project')} ${projectId}.` });
    setUpdateMessage('');
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'Completed' || status === 'Paid') return 'default';
    if (status === 'In Progress' || status === 'Partially Paid') return 'secondary';
    if (status === 'Rejected' || status === 'Cancelled') return 'destructive';
    return 'outline';
  };

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <ClipboardList className="mr-3 h-8 w-8 text-primary" /> {translate('projectsOrders', 'Projects & Orders Management')}
        </h1>
        <p className="text-muted-foreground">{translate('trackProjects', 'Track ongoing services, client projects, and order statuses.')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{translate('currentProjects', 'Current Projects/Orders')}</CardTitle>
          <CardDescription>{translate('manageProgress', 'Manage the progress and status of your client engagements.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translate('searchProjects', 'Search by Client or Service Name...')}
                className="ps-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={translate('filterByStatus', 'Filter by Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate('filterAll', 'All Statuses')}</SelectItem>
                <SelectItem value="In Progress">{translate('inProgress', 'In Progress')}</SelectItem>
                <SelectItem value="Completed">{translate('completed', 'Completed')}</SelectItem>
                <SelectItem value="Scheduled">{translate('scheduled', 'Scheduled')}</SelectItem>
                <SelectItem value="Awaiting Client Feedback">{translate('awaitingFeedback', 'Awaiting Client')}</SelectItem>
                <SelectItem value="Rejected">{translate('rejected', 'Rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('projectId', 'Project ID')}</TableHead>
                  <TableHead>{translate('client', 'Client')}</TableHead>
                  <TableHead>{translate('service', 'Service')}</TableHead>
                  <TableHead>{translate('deadline', 'Deadline')}</TableHead>
                  <TableHead>{translate('tableStatusHeader', 'Status')}</TableHead>
                  <TableHead>{translate('payment', 'Payment')}</TableHead>
                  <TableHead className="text-right">{translate('tableActionsHeader', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.id}</TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell>{project.serviceName}</TableCell>
                    <TableCell>{project.deadline}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.status)} className={project.status === "Completed" ? "bg-green-500 text-white" : project.status === "In Progress" ? "bg-blue-500 text-white" : ""}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(project.paymentStatus)} className={project.paymentStatus === "Paid" ? "bg-green-500 text-white" : ""}>
                        {project.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setViewingProject(project); setUpdateMessage(''); }}><Eye className="h-4 w-4" /></Button>
                      {project.status === 'In Progress' && <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(project.id, 'Completed')} className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>}
                      {project.status === 'Awaiting Client Feedback' && <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(project.id, 'In Progress')} className="text-blue-600"><RotateCcw className="h-4 w-4" /></Button>}
                      {project.status !== 'Completed' && project.status !== 'Rejected' && <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(project.id, 'Rejected')} className="text-destructive"><XCircle className="h-4 w-4" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProjects.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{translate('noProjects', 'No active projects or orders.')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate('quickActions', 'Quick Actions')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => { const inProg = projects.filter(p => p.status === 'In Progress'); if (inProg.length) handleUpdateStatus(inProg[0].id, 'Completed'); else toast({ title: translate('noInProgress', 'No projects in progress') }); }}><CheckCircle className="mr-2 h-4 w-4" />{translate('markCompleted', 'Mark as Completed')}</Button>
          <Button variant="outline" onClick={() => { const awaiting = projects.filter(p => p.status === 'Awaiting Client Feedback'); if (awaiting.length) handleUpdateStatus(awaiting[0].id, 'In Progress'); else toast({ title: translate('noAwaiting', 'No awaiting projects') }); }}><RotateCcw className="mr-2 h-4 w-4" />{translate('requestRevision', 'Request Revision')}</Button>
          <Button variant="outline" onClick={() => { const active = projects.filter(p => !['Completed', 'Rejected'].includes(p.status)); if (active.length) handleUpdateStatus(active[0].id, 'Rejected'); else toast({ title: translate('noActive', 'No active projects') }); }}><XCircle className="mr-2 h-4 w-4" />{translate('cancelOrder', 'Cancel Order')}</Button>
          <Button variant="outline" onClick={() => { if (projects.length) { setViewingProject(projects[0]); setUpdateMessage(''); } }}><Send className="mr-2 h-4 w-4" />{translate('sendUpdate', 'Send Update')}</Button>
        </CardContent>
      </Card>

      {/* View Project Dialog */}
      <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{translate('projectDetails', 'Project Details')}</DialogTitle>
            <DialogDescription>{viewingProject?.id} - {viewingProject?.serviceName}</DialogDescription>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">{translate('client', 'Client')}:</span> <strong>{viewingProject.clientName}</strong></div>
                <div><span className="text-muted-foreground">{translate('deadline', 'Deadline')}:</span> <strong>{viewingProject.deadline}</strong></div>
                <div><span className="text-muted-foreground">{translate('tableStatusHeader', 'Status')}:</span> <Badge variant={getStatusBadgeVariant(viewingProject.status)} className={viewingProject.status === 'Completed' ? 'bg-green-500 text-white' : viewingProject.status === 'In Progress' ? 'bg-blue-500 text-white' : ''}>{viewingProject.status}</Badge></div>
                <div><span className="text-muted-foreground">{translate('payment', 'Payment')}:</span> <Badge variant={getStatusBadgeVariant(viewingProject.paymentStatus)} className={viewingProject.paymentStatus === 'Paid' ? 'bg-green-500 text-white' : ''}>{viewingProject.paymentStatus}</Badge></div>
              </div>
              <div className="border-t pt-3">
                <Label>{translate('sendUpdateToClient', 'Send Update to Client')}</Label>
                <Textarea value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} placeholder={translate('typeUpdate', 'Type your update message...')} rows={3} className="mt-1" />
                <Button className="mt-2" size="sm" onClick={() => handleSendUpdate(viewingProject.id)}><Send className="mr-2 h-4 w-4" />{translate('sendUpdate', 'Send Update')}</Button>
              </div>
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
