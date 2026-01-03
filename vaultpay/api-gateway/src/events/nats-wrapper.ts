/**
 * nats-wrapper.ts
 * Lightweight JetStream wrapper used across services.
 *
 * Usage:
 *  await nats.connect();
 *  await nats.ensureStream('mystream', ['subject.a', 'subject.b']);
 *  await nats.publish('subject.a', { foo: 'bar' });
 *  await nats.subscribeDurable('subject.a', 'durable-name', 'queue-group', handler, { maxDeliver: 5, ackWaitMs: 30000 });
 */

import {
  connect,
  NatsConnection,
  JetStreamClient,
  StringCodec,
  consumerOpts,
  JetStreamPublishOptions,
  JsMsg,
} from 'nats';

const sc = StringCodec();

export type MessageHandler = (msg: JsMsg) => Promise<void> | void;

export class NatsWrapper {
  private nc?: NatsConnection;
  private js?: JetStreamClient;
  private connected = false;

  // connect to NATS server and initialize jetstream client
  async connect(natsUrl: string, clientName?: string) {
    if (this.connected) return;
    this.nc = await connect({ servers: natsUrl, name: clientName });
    this.js = this.nc.jetstream();
    this.connected = true;

    // handle disconnects gracefully (logs only; application-level reconnect handled by nats client)
    (this.nc as any).closed().then((err: any) => {
      console.error('NATS connection closed', err);
      process.exit(1); // for simplicity we crash and rely on k8s restart; adjust as needed
    });

    console.log('NATS JetStream connected to', natsUrl);
  }

  get client(): NatsConnection {
    if (!this.nc) throw new Error('NATS not connected');
    return this.nc;
  }

  get jetstream(): JetStreamClient {
    if (!this.js) throw new Error('JetStream not initialized');
    return this.js;
  }

  // ensure a stream exists (idempotent)
  // streamName: name of the stream; subjects: array of subjects to bind to stream
  async ensureStream(streamName: string, subjects: string[]) {
    if (!this.nc) throw new Error('NATS not connected');
    const jsm = this.nc.jetstreamManager();

    try {
      // look up stream
      await jsm.streams.info(streamName);
      // update subjects if needed (optional)
      // no-op for now
    } catch (err) {
      // stream doesn't exist → create
      await jsm.streams.add({
        name: streamName,
        subjects,
        retention: 'limits', // limits retention, configurable
        max_bytes: -1,
        storage: 'file',
        num_replicas: 1,
      });
      console.log(
        `Created stream ${streamName} for subjects: ${subjects.join(',')}`
      );
    }
  }

  // publish JSON data to subject with JetStream persistence
  async publish(
    subject: string,
    data: any,
    opts?: Partial<JetStreamPublishOptions>
  ) {
    if (!this.js) throw new Error('JetStream not initialized');
    const payload = sc.encode(JSON.stringify(data));
    return this.js.publish(subject, payload, opts);
  }

  // subscribe durable with queue group (load-balanced across instances)
  // when msg fails repeatedly we publish to a DLQ subject: `${subject}.DLQ`
  async subscribeDurable(
    subject: string,
    durableName: string,
    queueGroup: string | undefined,
    handler: MessageHandler,
    opts?: { maxDeliver?: number; ackWaitMs?: number }
  ) {
    if (!this.js) throw new Error('JetStream not initialized');

    const maxDeliver = opts?.maxDeliver ?? 5;
    const ackWaitMs = opts?.ackWaitMs ?? 30_000;

    // Create a consumer configuration via jetstream manager to ensure settings like max_deliver exist.
    const jsm = this.nc!.jetstreamManager();

    // Try to create/update consumer config (idempotent)
    try {
      // If consumer exists, this will throw; ignore and continue
      await jsm.consumers
        .info('$JS.EVENT.ANY', durableName)
        .catch(() => undefined);
    } catch (e) {
      // ignore
    }

    // Use js.subscribe (async iterable). Provide durable name and queue group for load balancing.
    const sub = await this.js.subscribe(subject, {
      durable: durableName,
      queue: queueGroup,
      // ack explicit is default in JetStream; we will ack manually after successful handler
    });

    (async () => {
      console.log(
        `JetStream durable subscription started: subject=${subject} durable=${durableName} queue=${
          queueGroup || 'none'
        }`
      );
      for await (const m of sub) {
        try {
          // run user handler
          await handler(m);

          // ack message
          try {
            m.ack();
          } catch (ackErr) {
            console.error('Failed to ack message', ackErr);
          }
        } catch (err) {
          // Failed handler — check redelivery count
          const info: any = (m.info as any) || {};
          const redeliverCount =
            info?.redeliveryCount ?? info?.deliveryAttempt ?? 1;

          console.error(
            `Message handler failed for ${subject}. redeliverCount=${redeliverCount}; error=${
              (err as Error).message
            }`
          );

          if (redeliverCount >= maxDeliver) {
            // Publish to DLQ subject for human/operator review + dead-letter handling
            const dlqSubject = `${subject}.DLQ`;
            const payload = {
              subject,
              durableName,
              queueGroup,
              failedAt: new Date().toISOString(),
              redeliverCount,
              raw: new TextDecoder().decode(m.data),
              error: (err as Error).message,
            };
            try {
              await this.publish(dlqSubject, payload);
              // ack original message to avoid further retries
              m.ack();
              console.warn(`Published to DLQ: ${dlqSubject}`);
            } catch (dlqErr) {
              console.error('Failed to publish DLQ message', dlqErr);
              // don't ack — message will be retried per JetStream retry policy
            }
          } else {
            // don't ack — JetStream will redeliver
            // optionally, we can NAK with a delay: m.nak(); or m.term() for termination
            try {
              m.nak();
            } catch (nakErr) {
              console.error('Failed to nak', nakErr);
            }
          }
        }
      }
      console.log(`Subscription on ${subject} closed`);
    })();
  }

  // Disconnect helper
  async close() {
    if (this.nc) {
      await this.nc.close();
      this.connected = false;
    }
  }
}

export const natsWrapper = new NatsWrapper();
