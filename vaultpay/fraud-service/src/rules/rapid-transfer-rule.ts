import { BaseRule, FraudContext, FraudRuleResult } from './base-rule';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

export class RapidTransferRule extends BaseRule {
  private limit = 5; // max 5 tx
  private windowSec = 60; // per 1 minute

  async evaluate(ctx: FraudContext): Promise<FraudRuleResult> {
    const key = `fraud:tx:${ctx.userId}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, this.windowSec);
    }

    if (count > this.limit) {
      return {
        risk: 60,
        reason: `Too many transactions in short period`,
      };
    }

    return { risk: 0 };
  }
}
