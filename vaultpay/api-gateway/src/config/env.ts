import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_ACCESS_PUBLIC_KEY) {
  throw new Error('JWT_ACCESS_PUBLIC_KEY must be defined');
}
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL must be defined');
}
if (!process.env.NATS_URL) {
  throw new Error('NATS_URL must be defined');
}
if (!process.env.AUTH_SERVICE_URL) {
  throw new Error('AUTH_SERVICE_URL must be defined');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),

  // JWT Verification (RS256 public key)
  jwtAccessPublicKey: process.env.JWT_ACCESS_PUBLIC_KEY!,

  // Redis
  redisUrl: process.env.REDIS_URL!,

  // JetStream
  natsUrl: process.env.NATS_URL!,

  // Rate limit global
  rateLimit: {
    windowSec: parseInt(process.env.RATE_LIMIT_WINDOW_SEC || '60', 10),
    maxRequestsPerWindow: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Downstream service endpoints
  services: {
    auth: process.env.AUTH_SERVICE_URL!,
    account: process.env.ACCOUNT_SERVICE_URL || 'http://account-service:4001',
    transaction:
      process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:4002',
    fraud: process.env.FRAUD_SERVICE_URL || 'http://fraud-service:4003',
    audit: process.env.AUDIT_SERVICE_URL || 'http://audit-service:4004',
  },
};
