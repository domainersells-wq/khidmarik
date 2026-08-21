'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { parseServiceNotes, serializeServiceNotes, createAuditLog, generateOTP, hashOTP } from '@/lib/proofOfService';
import { 
  Calendar, User, Clock, ShieldAlert, List, RotateCw, Search, CheckCircle, 
  XCircle, UserMinus, UserCheck, MapPin, Activity, ShieldCheck, HelpCircle, FileText, Camera
} from 'lucide-react';
import { format } from 'date-fns';

export function ReservationManagementSection() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAppt, setViewingAppt] = useState<any | null>(null);

  // Administrative operation states
  const [isResolvingDispute, setIsResolvingDispute] = useState(false);
  const [isRegeneratingOtp, setIsRegeneratingOtp] = useState(false);
  const [newGeneratedOtp, setNewGeneratedOtp] = useState('');

  const loadAppointments = async () => {
    setIsLoading(true);
    let dbAppts: any[] = [];
    
    // 1. Fetch from Supabase if connected
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data) {
        dbAppts = data.map((appt: any) => ({
          id: appt.id,
          reservationId: appt.id,
          patientName: appt.patient_name || 'Client',
          reasonForVisit: appt.reason_for_visit || 'Service',
          date: appt.date,
          timeSlot: appt.time_slot,
          status: appt.status,
          notes: appt.notes || '',
          location: appt.location || '',
          providerId: appt.provider_id
        }));
      }
    } catch (e) {
      console.warn("Could not load from Supabase database:", e);
    }

    // 2. Load from LocalStorage fallback
    const saved = localStorage.getItem('khidmatik_appointments');
    let localAppts: any[] = [];
    if (saved) {
      try {
        const list = JSON.parse(saved);
        localAppts = list.map((appt: any) => ({
          id: appt.id || appt.reservationId,
          reservationId: appt.id || appt.reservationId,
          patientName: appt.patient_name || appt.clientName || 'Client',
          reasonForVisit: appt.reason_for_visit || appt.service || 'Service',
          date: appt.date,
          timeSlot: appt.time_slot,
          status: appt.status,
          notes: appt.notes || '',
          location: appt.location || '',
          providerId: appt.provider_id
        }));
      } catch (e) {
        console.error(e);
      }
    }

    // Merge
    const merged = [...dbAppts];
    localAppts.forEach(la => {
      if (!merged.some(m => m.id === la.id)) {
        merged.push(la);
      }
    });

    setAppointments(merged);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed') return <Badge className="bg-green-600 text-white">Confirmed</Badge>;
    if (s === 'en_route') return <Badge className="bg-blue-500 text-white">En Route</Badge>;
    if (s === 'in_progress') return <Badge className="bg-purple-600 text-white">In Progress</Badge>;
    if (s === 'waiting_verification') return <Badge className="bg-cyan-600 text-white animate-pulse">Verification Needed</Badge>;
    if (s === 'disputed') return <Badge variant="destructive" className="animate-pulse">Disputed</Badge>;
    if (s === 'completed') return <Badge variant="outline" className="border-green-600 text-green-600">Completed</Badge>;
    if (s === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge className="bg-amber-500 text-white">Pending</Badge>;
  };

  // 1. Resolve Dispute Actions
  const handleResolveDispute = async (apptId: string, resolution: 'completed' | 'cancelled') => {
    setIsResolvingDispute(true);
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const payload = parseServiceNotes(appt.notes);
    const resolveLog = createAuditLog('ADMIN_RESOLVE_DISPUTE', `Admin intervened and resolved dispute. Outcome: Marked booking as ${resolution.toUpperCase()}`);
    payload.auditLogs.push(resolveLog);

    const updatedNotes = serializeServiceNotes(payload);

    // Save locally
    const saved = localStorage.getItem('khidmatik_appointments');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const updatedList = list.map((a: any) =>
          (a.id === apptId || a.reservationId === apptId) ? { ...a, status: resolution, notes: updatedNotes } : a
        );
        localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
      } catch (e) { console.error(e); }
    }

    // Save to Supabase
    try {
      await supabase.from('appointments').update({ status: resolution, notes: updatedNotes }).eq('id', apptId);
      await supabase.from('notifications').insert([
        {
          user_id: appt.providerId,
          title: 'Dispute Resolved by Admin',
          message: `Admin resolved dispute on reservation ${appt.reservationId}. Status: ${resolution.toUpperCase()}`,
          type: 'appointment'
        }
      ]);
    } catch (e) {
      console.warn("Supabase update fallback", e);
    }

    toast({
      title: "Dispute Resolved Successfully",
      description: `Appointment status is now ${resolution.toUpperCase()}`,
    });

    setIsResolvingDispute(false);
    setViewingAppt(null);
    loadAppointments();
  };

  // 2. Regenerate Verification OTP code
  const handleRegenerateOtp = async (apptId: string) => {
    setIsRegeneratingOtp(true);
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    const payload = parseServiceNotes(appt.notes);
    const regenLog = createAuditLog('ADMIN_REGENERATE_OTP', `Admin regenerated verification code. New code active for client.`);
    
    payload.otpCode = otp;
    payload.otpCodeHash = otpHash;
    payload.otpExpiresAt = expiresAt;
    payload.failedOtpAttempts = 0;
    payload.otpLocked = false;
    payload.auditLogs.push(regenLog);

    const updatedNotes = serializeServiceNotes(payload);

    // Save locally
    const saved = localStorage.getItem('khidmatik_appointments');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const updatedList = list.map((a: any) =>
          (a.id === apptId || a.reservationId === apptId) ? { ...a, notes: updatedNotes } : a
        );
        localStorage.setItem('khidmatik_appointments', JSON.stringify(updatedList));
      } catch (e) { console.error(e); }
    }

    // Save to Supabase
    try {
      await supabase.from('appointments').update({ notes: updatedNotes }).eq('id', apptId);
    } catch (e) {
      console.warn("Supabase update fallback", e);
    }

    setNewGeneratedOtp(otp);
    toast({
      title: "OTP Regenerated Successfully",
      description: `New OTP: ${otp} (active for 10 minutes)`,
    });
    setIsRegeneratingOtp(false);
    
    // Refresh viewing appointment state
    const updatedAppt = { ...appt, notes: updatedNotes };
    setViewingAppt(updatedAppt);
    loadAppointments();
  };

  // 3. Suspend Service Provider (Conceptual)
  const handleSuspendProvider = (providerId: string, currentStatus: string) => {
    toast({
      title: "Provider Account Action Triggered",
      description: `Provider ID ${providerId} account suspended. Management has locked service access.`,
      variant: "destructive"
    });
  };

  const filtered = appointments.filter(a => 
    a.reservationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.reasonForVisit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-primary" /> Service Supervisor & Bookings Console
          </h1>
          <p className="text-muted-foreground">Manage service delivery life cycles, investigate disputes, and verify logs.</p>
        </div>
        <Button onClick={loadAppointments} size="sm" variant="outline" className="flex gap-1.5 items-center">
          <RotateCw className="h-4 w-4" /> Refresh Lists
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle>System Bookings Tracker</CardTitle>
          <CardDescription>Real-time overview of field services and OTP verification events.</CardDescription>
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Reservation ID, Customer Name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16 gap-2">
              <RotateCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Syncing appointments list...</span>
            </div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Request</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(appt => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-mono text-xs">{appt.reservationId}</TableCell>
                    <TableCell className="font-medium">{appt.patientName}</TableCell>
                    <TableCell>{appt.reasonForVisit}</TableCell>
                    <TableCell>{appt.date}</TableCell>
                    <TableCell>{getStatusBadge(appt.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setViewingAppt(appt);
                        setNewGeneratedOtp('');
                      }}>
                        Investigate Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reservations matching your search parameters were found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investigation details Dialog */}
      <Dialog open={!!viewingAppt} onOpenChange={() => setViewingAppt(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Investigation Report: {viewingAppt?.reservationId}
            </DialogTitle>
            <DialogDescription>Full audit logs, execution metrics, and supervisor controls.</DialogDescription>
          </DialogHeader>

          {viewingAppt && (
            <div className="space-y-5 pt-3">
              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg border text-sm">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Client / Customer</span>
                  <span className="font-semibold">{viewingAppt.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Service / Job</span>
                  <span>{viewingAppt.reasonForVisit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Booking Date</span>
                  <span>{viewingAppt.date} {viewingAppt.timeSlot ? `(${viewingAppt.timeSlot})` : ''}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Workflow Status</span>
                  <div className="mt-0.5">{getStatusBadge(viewingAppt.status)}</div>
                </div>
              </div>

              {/* Service Address */}
              <div className="text-sm flex gap-1.5 items-start bg-muted/20 p-2.5 rounded-lg border border-dashed">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[11px] uppercase tracking-wider text-muted-foreground">Service Delivery Location</strong>
                  <span>{viewingAppt.location || parseServiceNotes(viewingAppt.notes).location}</span>
                </div>
              </div>

              {/* Dispute Alert Box */}
              {viewingAppt.status === 'disputed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" /> Dispute Incident Escaled by Client
                  </div>
                  <div className="text-xs space-y-1 pl-6">
                    <p>Reason selected: <strong className="underline">{parseServiceNotes(viewingAppt.notes).disputeReason}</strong></p>
                    <p className="bg-white p-2 border rounded italic">"{parseServiceNotes(viewingAppt.notes).disputeComments}"</p>
                    <p className="text-[10px] text-muted-foreground">Escalated on: {parseServiceNotes(viewingAppt.notes).disputeTimestamp}</p>
                  </div>
                  
                  {/* Supervisor Resolution Actions */}
                  <div className="flex gap-2 pt-2 justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => handleResolveDispute(viewingAppt.id, 'cancelled')} 
                      variant="outline" 
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Force Cancel & Refund
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleResolveDispute(viewingAppt.id, 'completed')} 
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Force Complete Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Execution Details (Redesigned Service Completion Report) */}
              {(parseServiceNotes(viewingAppt.notes).startTime || parseServiceNotes(viewingAppt.notes).endTime) && (() => {
                const report = parseServiceNotes(viewingAppt.notes);
                return (
                  <div className="border rounded-lg p-4 space-y-4 bg-card">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase flex items-center gap-1.5 border-b pb-1">
                      <FileText className="h-4 w-4" /> Service Completion Report / تقرير الإنجاز
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Started At:</span>
                        <span className="font-medium">{report.startTime ? new Date(report.startTime).toLocaleString() : 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Finished At:</span>
                        <span className="font-medium">{report.endTime ? new Date(report.endTime).toLocaleString() : 'Not finished yet'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Reported Duration:</span>
                        <span className="font-medium">{report.endDuration || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">GPS Captures:</span>
                        <span className="font-mono text-primary font-semibold">{report.gpsCoords || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Checklist */}
                    {report.workChecklist && (
                      <div className="bg-muted/20 p-3 rounded border space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Work Checklist</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className={report.workChecklist.workDone ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.workDone ? "☑" : "☐"} Works Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className={report.workChecklist.cleanUp ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.cleanUp ? "☑" : "☐"} Cleaned Workspace
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className={report.workChecklist.tested ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.tested ? "☑" : "☐"} Tested Service
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className={report.workChecklist.explained ? "text-green-600 font-bold" : ""}>
                              {report.workChecklist.explained ? "☑" : "☐"} Explained to Client
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Completion Notes */}
                    {report.completionNotesText && (
                      <div className="text-xs bg-muted/40 p-2.5 border rounded">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Professional Work Notes / ملاحظات الحرفي:</span>
                        <p className="mt-0.5 italic">"{report.completionNotesText}"</p>
                      </div>
                    )}

                    {/* Materials billing */}
                    {report.materialsUsed && report.materialsUsed.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Materials & Parts Used / المواد والقطع المصروفة</span>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow className="h-7">
                                <TableHead className="h-7 py-0.5 text-xs">Material</TableHead>
                                <TableHead className="h-7 py-0.5 text-xs text-center">Qty</TableHead>
                                <TableHead className="h-7 py-0.5 text-xs text-right">Price</TableHead>
                                <TableHead className="h-7 py-0.5 text-xs text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.materialsUsed.map((mat, i) => (
                                <TableRow key={i} className="h-7">
                                  <TableCell className="py-0.5 text-xs">{mat.name}</TableCell>
                                  <TableCell className="py-0.5 text-xs text-center">{mat.quantity}</TableCell>
                                  <TableCell className="py-0.5 text-xs text-right">{mat.price.toFixed(2)} DA</TableCell>
                                  <TableCell className="py-0.5 text-xs text-right font-semibold">{(mat.quantity * mat.price).toFixed(2)} DA</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/20 font-bold h-7">
                                <TableCell colSpan={3} className="py-0.5 text-xs text-right">Materials Sum Cost:</TableCell>
                                <TableCell className="py-0.5 text-xs text-right text-primary">
                                  {report.materialsUsed.reduce((acc, cur) => acc + (cur.quantity * cur.price), 0).toFixed(2)} DA
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Photo galleries */}
                    {((report.beforePhotos && report.beforePhotos.length > 0) || (report.afterPhotos && report.afterPhotos.length > 0)) && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Photo Evidence Files</span>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Before */}
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-amber-600 block">Before Gallery</span>
                            <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1.5 rounded border">
                              {report.beforePhotos?.map((photo, i) => (
                                <div key={i} className="bg-background rounded border p-1 font-mono text-[9px] truncate text-center">
                                  {photo.split('/').pop()}
                                </div>
                              )) || <span className="text-[9px] text-muted-foreground italic">None</span>}
                            </div>
                          </div>

                          {/* After */}
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-green-600 block">After Gallery</span>
                            <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1.5 rounded border">
                              {report.afterPhotos?.map((photo, i) => (
                                <div key={i} className="bg-background rounded border p-1 font-mono text-[9px] truncate text-center">
                                  {photo.split('/').pop()}
                                </div>
                              )) || <span className="text-[9px] text-muted-foreground italic">None</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Audit Logs */}
              <div className="space-y-2 border rounded-lg p-3">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase flex items-center gap-1.5"><List className="h-4 w-4" /> Activity Log & Audit Trail (سجل العمليات)</h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {parseServiceNotes(viewingAppt.notes).auditLogs.map((log, idx) => (
                    <div key={idx} className="p-2 border rounded bg-muted/20 hover:bg-muted/40 transition-colors text-xs space-y-1">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-primary">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-muted-foreground">{log.details}</p>
                      <div className="flex justify-between text-[10px] text-muted-foreground/80 font-mono bg-muted/30 p-1 rounded">
                        <span>Device: {log.device || 'Unknown'}</span>
                        {log.gps && <span className="text-green-600 font-bold">GPS: {log.gps}</span>}
                        <span>IP: {log.ip || 'Localhost'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action operations */}
              <div className="flex flex-wrap gap-2 border-t pt-3 mt-4">
                {viewingAppt.status === 'waiting_verification' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex gap-1 items-center border-cyan-300 text-cyan-800"
                    onClick={() => handleRegenerateOtp(viewingAppt.id)}
                    disabled={isRegeneratingOtp}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Regenerate Verification OTP
                  </Button>
                )}

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex gap-1 items-center text-red-600 hover:text-red-700 ml-auto border-red-200"
                  onClick={() => handleSuspendProvider(viewingAppt.providerId, viewingAppt.status)}
                >
                  <UserMinus className="h-3.5 w-3.5" /> Suspend Provider (Concept)
                </Button>
              </div>

              {newGeneratedOtp && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-900 rounded-lg text-xs mt-3 flex justify-between items-center font-mono">
                  <span>New OTP code generated for client: <strong>{newGeneratedOtp}</strong></span>
                  <span className="text-[10px] text-muted-foreground">Expires in 10 minutes</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-2 mt-4">
            <DialogClose asChild><Button variant="outline">Close Report</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
