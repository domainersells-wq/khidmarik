import type { 
  CalculateFeeInput, 
  ShippingFeeQuote, 
  SellerShippingSettings,
  ShippingRateRule 
} from '@/types/shipping';
import { shippingProviderFactory } from './ShippingProviderFactory';

export class ShippingCalculator {
  /**
   * Calculate all available shipping rate quotes for a customer order
   */
  public async calculateQuotes(
    input: CalculateFeeInput,
    sellerSettings?: SellerShippingSettings,
    databaseRateRules: ShippingRateRule[] = []
  ): Promise<ShippingFeeQuote[]> {
    const quotes: ShippingFeeQuote[] = [];
    const providers = shippingProviderFactory.getAllProviders();

    // Determine enabled providers for this seller
    const enabledIds = input.enabled_providers || 
      (sellerSettings?.enabled_providers?.length ? sellerSettings.enabled_providers : ['manual', 'yalidine', 'zr_express', 'maystro', 'in_house']);

    for (const provider of providers) {
      if (!enabledIds.includes(provider.id) && !enabledIds.includes(provider.code)) {
        continue;
      }

      try {
        // 1. Check if seller has custom wilaya override rate
        const wilayaCode = input.to_wilaya.split('-')[0].trim().padStart(2, '0');
        const customWilaya = sellerSettings?.custom_wilaya_rates?.[wilayaCode];

        // 2. Check Database Rules first
        const dbRule = databaseRateRules.find(r => 
          r.is_active && 
          (!r.provider_id || r.provider_id === provider.id) &&
          (!r.wilaya_code || r.wilaya_code === wilayaCode) &&
          input.weight_kg >= r.min_weight && input.weight_kg <= r.max_weight
        );

        let homeFee = 600;
        let deskFee = 400;
        let isFree = false;

        if (customWilaya && customWilaya.is_covered) {
          homeFee = customWilaya.home_rate;
          deskFee = customWilaya.desk_rate;
        } else if (dbRule) {
          homeFee = Number(dbRule.base_fee) + Math.max(0, input.weight_kg - dbRule.min_weight) * Number(dbRule.extra_kg_fee);
          deskFee = Math.max(200, homeFee - 200);
          if (dbRule.free_shipping_threshold && input.order_total >= dbRule.free_shipping_threshold) {
            isFree = true;
          }
        } else {
          // 3. Fallback to direct carrier adapter calculation
          const homeRes = await provider.calculateShippingFee({
            fromWilaya: input.from_wilaya,
            toWilaya: input.to_wilaya,
            weightKg: input.weight_kg,
            methodCode: 'home_delivery',
            orderTotal: input.order_total,
          });
          const deskRes = await provider.calculateShippingFee({
            fromWilaya: input.from_wilaya,
            toWilaya: input.to_wilaya,
            weightKg: input.weight_kg,
            methodCode: 'stop_desk',
            orderTotal: input.order_total,
          });
          homeFee = homeRes.fee;
          deskFee = deskRes.fee;
        }

        // Check seller free shipping threshold
        if (sellerSettings?.is_free_shipping_active && input.order_total >= sellerSettings.free_shipping_threshold) {
          isFree = true;
        }

        // Home Delivery Quote
        quotes.push({
          provider_id: provider.id,
          provider_name: provider.name,
          provider_code: provider.code,
          shipping_method_id: 'mth_home',
          shipping_method_code: 'home_delivery',
          shipping_method_name: 'Home Delivery (Doorstep)',
          shipping_method_name_ar: 'توصيل لباب المنزل (À Domicile)',
          fee: isFree ? 0 : homeFee,
          is_free: isFree,
          estimated_days_min: 1,
          estimated_days_max: 2,
        });

        // Stop Desk Quote (if provider supports pickup agency)
        if (provider.capabilities.supports_pickup && provider.id !== 'in_house') {
          quotes.push({
            provider_id: provider.id,
            provider_name: provider.name,
            provider_code: provider.code,
            shipping_method_id: 'mth_desk',
            shipping_method_code: 'stop_desk',
            shipping_method_name: 'Pickup Point (Stop Desk)',
            shipping_method_name_ar: 'استلام من المكتب (Stop Desk / Bureau)',
            fee: isFree ? 0 : deskFee,
            is_free: isFree,
            estimated_days_min: 1,
            estimated_days_max: 3,
            stop_desk_name: `وكالة ${provider.nameAr} - ${input.to_wilaya}`,
          });
        }
      } catch (err) {
        console.warn(`Could not calculate quote for ${provider.id}:`, err);
      }
    }

    return quotes.sort((a, b) => a.fee - b.fee);
  }
}

export const shippingCalculator = new ShippingCalculator();
