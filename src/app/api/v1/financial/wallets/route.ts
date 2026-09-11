import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

/**
 * GET /api/v1/financial/wallets
 * Returns all wallets or queries a specific wallet via ?userId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const wallet = financialService.getUserWallet(userId);
      return NextResponse.json({
        success: true,
        wallet: {
          walletId: `wallet_${userId}`,
          userId: wallet.sellerId,
          userName: wallet.sellerName,
          availableBalance: wallet.availableBalance,
          pendingBalance: wallet.pendingBalance,
          escrowBalance: wallet.pendingBalance,
          totalDeposited: wallet.lifetimeGross,
          totalWithdrawn: wallet.totalWithdrawn,
          totalCommissionPaid: wallet.totalCommissionPaid,
          currency: wallet.currency,
          lastSettlementAt: wallet.lastSettlementAt,
        },
      });
    }

    const wallets = financialService.getSellerWallets();
    return NextResponse.json({
      success: true,
      count: wallets.length,
      wallets: wallets.map((w) => ({
        walletId: `wallet_${w.sellerId}`,
        userId: w.sellerId,
        userName: w.sellerName,
        availableBalance: w.availableBalance,
        pendingBalance: w.pendingBalance,
        escrowBalance: w.pendingBalance,
        totalDeposited: w.lifetimeGross,
        totalWithdrawn: w.totalWithdrawn,
        totalCommissionPaid: w.totalCommissionPaid,
        currency: w.currency,
        lastSettlementAt: w.lastSettlementAt,
      })),
    });
  } catch (error: any) {
    console.error('[API /api/v1/financial/wallets GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}
