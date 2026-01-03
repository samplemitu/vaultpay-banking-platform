import { Request, Response } from 'express';
import { AuditLog } from '../models/audit-log';

export class AuditController {

  // GET /audit/logs
  static async getLogs(req: Request, res: Response) {
    const { userId, correlationId, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (userId) filter.userId = userId;
    if (correlationId) filter.correlationId = correlationId;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return res.json({
      page: +page,
      limit: +limit,
      results: logs.length,
      logs,
    });
  }
}
