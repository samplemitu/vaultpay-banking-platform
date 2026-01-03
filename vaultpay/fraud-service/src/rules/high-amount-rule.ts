import { BaseRule, FraudContext, FraudRuleResult } from './base-rule';

export class HighAmountRule extends BaseRule {
  private threshold = 1000000; // ₹10,000 INR in paise

  async evaluate(ctx: FraudContext): Promise<FraudRuleResult> {
    if (ctx.amount > this.threshold) {
      return {
        risk: 70,
        reason: `High transaction amount > ${this.threshold}`,
      };
    }
    return { risk: 0 };
  }
}
