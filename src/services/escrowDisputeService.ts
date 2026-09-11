'use client';

import {
  EscrowStatus,
  DisputeStatus,
  DisputeReasonCode,
  DisputeResolutionAction,
  DisputeEvidenceItem,
  DisputeTimelineEvent,
  PlatformDisputeRecord,
  PlatformEscrowRecord,
  OpenDisputeInput,
  SubmitProviderResponseInput,
  ResolveDisputeInput,
} from '@/types/escrowDispute';
import { customerOrderService } from '@/services/customerOrderService';
import { financialService } from '@/services/financialService';
import { notificationService } from '@/services/notificationService';

// ------------------------------------------------------------------------------------------------
// INITIAL SEED DISPUTE & ESCROW DATA
// ------------------------------------------------------------------------------------------------

const SEED_DISPUTES: PlatformDisputeRecord[] = [
  {
    id: 'dsp_1',
    disputeNumber: 'DSP-2026-000412',
    orderId: 'ord_c3',
    orderNumber: 'KHM-2026-000003',
    customerId: 'usr_1',
    customerName: 'Karim Hadjadj',
    providerId: 'str_3',
    providerName: 'Pièces Auto Express',
    reasonCode: 'WRONG_ITEMS',
    status: 'UNDER_REVIEW',
    disputedAmount: 48700,
    currency: 'DZD',
    customerClaimDescription: 'Received brake discs for 2018 model instead of the ordered 2022 facelift edition.',
    providerResponseText: 'We checked our warehouse inventory and the part number matches the manufacturer cross-reference.',
    providerProposedRefundAmount: 15000,
    assignedMediatorId: 'adm_1',
    mediatorNotes: 'Reviewing photo comparison and manufacturer OEM catalogue specs.',
    evidence: [
      {
        id: 'ev_1',
        disputeId: 'dsp_1',
        uploaderId: 'usr_1',
        uploaderRole: 'CUSTOMER',
        fileUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600',
        fileName: 'received_part_photo.jpg',
        fileType: 'image/jpeg',
        description: 'Photo showing part number mismatch on physical box.',
        uploadedAt: '2026-08-22 14:30',
      },
    ],
    timeline: [
      {
        id: 'tl_1',
        disputeId: 'dsp_1',
        actorId: 'usr_1',
        actorRole: 'CUSTOMER',
        eventType: 'DISPUTE_OPENED',
        message: 'Customer opened dispute for 48,700 DA. Reason: WRONG_ITEMS.',
        createdAt: '2026-08-22 14:30',
      },
      {
        id: 'tl_2',
        disputeId: 'dsp_1',
        actorId: 'str_3',
        actorRole: 'PROVIDER',
        eventType: 'PROVIDER_RESPONDED',
        message: 'Provider responded with counter-explanation and proposed 15,000 DA partial goodwill credit.',
        createdAt: '2026-08-22 16:15',
      },
      {
        id: 'tl_3',
        disputeId: 'dsp_1',
        actorId: 'adm_1',
        actorRole: 'ADMIN',
        eventType: 'UNDER_REVIEW',
        message: 'Mediator assigned case for technical catalog verification.',
        createdAt: '2026-08-22 17:00',
      },
    ],
    createdAt: '2026-08-22 14:30',
    updatedAt: '2026-08-22 17:00',
  },
  {
    id: 'dsp_2',
    disputeNumber: 'DSP-2026-000398',
    orderId: 'ord_c4',
    orderNumber: 'KHM-2026-000004',
    customerId: 'usr_2',
    customerName: 'Amina Mansouri',
    providerId: 'str_4',
    providerName: 'Cosmétique Naturelle Dz',
    reasonCode: 'DAMAGED_ITEMS',
    status: 'WAITING_PROVIDER',
    disputedAmount: 14200,
    currency: 'DZD',
    customerClaimDescription: 'Two glass perfume bottles arrived shattered inside package.',
    evidence: [
      {
        id: 'ev_2',
        disputeId: 'dsp_2',
        uploaderId: 'usr_2',
        uploaderRole: 'CUSTOMER',
        fileUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600',
        fileName: 'broken_bottles.jpg',
        fileType: 'image/jpeg',
        description: 'Photo of parcel unboxing showing broken glass.',
        uploadedAt: '2026-08-21 11:20',
      },
    ],
    timeline: [
      {
        id: 'tl_4',
        disputeId: 'dsp_2',
        actorId: 'usr_2',
        actorRole: 'CUSTOMER',
        eventType: 'DISPUTE_OPENED',
        message: 'Customer opened dispute for 14,200 DA. Reason: DAMAGED_ITEMS.',
        createdAt: '2026-08-21 11:20',
      },
      {
        id: 'tl_5',
        disputeId: 'dsp_2',
        actorId: 'adm_1',
        actorRole: 'ADMIN',
        eventType: 'STATUS_CHANGED',
        message: 'Dispute assigned to WAITING_PROVIDER for merchant statement.',
        createdAt: '2026-08-21 13:00',
      },
    ],
    createdAt: '2026-08-21 11:20',
    updatedAt: '2026-08-21 13:00',
  },
];

// ------------------------------------------------------------------------------------------------
// ESCROW & DISPUTE SERVICE
// ------------------------------------------------------------------------------------------------

class EscrowDisputeService {
  private DISPUTES_KEY = 'khidmatik_platform_disputes_v2';
  private ESCROWS_KEY = 'khidmatik_platform_escrows_v2';
  private AUDIT_KEY = 'khidmatik_escrow_dispute_audit_v2';

  public getDisputes(): PlatformDisputeRecord[] {
    if (typeof window === 'undefined') return SEED_DISPUTES;
    try {
      const saved = localStorage.getItem(this.DISPUTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return SEED_DISPUTES;
  }

  public getDisputeById(disputeId: string): PlatformDisputeRecord | null {
    const disputes = this.getDisputes();
    return disputes.find((d) => d.id === disputeId || d.disputeNumber === disputeId || d.orderId === disputeId) || null;
  }

  private saveDisputes(disputes: PlatformDisputeRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.DISPUTES_KEY, JSON.stringify(disputes));
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Customer initiates Instant Early Release of Escrow Funds to Provider
   */
  public async earlyReleaseFunds(
    orderId: string,
    customerId: string = 'usr_1',
    reason: string = 'Customer satisfied - early release requested'
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const order = await customerOrderService.getOrderDetails(orderId);
    if (!order) return { success: false, message: '', error: 'Order not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Release funds via financial service
    await financialService.settleOrderEscrow(order.id, 'Customer Early Release');

    // 2. Advance Order Status
    order.status = 'completed';
    order.protection.escrowStatus = 'released_to_seller';
    order.updatedAt = nowStr;

    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      orderId: order.id,
      status: 'completed',
      description: `Customer initiated Early Fund Release. ${order.sellerAmount.toLocaleString()} DA transferred to ${order.storeName} wallet. (${reason})`,
      changedBy: customerId,
      changedByRole: 'CUSTOMER',
      createdAt: nowStr,
    });

    // Update customerOrderService state
    if (typeof window !== 'undefined') {
      try {
        const allOrdersStr = localStorage.getItem('khidmatik_customer_orders_v2');
        if (allOrdersStr) {
          const allOrders = JSON.parse(allOrdersStr);
          const idx = allOrders.findIndex((o: any) => o.id === order.id);
          if (idx !== -1) {
            allOrders[idx] = order;
            localStorage.setItem('khidmatik_customer_orders_v2', JSON.stringify(allOrders));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    return {
      success: true,
      message: `Escrow funds (${order.sellerAmount.toLocaleString()} DA) successfully released to ${order.storeName}.`,
    };
  }

  /**
   * Open a Formal Customer Dispute
   */
  public async openDispute(
    input: OpenDisputeInput
  ): Promise<{ success: boolean; dispute?: PlatformDisputeRecord; error?: string }> {
    const order = await customerOrderService.getOrderDetails(input.orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const disputeNumber = `DSP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const evidenceItems: DisputeEvidenceItem[] = (input.evidenceUrls || []).map((url, idx) => ({
      id: `ev_${Date.now()}_${idx}`,
      disputeId: `dsp_${Date.now()}`,
      uploaderId: input.customerId,
      uploaderRole: 'CUSTOMER',
      fileUrl: url,
      fileName: `evidence_${idx + 1}.jpg`,
      fileType: 'image/jpeg',
      description: 'Attached claim proof',
      uploadedAt: nowStr,
    }));

    const newDispute: PlatformDisputeRecord = {
      id: `dsp_${Date.now()}`,
      disputeNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: input.customerId,
      customerName: input.customerName || order.shippingAddress.recipientName,
      providerId: order.sellerId,
      providerName: order.storeName,
      reasonCode: input.reasonCode,
      status: 'OPEN',
      disputedAmount: order.totalAmount,
      currency: 'DZD',
      customerClaimDescription: input.claimDescription,
      evidence: evidenceItems,
      timeline: [
        {
          id: `tl_${Date.now()}`,
          disputeId: `dsp_${Date.now()}`,
          actorId: input.customerId,
          actorRole: 'CUSTOMER',
          eventType: 'DISPUTE_OPENED',
          message: `Customer opened dispute for ${order.totalAmount.toLocaleString()} DA. Reason: ${input.reasonCode}.`,
          createdAt: nowStr,
        },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // 1. Lock Escrow and mark order as disputed
    order.status = 'disputed';
    order.updatedAt = nowStr;
    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      orderId: order.id,
      status: 'disputed',
      description: `Dispute ${disputeNumber} opened by customer (${input.reasonCode}). Escrow locked pending arbitration.`,
      changedBy: input.customerId,
      changedByRole: 'CUSTOMER',
      metadata: { disputeId: newDispute.id, reason: input.reasonCode },
      createdAt: nowStr,
    });

    // 2. Persist dispute & updated order
    const disputes = this.getDisputes();
    disputes.unshift(newDispute);
    this.saveDisputes(disputes);

    if (typeof window !== 'undefined') {
      try {
        const allOrdersStr = localStorage.getItem('khidmatik_customer_orders_v2');
        if (allOrdersStr) {
          const allOrders = JSON.parse(allOrdersStr);
          const idx = allOrders.findIndex((o: any) => o.id === order.id);
          if (idx !== -1) {
            allOrders[idx] = order;
            localStorage.setItem('khidmatik_customer_orders_v2', JSON.stringify(allOrders));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Notify provider regarding new dispute
    notificationService.sendNotification({
      userId: order.sellerId,
      type: 'new_dispute',
      title: 'Escrow Dispute Notice',
      message: `A dispute (${disputeNumber}) was opened on order #${order.orderNumber}. Reason: ${input.reasonCode}.`,
      data: {
        referenceId: disputeNumber,
        disputeId: newDispute.id,
        orderId: order.id,
        amount: order.totalAmount,
        actionUrl: '/profile'
      }
    });

    return { success: true, dispute: newDispute };
  }

  /**
   * Update Dispute Status (Admin Mediation / Workflow Transition)
   */
  public updateDisputeStatus(
    disputeId: string,
    newStatus: DisputeStatus,
    adminId: string = 'adm_1',
    notes?: string
  ): { success: boolean; dispute?: PlatformDisputeRecord } {
    const disputes = this.getDisputes();
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return { success: false };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    dispute.status = newStatus;
    dispute.updatedAt = nowStr;
    if (notes) dispute.mediatorNotes = notes;

    dispute.timeline.push({
      id: `tl_${Date.now()}`,
      disputeId: dispute.id,
      actorId: adminId,
      actorRole: 'ADMIN',
      eventType: 'STATUS_CHANGED',
      message: `Mediator updated dispute status to ${newStatus}.${notes ? ` Notes: ${notes}` : ''}`,
      createdAt: nowStr,
    });

    this.saveDisputes(disputes);
    return { success: true, dispute };
  }

  /**
   * Submit Provider Statement & Counter-Offer
   */
  public submitProviderResponse(
    input: SubmitProviderResponseInput
  ): { success: boolean; dispute?: PlatformDisputeRecord } {
    const disputes = this.getDisputes();
    const dispute = disputes.find((d) => d.id === input.disputeId);
    if (!dispute) return { success: false };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    dispute.providerResponseText = input.responseText;
    dispute.providerProposedRefundAmount = input.proposedRefundAmount || 0;
    dispute.status = 'UNDER_REVIEW';
    dispute.updatedAt = nowStr;

    dispute.timeline.push({
      id: `tl_${Date.now()}`,
      disputeId: dispute.id,
      actorId: input.providerId,
      actorRole: 'PROVIDER',
      eventType: 'PROVIDER_RESPONDED',
      message: `Provider submitted statement.${input.proposedRefundAmount ? ` Counter-offer: ${input.proposedRefundAmount.toLocaleString()} DA partial refund.` : ''}`,
      createdAt: nowStr,
    });

    this.saveDisputes(disputes);
    return { success: true, dispute };
  }

  /**
   * Resolve Dispute via Binding Arbitration (Full Refund, Partial Refund Split, or Fund Release)
   */
  public async resolveDispute(
    input: ResolveDisputeInput
  ): Promise<{ success: boolean; dispute?: PlatformDisputeRecord; error?: string }> {
    const disputes = this.getDisputes();
    const dispute = disputes.find((d) => d.id === input.disputeId);
    if (!dispute) return { success: false, error: 'Dispute not found' };

    const order = await customerOrderService.getOrderDetails(dispute.orderId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let customerRefund = 0;
    let providerPayout = 0;
    let finalStatus: DisputeStatus = 'RESOLVED';

    if (input.resolutionAction === 'FULL_REFUND_CUSTOMER') {
      customerRefund = dispute.disputedAmount;
      providerPayout = 0;
      finalStatus = 'REFUNDED';

      // Execute full refund in financial service
      await financialService.processRefund(
        dispute.orderId,
        customerRefund,
        'dispute_arbitration',
        'Platform Mediator',
        false,
        `Dispute ${dispute.disputeNumber} resolution: Full refund to customer.`
      );

      if (order) {
        order.status = 'refunded';
        order.protection.escrowStatus = 'refunded_to_buyer';
      }
    } else if (input.resolutionAction === 'PARTIAL_REFUND_SPLIT') {
      customerRefund = input.customerRefundAmount || 0;
      providerPayout = input.providerPayoutAmount || (dispute.disputedAmount - customerRefund);
      finalStatus = 'REFUNDED';

      // 1. Partial refund to customer
      if (customerRefund > 0) {
        await financialService.processRefund(
          dispute.orderId,
          customerRefund,
          'dispute_arbitration',
          'Platform Mediator',
          true,
          `Dispute ${dispute.disputeNumber} arbitration: Partial refund to customer.`
        );
      }

      // 2. Partial release to seller available wallet
      if (providerPayout > 0) {
        await financialService.settleOrderEscrow(
          dispute.orderId,
          `Dispute ${dispute.disputeNumber} arbitration: Provider share released (${providerPayout.toLocaleString()} DA)`
        );
      }

      if (order) {
        order.status = 'completed';
        order.protection.escrowStatus = 'released_to_seller';
      }
    } else if (input.resolutionAction === 'RELEASE_TO_PROVIDER') {
      customerRefund = 0;
      providerPayout = dispute.disputedAmount;
      finalStatus = 'RELEASED';

      // Release full escrow to seller
      await financialService.settleOrderEscrow(
        dispute.orderId,
        `Dispute ${dispute.disputeNumber} ruled in favor of merchant.`
      );

      if (order) {
        order.status = 'completed';
        order.protection.escrowStatus = 'released_to_seller';
      }
    }

    // Update dispute record
    dispute.status = finalStatus;
    dispute.resolutionAction = input.resolutionAction;
    dispute.customerRefundAmount = customerRefund;
    dispute.providerPayoutAmount = providerPayout;
    dispute.mediatorNotes = input.mediatorNotes;
    dispute.resolvedAt = nowStr;
    dispute.updatedAt = nowStr;

    dispute.timeline.push({
      id: `tl_${Date.now()}`,
      disputeId: dispute.id,
      actorId: input.adminId,
      actorRole: 'ADMIN',
      eventType: 'DISPUTE_RESOLVED',
      message: `Dispute arbitrated: ${input.resolutionAction}. Customer refund: ${customerRefund.toLocaleString()} DA, Provider payout: ${providerPayout.toLocaleString()} DA. Notes: ${input.mediatorNotes}`,
      createdAt: nowStr,
    });

    this.saveDisputes(disputes);

    // Save order changes
    if (order && typeof window !== 'undefined') {
      try {
        order.updatedAt = nowStr;
        order.statusHistory.push({
          id: `hist_${Date.now()}`,
          orderId: order.id,
          status: order.status,
          description: `Dispute ${dispute.disputeNumber} resolved by platform mediator (${input.resolutionAction}). ${input.mediatorNotes}`,
          changedBy: input.adminId,
          changedByRole: 'ADMIN',
          createdAt: nowStr,
        });

        const allOrdersStr = localStorage.getItem('khidmatik_customer_orders_v2');
        if (allOrdersStr) {
          const allOrders = JSON.parse(allOrdersStr);
          const idx = allOrders.findIndex((o: any) => o.id === order.id);
          if (idx !== -1) {
            allOrders[idx] = order;
            localStorage.setItem('khidmatik_customer_orders_v2', JSON.stringify(allOrders));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    return { success: true, dispute };
  }
}

export const escrowDisputeService = new EscrowDisputeService();
