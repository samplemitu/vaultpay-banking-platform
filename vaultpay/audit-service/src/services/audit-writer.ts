import { AuditLog } from '../models/audit-log';

export class AuditWriter {
  static async write(log: {
    eventType: string;
    correlationId?: string;
    userId?: string;
    role?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    metadata?: any;
  }) {
    await AuditLog.create({
      ...log,
      timestamp: new Date(),
    });
  }
}
