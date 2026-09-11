import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';
import { getServerWallet } from '@/infrastructure/storage/serverFinancialStore';

/**
 * GET /api/v1/financial/wallets/[userId]
 * Fetches the canonical wallet balance and details for a specific user ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const serverWallet = getServerWallet(userId);
    const serviceWallet = financialService.getUserWallet(userId);
    const availableBalance = Math.max(serverWallet.availableBalance, serviceWallet.availableBalance);
    const lifetimeGross = Math.max(serverWallet.lifetimeGross, serviceWallet.lifetimeGross, availableBalance);

    return NextResponse.json({
      success: true,
      wallet: {
        walletId: `wallet_${userId}`,
        userId: serverWallet.sellerId || serviceWallet.sellerId,
        userName: serverWallet.sellerName || serviceWallet.sellerName,
        availableBalance,
        pendingBalance: serverWallet.pendingBalance || serviceWallet.pendingBalance,
        escrowBalance: serverWallet.pendingBalance || serviceWallet.pendingBalance,
        totalDeposited: lifetimeGross,
        totalWithdrawn: serverWallet.totalWithdrawn || serviceWallet.totalWithdrawn,
        totalCommissionPaid: serverWallet.totalCommissionPaid || serviceWallet.totalCommissionPaid,
        currency: serverWallet.currency || 'DZD',
        lastSettlementAt: serverWallet.lastSettlementAt || serviceWallet.lastSettlementAt,
      },
    });
  } catch (error: any) {
    console.error('[API /api/v1/financial/wallets/[userId] GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user wallet' },
      { status: 500 }
    );
  }
}
