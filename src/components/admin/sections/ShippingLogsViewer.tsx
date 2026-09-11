'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Eye,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const DEMO_LOGS = [
  {
    id: 'log-001',
    provider_id: 'yalidine',
    request_type: 'CREATE_SHIPMENT',
    endpoint: 'https://api.yalidine.app/v1/parcels',
    status_code: 200,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    request_payload: {
      tracking: 'yal_2026904128',
      to_wilaya: '19 - Sétif',
      to_commune: 'Sétif Ville',
      cod_amount: 18500,
      api_key: '[REDACTED_SECRET]',
    },
    response_payload: {
      success: true,
      code: 'YAL_CREATED',
      tracking_number: 'yal_2026904128',
      barcode: '*yal_2026904128*',
    },
  },
  {
    id: 'log-002',
    provider_id: 'zr_express',
    request_type: 'WEBHOOK',
    endpoint: '/api/webhooks/shipping/zr_express',
    status_code: 200,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    request_payload: {
      tracking_number: 'ZR-2026-583912',
      status: 'OUT_FOR_DELIVERY',
      driver_name: 'ياسين قدور',
      signature: '[REDACTED_HMAC]',
    },
    response_payload: {
      success: true,
      message: 'Status updated to out_for_delivery',
    },
  },
  {
    id: 'log-003',
    provider_id: 'maystro',
    request_type: 'TRACK',
    endpoint: 'https://api.maystro-delivery.com/v1/track/MAY-2026-119482',
    status_code: 200,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    request_payload: {
      token: '[REDACTED_TOKEN]',
    },
    response_payload: {
      status: 'DELIVERED',
      delivered_at: '2026-08-25T11:30:00Z',
    },
  },
];

export function ShippingLogsViewer() {
  const [logs, setLogs] = useState(DEMO_LOGS);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(l => 
    l.provider_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.request_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">سجلات تكامل الـ API وحركة البيانات (Carrier API Logs)</h3>
          <p className="text-xs text-muted-foreground">
            سجل تدقيق كامل للطلبات والاستجابات مع تشفير وتعتيم المفاتيح والبيانات الحساسة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالرابط، الشركة، النوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border border-border shadow-sm overflow-hidden bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">وقت الطلب</th>
                  <th className="p-3.5">الشركة</th>
                  <th className="p-3.5">نوع الطلب</th>
                  <th className="p-3.5">نقطة النهاية (Endpoint)</th>
                  <th className="p-3.5 text-center">كود الاستجابة</th>
                  <th className="p-3.5 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-mono text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString('ar-DZ')}
                    </td>
                    <td className="p-3.5 font-bold text-foreground uppercase">
                      {log.provider_id}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.request_type}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground max-w-xs truncate">
                      {log.endpoint}
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-mono text-[10px]">
                        {log.status_code} OK
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 px-2 text-xs text-primary gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>عرض Payload</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Payload Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <span>تفاصيل الطلب والاستجابة ({selectedLog?.request_type})</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {selectedLog?.endpoint}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-2 text-xs font-mono">
              <div>
                <span className="text-[11px] font-bold text-foreground block mb-1">Request Payload (Redacted):</span>
                <pre className="p-3 rounded-xl bg-muted/60 border border-border/40 text-[11px] overflow-x-auto text-foreground">
                  {JSON.stringify(selectedLog.request_payload, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-[11px] font-bold text-foreground block mb-1">Response Payload:</span>
                <pre className="p-3 rounded-xl bg-muted/60 border border-border/40 text-[11px] overflow-x-auto text-foreground">
                  {JSON.stringify(selectedLog.response_payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
