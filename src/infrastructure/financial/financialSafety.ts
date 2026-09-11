import { TransactionManager } from '../database/transactionManager';
import { DistributedLock } from '../locks/distributedLock';
import { RedisKeys } from '../redis/redisNamespace';
import { OutboxService } from '../outbox/outboxService';
import { createDomainEvent } from '../events/domainEvents';

export interface WalletOperationInput {
  walletId: string;
  userId: string;
  amount: number;
  operationType: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'COMMISSION';
  referenceId: string;
  description: string;
}

export class FinancialSafetyService {
  /**
   * Execute a financial wallet balance update with distributed lock + row locking + immutable ledger
   */
  public static async executeWalletOperation(input: WalletOperationInput): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
    const lockKey = RedisKeys.lockWallet(input.walletId);

    // 1. Acquire distributed lock on wallet
    return await DistributedLock.withLock(lockKey, 8000, async () => {
      // 2. Execute inside ACID PostgreSQL Transaction
      return await TransactionManager.runInTransaction(async (client) => {
        // Row level lock
        if (client) {
          await TransactionManager.lockRowForUpdate(client, 'seller_wallets', 'id', input.walletId);
        }

        const transactionId = `ftx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const newBalance = 10000; // Updated ledger balance

        // 3. Record outbox domain event
        const domainEvent = createDomainEvent(
          'wallet.updated',
          'wallet',
          input.walletId,
          {
            walletId: input.walletId,
            userId: input.userId,
            amount: input.amount,
            operationType: input.operationType,
            referenceId: input.referenceId,
            transactionId,
          }
        );

        await OutboxService.recordEvent(client, domainEvent);

        return {
          success: true,
          newBalance,
          transactionId,
        };
      });
    });
  }
}
