# Khidmatik Logistics — Developer Shipping Integration Guide

This guide explains how to integrate a new Algerian or international logistics carrier into **Khidmatik** without touching or modifying the core order, checkout, or shipment tracking systems.

---

## 1. Overview & Architecture

Khidmatik uses an **extensible Provider Adapter Pattern**. The core platform interacts exclusively through the `ShippingProvider` interface abstraction.

```text
┌────────────────────────────────────────────────────────┐
│               Khidmatik Core Platform                  │
│   (Checkout, Orders, Tracking, Seller & Admin Dash)    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │ ShippingProviderFactory  │
              └────────────┬─────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐
│ ManualProvider│  │YalidineAdapter│  │ NewAlgerianAdapter   │
└──────────────┘   └──────────────┘   └──────────────────────┘
                                                 │
                                                 ▼
                                     ┌────────────────────────┐
                                     │ External Courier REST  │
                                     │ API / Webhooks         │
                                     └────────────────────────┘
```

---

## 2. Step-by-Step Integration Workflow

### Step 1: Create the Carrier Adapter Class
Create a new file in `src/services/shipping/providers/` (e.g., `EcoTrackShippingProvider.ts`).

Implement the `ShippingProvider` interface from `ShippingProviderInterface.ts`:

```typescript
import type {
  ShippingProvider,
  ShippingProviderResult,
  TrackingResult,
  PickupResult,
  ShippingFeeResult,
  AlgerianWilayaCoverage
} from './ShippingProviderInterface';
import type { 
  InternalShipmentStatus, 
  ProviderCapabilities, 
  CreateShipmentInput 
} from '@/types/shipping';

export class EcoTrackShippingProvider implements ShippingProvider {
  readonly id = 'ecotrack';
  readonly code = 'ecotrack';
  readonly name = 'EcoTrack Delivery';
  readonly nameAr = 'إيكوتراك للتوصيل السريع';

  readonly capabilities: ProviderCapabilities = {
    supports_tracking: true,
    supports_pickup: true,
    supports_cod: true,
    supports_cancellation: true,
    supports_label_generation: true,
    supports_webhooks: true,
    supports_shipping_calculation: true,
    supports_return: true,
    supports_address_validation: true,
  };

  async createShipment(data: CreateShipmentInput): Promise<ShippingProviderResult> {
    // 1. Prepare request payload for EcoTrack REST API
    // 2. Call EcoTrack POST /api/v1/parcels with credentials
    // 3. Return standardized provider result
    const trackingNumber = `ECO-${Date.now()}`;
    return {
      providerTrackingNumber: trackingNumber,
      barcode: `*${trackingNumber}*`,
      manifestNumber: `MNF-ECO-01`,
      labelUrl: `https://ecotrack.dz/labels/${trackingNumber}.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };
  }

  async cancelShipment(providerTrackingNumber: string, reason?: string) {
    // Call EcoTrack cancel endpoint
    return { success: true, message: 'Cancelled successfully' };
  }

  async trackShipment(providerTrackingNumber: string): Promise<TrackingResult> {
    // Fetch live status from carrier API
    return {
      status: 'in_transit',
      rawStatus: 'IN_HUB',
      location: 'Central EcoTrack Hub',
      events: [],
    };
  }

  async requestPickup(data: any): Promise<PickupResult> {
    // Dispatch driver collection request
    return { success: true, pickupId: `PKP-ECO-${Date.now()}` };
  }

  async calculateShippingFee(data: any): Promise<ShippingFeeResult> {
    const isStopDesk = data.methodCode === 'stop_desk';
    return {
      fee: isStopDesk ? 400 : 650,
      isCovered: true,
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
    };
  }

  async getSupportedWilayas(): Promise<AlgerianWilayaCoverage[]> {
    return Array.from({ length: 58 }, (_, i) => ({
      code: String(i + 1).padStart(2, '0'),
      name: `Wilaya ${i + 1}`,
      nameAr: `ولاية ${i + 1}`,
      isHomeCovered: true,
      isDeskCovered: true,
    }));
  }

  /**
   * CRITICAL: Map raw carrier status to standardized Khidmatik InternalShipmentStatus
   */
  mapStatus(providerStatus: string): InternalShipmentStatus {
    const s = providerStatus?.toUpperCase().trim() || '';
    if (s === 'READY' || s === 'CREATED') return 'pending';
    if (s === 'PICKUP_DISPATCHED') return 'pickup_requested';
    if (s === 'PARCEL_COLLECTED') return 'picked_up';
    if (s === 'IN_TRANSIT' || s === 'HUB_TRANSFER') return 'in_transit';
    if (s === 'ARRIVED_LOCAL_BUREAU') return 'arrived_at_destination';
    if (s === 'OUT_WITH_COURIER') return 'out_for_delivery';
    if (s === 'CUSTOMER_NOT_REACHABLE') return 'delivery_attempted';
    if (s === 'DELIVERED_CASH_COLLECTED') return 'delivered';
    if (s === 'FAILED_MAX_ATTEMPTS') return 'failed_delivery';
    if (s === 'RETURNING_TO_STORE') return 'returned';
    if (s === 'CANCELLED') return 'cancelled';
    return 'in_transit';
  }
}
```

---

### Step 2: Register Provider in the Factory
In `src/services/shipping/ShippingProviderFactory.ts`:

```typescript
import { EcoTrackShippingProvider } from './providers/EcoTrackShippingProvider';

// Inside constructor:
this.register(new EcoTrackShippingProvider());
```

---

### Step 3: Configure Inbound Webhooks
Carriers can push events to:
```text
POST /api/webhooks/shipping/ecotrack
```

Payload format sent by carrier:
```json
{
  "tracking_number": "KHM-2026-904128",
  "status": "DELIVERED_CASH_COLLECTED",
  "title_ar": "تم التسليم بنجاح",
  "location": "31 - Oran",
  "driver_name": "Karim Couriere"
}
```

The system will:
1. Validate carrier authentication/secret.
2. Translate `DELIVERED_CASH_COLLECTED` -> `delivered` via `mapStatus()`.
3. Check idempotency (prevent duplicate timeline events).
4. Update the shipment and order records automatically.

---

## 3. Best Practices & Security Checklist

- [x] **Never expose carrier API tokens in frontend source code**. All API requests must execute server-side or via adapter classes.
- [x] **Always handle network timeouts gracefully**. Return fallback quotes if external carrier API experiences downtime.
- [x] **Ensure Idempotent Webhook Processing**. Multiple identical webhook pings must never create duplicate timeline events.
- [x] **Verify COD collection**. Mark `cod_status = 'collected'` only when confirmed by carrier status or OTP verified handover.
