import { shippingManagerService } from './ShippingManagerService';
import { shippingProviderFactory } from './ShippingProviderFactory';
import type { Shipment } from '@/types/shipping';

export class ShippingSyncService {
  /**
   * Synchronize active in-transit shipments for a specific carrier via API polling
   */
  public async syncProviderShipments(providerId: string): Promise<{
    syncedCount: number;
    updatedCount: number;
    errors: string[];
  }> {
    const provider = shippingProviderFactory.getProvider(providerId);
    if (!provider.capabilities.supports_tracking) {
      return { syncedCount: 0, updatedCount: 0, errors: ['Carrier does not support automated tracking API'] };
    }

    const allShipments = await shippingManagerService.getAllShipments({
      provider_id: provider.id,
    });

    // Only sync non-final shipments
    const activeShipments = allShipments.filter(s => 
      s.status !== 'delivered' && s.status !== 'returned' && s.status !== 'cancelled'
    );

    let updatedCount = 0;
    const errors: string[] = [];

    for (const shipment of activeShipments) {
      if (!shipment.provider_tracking_number) continue;

      try {
        const tracking = await provider.trackShipment(shipment.provider_tracking_number);
        
        // If status changed, update shipment and add timeline event idempotently
        if (tracking.status && tracking.status !== shipment.status) {
          await shippingManagerService.updateShipmentStatus({
            trackingNumber: shipment.tracking_number,
            newStatus: tracking.status,
            description: `Auto-synced via ${provider.name} API polling`,
            location: tracking.location,
            driverName: tracking.driverName,
            driverPhone: tracking.driverPhone,
            actorRole: 'SYSTEM',
            actorName: `${provider.name} Polling Sync`,
          });
          updatedCount++;
        }
      } catch (err: any) {
        errors.push(`Failed syncing ${shipment.tracking_number}: ${err.message}`);
      }
    }

    return {
      syncedCount: activeShipments.length,
      updatedCount,
      errors,
    };
  }
}

export const shippingSyncService = new ShippingSyncService();
