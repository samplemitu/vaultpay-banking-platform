import { natsWrapper } from '../nats-wrapper';
import { AuditWriter } from '../services/audit-writer';
import { GatewayRequestLoggedEvent } from '../events/events';

export class AuditListener {
  static async listen() {
    const js = natsWrapper.jetstream;

    const sub = await js.subscribe('gateway.request.logged');

    for await (const msg of sub) {
      const event = JSON.parse(msg.data.toString()) as GatewayRequestLoggedEvent;

      await AuditWriter.write({
        eventType: 'gateway.request.logged',
        correlationId: event.correlationId,
        userId: event.userId || undefined,
        role: event.role || undefined,
        path: event.path,
        method: event.method,
        statusCode: event.statusCode,
        metadata: { durationMs: event.durationMs },
      });

      msg.ack();
    }
  }
}
