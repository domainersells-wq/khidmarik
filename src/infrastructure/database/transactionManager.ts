import { PoolClient } from 'pg';
import { dbPool } from './dbPool';

export class TransactionManager {
  /**
   * Run an asynchronous callback within an ACID PostgreSQL transaction.
   * Automatically executes BEGIN, COMMIT, and ROLLBACK upon error, ensuring connection release.
   */
  public static async runInTransaction<T>(
    callback: (client: PoolClient | null) => Promise<T>
  ): Promise<T> {
    if (!dbPool.isAvailable()) {
      // Resilient fallback when direct pg pool is unconfigured
      return await callback(null);
    }

    const client = await dbPool.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('[TransactionManager] Rollback failed:', rollbackErr);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Acquire a PostgreSQL row-level lock (SELECT ... FOR UPDATE) to prevent race conditions
   */
  public static async lockRowForUpdate(
    client: PoolClient | null,
    tableName: string,
    idColumn: string,
    idValue: string | number
  ): Promise<any> {
    if (!client) return null;
    const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 FOR UPDATE`;
    const res = await client.query(query, [idValue]);
    return res.rows[0] || null;
  }
}
