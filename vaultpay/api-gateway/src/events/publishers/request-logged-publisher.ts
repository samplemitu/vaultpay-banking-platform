import { connect, JetStreamClient, NatsConnection } from 'nats';
import { config } from '../../config/env';

let nc: NatsConnection;
let js: JetStreamClient;

export const initJetStream = async () => {
  nc = await connect({ servers: config.natsUrl });
  js = nc.jetstream();
};

export const publishRequestLog = async (data: {
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  userId?: string | null;
  role?: string | null;
  durationMs: number;
}) => {
  if (!js) return;

  await js.publish(
    'gateway.request.logged',
    Buffer.from(JSON.stringify(data))
  );
};


