export class AuditService {
  static async log(event: string, payload: Record<string, any>) {
    // Later: publish to NATS / Kafka / dedicated audit DB
    // For now: console + keep function async for scalability
    console.log(`[AUDIT] ${event}`, {
      ...payload,
      at: new Date().toISOString(),
    });
  }
}
