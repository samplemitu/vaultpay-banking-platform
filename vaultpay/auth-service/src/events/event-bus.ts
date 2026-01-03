import { connect, StringCodec, JetStreamClient } from 'nats';

const sc = StringCodec();
let js: JetStreamClient;

export async function initEventBus() {
  try {
    // In production, handle connection retries here
    const nc = await connect({ servers: process.env.NATS_URL! });
    js = nc.jetstream();
    console.log('🚀 Connected to NATS JetStream');
  } catch (err) {
    console.error('Failed to connect to NATS', err);
    process.exit(1);
  }
}

export async function publishEvent(subject: string, payload: object) {
  if (!js) throw new Error('JetStream not initialized');
  await js.publish(subject, sc.encode(JSON.stringify(payload)));
}

// Subscribe is strictly for background workers, not usually the API
export async function subscribeEvent(
  subject: string,
  handler: (data: any) => void
) {
  if (!js) throw new Error('JetStream not initialized');
  const sub = await js.subscribe(subject);
  (async () => {
    for await (const m of sub) {
      const data = JSON.parse(sc.decode(m.data));
      handler(data);
    }
  })();
}
