/**
 * SEO Service Automated Test Suite
 * Tests deterministic metadata generation and enhancer pipeline
 */

import { SeoService, DeterministicSeoEnhancer, type ISeoEnhancer } from '../seoService';
import type { SeoContext } from '../../types/ai';
import type { MetadataProps } from '../../lib/seo/metadata';

// Standalone Test Runner Harness
const describe = (name: string, fn: () => void) => fn();
const it = async (name: string, fn: () => void | Promise<void>) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
    throw err;
  }
};
const expect = (actual: any) => ({
  toContain: (substring: string) => {
    if (!String(actual).includes(substring)) {
      throw new Error(`Expected "${actual}" to contain "${substring}"`);
    }
  },
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but received ${actual}`);
    }
  },
});

async function runTests() {
  console.log('\n--- Running SeoService Tests ---');

  await it('should generate deterministic store metadata without any AI dependency', async () => {
    const seo = new SeoService();
    const metadata = await seo.getStoreMetadata({
      id: 'store-123',
      name: 'Supermarché El Bahdja',
      category: 'Alimentation',
      city: 'Alger',
      wilayaCode: '16',
      description: 'Grand supermarché avec produits frais locaux et importation.',
      type: 'store',
    });

    expect(metadata.title).toContain('Supermarché El Bahdja');
    expect(metadata.title).toContain('Alimentation');
    expect(metadata.title).toContain('Alger');
    expect(metadata.description).toContain('Grand supermarché');
  });

  await it('should generate deterministic product metadata', async () => {
    const seo = new SeoService();
    const metadata = await seo.getProductMetadata({
      id: 'prod-456',
      name: 'Climatiseur Inverter 12000 BTU',
      category: 'Electroménager',
      price: 65000,
      storeName: 'Boutique Tech DZ',
    });

    expect(metadata.title).toContain('Climatiseur Inverter 12000 BTU');
    expect(metadata.title).toContain('Boutique Tech DZ');
    expect(metadata.description).toContain('65000 DA');
  });

  await it('should generate deterministic category and search metadata', async () => {
    const seo = new SeoService();
    const searchMeta = await seo.getSearchMetadata({
      q: 'Plomberie',
      location: '16',
      type: 'professional',
    });

    expect(searchMeta.title).toContain('Plomberie');
    expect(searchMeta.title).toContain('الجزائر');
  });

  await it('should allow pluggable enhancers while maintaining deterministic fallback by default', async () => {
    const seo = new SeoService();

    // Default enhancer is DeterministicSeoEnhancer (zero network, zero AI)
    const baseMeta = await seo.getSearchMetadata({ q: 'Test' });
    expect(baseMeta.title).toContain('Test');

    // Conceptual future enhancer implementation
    class MockCustomEnhancer implements ISeoEnhancer {
      async enhance(_context: SeoContext, currentMetadata: MetadataProps): Promise<MetadataProps> {
        return {
          ...currentMetadata,
          title: `Custom Enhanced: ${currentMetadata.title}`,
        };
      }
    }

    seo.setEnhancer(new MockCustomEnhancer());
    const enhancedMeta = await seo.getSearchMetadata({ q: 'Test' });
    expect(enhancedMeta.title).toContain('Custom Enhanced:');
  });

  console.log('--- All SeoService Tests Passed! ---\n');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
