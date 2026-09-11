import { TopUpMethod, TopUpRequest } from '@/types/financials';

export interface ProviderVerificationResult {
  verified: boolean;
  providerTransactionId?: string;
  externalStatus: 'PAID' | 'PENDING' | 'NOT_FOUND' | 'FAILED';
  paidAmount?: number;
  payerAccount?: string;
  settledAt?: string;
  rawPayload?: any;
  error?: string;
}

export interface PaymentProvider {
  providerName: string;
  supportedMethods: TopUpMethod[];
  verifyPayment(request: TopUpRequest): Promise<ProviderVerificationResult>;
  validateWebhookSignature?(payload: string, signature: string): boolean;
  parseWebhookEvent?(event: any): { reference: string; amount: number; providerTxId: string; status: 'success' | 'failed' };
}

class MockBaridiMobProvider implements PaymentProvider {
  providerName = 'BaridiMob / بريد الجزائر الإلكتروني';
  supportedMethods: TopUpMethod[] = ['baridimob'];

  async verifyPayment(request: TopUpRequest): Promise<ProviderVerificationResult> {
    const code = request.postalTransactionCode || request.paymentReference;
    if (!code || code.trim().length < 4) {
      return {
        verified: false,
        externalStatus: 'PENDING',
        error: 'كود عملية BaridiMob قصير أو غير مكتمل',
      };
    }

    // Algorithmic validation of BaridiMob receipt code format
    const isValidFormat = /^[A-Za-z0-9\-_]{4,30}$/.test(code.trim());
    if (!isValidFormat) {
      return {
        verified: false,
        externalStatus: 'FAILED',
        error: 'صيغة كود BaridiMob غير صالحة',
      };
    }

    // In a live integration, this calls the BaridiMob Merchant API
    return {
      verified: true,
      providerTransactionId: `BM_SETTLE_${code.trim().toUpperCase()}`,
      externalStatus: 'PAID',
      paidAmount: request.amount,
      payerAccount: request.senderAccount || '00799999001827364512',
      settledAt: new Date().toISOString(),
    };
  }
}

class MockSatimProvider implements PaymentProvider {
  providerName = 'SATIM / البطاقة الذهبية و CIB';
  supportedMethods: TopUpMethod[] = ['edahabia', 'cib'];

  async verifyPayment(request: TopUpRequest): Promise<ProviderVerificationResult> {
    const code = request.postalTransactionCode || request.paymentReference;
    if (!code) {
      return {
        verified: false,
        externalStatus: 'PENDING',
        error: 'رقم مرجع SATIM غير متوفر',
      };
    }

    return {
      verified: true,
      providerTransactionId: `SATIM_GW_${Date.now()}`,
      externalStatus: 'PAID',
      paidAmount: request.amount,
      settledAt: new Date().toISOString(),
    };
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    return signature.length > 10;
  }
}

class MockCcpPostalProvider implements PaymentProvider {
  providerName = 'Algérie Poste (CCP)';
  supportedMethods: TopUpMethod[] = ['ccp', 'algerie_poste'];

  async verifyPayment(request: TopUpRequest): Promise<ProviderVerificationResult> {
    const code = request.postalTransactionCode || request.paymentReference;
    if (!code || code.trim().length < 4) {
      return {
        verified: false,
        externalStatus: 'PENDING',
        error: 'رقم حوالة CCP مطلوب للمطابقة',
      };
    }

    return {
      verified: true,
      providerTransactionId: `CCP_POST_${code.trim()}`,
      externalStatus: 'PAID',
      paidAmount: request.amount,
      settledAt: new Date().toISOString(),
    };
  }
}

class PaymentProviderRegistry {
  private providers: PaymentProvider[] = [
    new MockBaridiMobProvider(),
    new MockSatimProvider(),
    new MockCcpPostalProvider(),
  ];

  public getProviderForMethod(method: TopUpMethod): PaymentProvider | null {
    return this.providers.find((p) => p.supportedMethods.includes(method)) || null;
  }

  public registerProvider(provider: PaymentProvider) {
    this.providers.push(provider);
  }
}

export const paymentProviderRegistry = new PaymentProviderRegistry();
