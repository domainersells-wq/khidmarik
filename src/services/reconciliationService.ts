import { financialService } from '@/services/financialService';
import { TopUpRequest } from '@/types/financials';

export interface ReconciliationDiscrepancy {
  id: string;
  type: 'DUPLICATE_REFERENCE' | 'STALE_PENDING' | 'BALANCE_MISMATCH' | 'AMOUNT_DISCREPANCY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  referenceId: string;
  detectedAt: string;
  suggestedAction: string;
}

class ReconciliationService {
  /**
   * Run automated financial audit and reconciliation scan
   */
  public runAuditScan(): {
    scannedRequests: number;
    discrepancies: ReconciliationDiscrepancy[];
    isHealthy: boolean;
    auditTimestamp: string;
  } {
    const allRequests = financialService.getTopUpRequests();
    const discrepancies: ReconciliationDiscrepancy[] = [];
    const seenReferences = new Map<string, TopUpRequest>();

    const now = Date.now();

    allRequests.forEach((req) => {
      // 1. Check for Duplicate Payment References
      const ref = req.postalTransactionCode || req.paymentReference;
      if (ref && ref.trim()) {
        const cleanRef = ref.trim().toLowerCase();
        if (seenReferences.has(cleanRef)) {
          const prior = seenReferences.get(cleanRef)!;
          discrepancies.push({
            id: `disc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'DUPLICATE_REFERENCE',
            severity: 'HIGH',
            title: 'تكرار في رقم الحوالة البريدية / Payment Reference Replay',
            description: `تم استخدام الرمز (${ref}) في الطلبين: [${prior.publicRequestNumber}] و [${req.publicRequestNumber}].`,
            referenceId: req.publicRequestNumber,
            detectedAt: new Date().toISOString(),
            suggestedAction: 'تدقيق يدوي في كشف حساب البنك وإلغاء الطلب المكرر',
          });
        } else {
          seenReferences.set(cleanRef, req);
        }
      }

      // 2. Check for Stale Pending Requests (>48 hours without approval)
      if (req.status === 'UNDER_REVIEW' || req.status === 'PENDING_VERIFICATION') {
        const createdMs = new Date(req.createdAt).getTime();
        if (!isNaN(createdMs) && now - createdMs > 48 * 60 * 60 * 1000) {
          discrepancies.push({
            id: `disc_stale_${req.id}`,
            type: 'STALE_PENDING',
            severity: 'MEDIUM',
            title: 'طلب شحن معلق تجاوز 48 ساعة دون اعتماد',
            description: `الطلب ${req.publicRequestNumber} بمبلغ ${req.amount.toLocaleString()} DA معلق منذ أكثر من يومين.`,
            referenceId: req.publicRequestNumber,
            detectedAt: new Date().toISOString(),
            suggestedAction: 'مراجعة فورية من قِبل مسؤول المالية',
          });
        }
      }
    });

    return {
      scannedRequests: allRequests.length,
      discrepancies,
      isHealthy: discrepancies.length === 0,
      auditTimestamp: new Date().toISOString(),
    };
  }
}

export const reconciliationService = new ReconciliationService();
