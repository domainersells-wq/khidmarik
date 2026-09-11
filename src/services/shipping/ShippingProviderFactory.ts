import type { ShippingProvider } from './providers/ShippingProviderInterface';
import { ManualShippingProvider } from './providers/ManualShippingProvider';
import { YalidineShippingProvider } from './providers/YalidineShippingProvider';
import { ZRExpressShippingProvider } from './providers/ZRExpressShippingProvider';
import { MaystroShippingProvider } from './providers/MaystroShippingProvider';
import { InHouseShippingProvider } from './providers/InHouseShippingProvider';

class ShippingProviderFactoryRegistry {
  private providers: Map<string, ShippingProvider> = new Map();
  private defaultProviderCode = 'manual';

  constructor() {
    // Register Default Built-in & Algerian Courier Adapters
    this.register(new ManualShippingProvider());
    this.register(new YalidineShippingProvider());
    this.register(new ZRExpressShippingProvider());
    this.register(new MaystroShippingProvider());
    this.register(new InHouseShippingProvider());
  }

  /**
   * Register a new shipping provider adapter dynamically
   */
  public register(provider: ShippingProvider): void {
    this.providers.set(provider.id.toLowerCase(), provider);
    this.providers.set(provider.code.toLowerCase(), provider);
  }

  /**
   * Retrieve carrier adapter instance by code or id
   * Falls back to ManualShippingProvider if not found
   */
  public getProvider(identifier: string): ShippingProvider {
    const key = (identifier || '').toLowerCase().trim();
    const provider = this.providers.get(key);
    if (provider) return provider;

    console.warn(`Shipping provider '${identifier}' not found in registry. Falling back to Manual provider.`);
    return this.providers.get(this.defaultProviderCode)!;
  }

  /**
   * Check if carrier exists
   */
  public hasProvider(identifier: string): boolean {
    return this.providers.has((identifier || '').toLowerCase().trim());
  }

  /**
   * List all unique registered carrier adapters
   */
  public getAllProviders(): ShippingProvider[] {
    const unique = new Map<string, ShippingProvider>();
    for (const provider of this.providers.values()) {
      unique.set(provider.id, provider);
    }
    return Array.from(unique.values());
  }
}

export const shippingProviderFactory = new ShippingProviderFactoryRegistry();
