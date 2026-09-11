'use client';

import React from 'react';
import { SellerShippingSettings } from './SellerShippingSettings';

export function DeliverySettingsSection() {
  return (
    <div className="space-y-6">
      <SellerShippingSettings storeId="str_1" />
    </div>
  );
}
