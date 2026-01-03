import { Request, Response } from 'express';
import { IdempotencyService } from '../services/idempotency';
import { TransactionOrchestrator } from '../saga/transaction-orchestrator';

export class TransactionController {
  // POST /transaction/initiate
  static async initiate(req: Request, res: Response) {
    const { fromAccountId, toAccountId, amount, idempotencyKey } = req.body;
    const userId = (req as any).currentUser?.userId;

    if (!idempotencyKey) {
      return res.status(400).json({ error: 'idempotencyKey required' });
    }

    const lock = await IdempotencyService.checkAndLock(idempotencyKey);
    if (!lock) {
      return res.status(409).json({ error: 'Duplicate request' });
    }

    // Saga Begin
    await TransactionOrchestrator.start({
      userId,
      fromAccountId,
      toAccountId,
      amount,
      idempotencyKey,
    });

    return res.status(202).json({
      message: 'Transaction accepted for processing',
      status: 'pending',
    });
  }
}
