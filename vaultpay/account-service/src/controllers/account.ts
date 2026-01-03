import { Request, Response } from 'express';
import { Account } from '../models/account';
// publisher coming tomorrow
// import { AccountCreatedPublisher } from '../events/publishers/account-created-publisher';

export class AccountController {
  // POST /accounts/create
  static async createAccount(req: Request, res: Response) {
    const { accountNumber, accountType, currency } = req.body;
    const userId = (req as any).currentUser?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // prevent duplicate account types
    const existing = await Account.findOne({ userId, accountType });
    if (existing) {
      return res.status(400).json({
        error: `${accountType} account already exists for this user`,
      });
    }

    const account = await Account.create({
      userId,
      accountNumber,
      accountType,
      currency: currency || 'INR',
      balance: 0,
    });

    // JetStream publish (added tomorrow)
    // await AccountCreatedPublisher.publish({
    //   accountId: account.id,
    //   userId,
    //   accountType,
    //   currency: account.currency
    // });

    return res.status(201).json({
      message: 'Account created successfully',
      accountId: account.id,
    });
  }
}
